import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { reminders } from "../db/schema.js";

class ReminderService {
  // replace pending (unsent) reminders for a todo - already-sent ones stay as history
  static async replaceForTodo(
    todoId: string,
    userId: string,
    remindAt: Date[],
  ): Promise<void> {
    await db.delete(reminders).where(
      and(eq(reminders.todoId, todoId), eq(reminders.isSent, false)),
    );

    if (remindAt.length === 0) return;

    await db.insert(reminders).values(
      remindAt.map((date) => ({
        todoId,
        userId,
        remindAt: date,
      })),
    );
  }
}

export default ReminderService;
