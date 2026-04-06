import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { todos } from "../db/schema.js";

export class TodoService {
  // get all todos by user
  static async getUserTodos(userId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [data, totalCount] = await Promise.all([
      db
        .select()
        .from(todos)
        .where(eq(todos.userId, userId))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(todos.createdAt)),
      db.select({ value: count() }).from(todos).where(eq(todos.userId, userId)),
    ]);

    const totalTodos = totalCount[0].value;
    const totalPages = Math.ceil(totalTodos / limit);
    return {
      todos: data,
      meta: {
        totalTodos,
        totalPages,
        currentPage: page,
        limit,
      },
    };
  }

  // get todos by today date
  static async getTodosByDate(userId: string, targetDate: string) {
    return await db
      .select()
      .from(todos)
      .where(
        and(
          eq(todos.userId, userId),
          sql`DATE(${todos.createdAt})= ${targetDate}`,
        ),
      )
      .orderBy(desc(todos.createdAt));
  }

  // get all todos by admin
  static async getAllTodosForAdmin(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [data, totalCount] = await Promise.all([
      db
        .select()
        .from(todos)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(todos.createdAt)),
      db.select({ value: count() }).from(todos),
    ]);

    const totalTodos = totalCount[0].value;
    const totalPages = Math.ceil(totalTodos / limit);
    return {
      todos: data,
      meta: {
        totalTodos,
        totalPages,
        currentPage: page,
        limit,
      },
    };
  }

  //   delete todo by admin
  static async deleteTodoByAdmin(id: string) {
    const [deleted] = await db
      .delete(todos)
      .where(eq(todos.id, id as string))
      .returning();
    return deleted;
  }

  // delete all todos by admin
  static async deleteAllTodos() {
    return await db.delete(todos).returning();
  }
}
