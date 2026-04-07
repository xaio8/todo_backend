import { Request, Response, NextFunction } from "express";
import { db } from "../db/index.js";
import { todos } from "../db/schema.js";
import { AppError } from "../utils/AppError.js";
import { and, eq } from "drizzle-orm";
import z from "zod";
import { TodoService } from "../services/todo.service.js";

export const createTodoSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z.iso.datetime().nullable().optional(),
  scheduledAt: z.iso.datetime().nullable().optional(),
  isAllDay: z.boolean().optional(),
});

export const updateTodoSchema = createTodoSchema.partial();

// get todos by date
export const getTodayTodos = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const dateQuery =
      (req.query.date as string) || new Date().toISOString().split("T")[0];
    const result = await TodoService.getTodosByDate(
      userId as string,
      dateQuery,
    );
    res.status(200).json({
      con: true,
      message: `Fetch todos by date ${dateQuery}`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// GET all todos for a specific user
export const getAllTodos = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!userId) {
      return next(new AppError("User ID is required to fetch todos", 400));
    }

    const result = await TodoService.getUserTodos(
      userId as string,
      page,
      limit,
    );

    res.status(200).json({
      con: true,
      message: "Todos fetch successful",
      data: {
        todos: result.todos,
        pagination: result.meta,
      },
    });
  } catch (error) {
    next(error);
  }
};

// CREATE a new todo
export const createTodo = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const createTodo = createTodoSchema.parse(req.body);

    if (!userId) {
      return next(new AppError("User ID are required", 400));
    }

    const newTodo = await db
      .insert(todos)
      .values({
        userId,
        ...createTodo,
        dueDate: createTodo.dueDate ? new Date(createTodo.dueDate) : null,
        scheduledAt: createTodo.scheduledAt
          ? new Date(createTodo.scheduledAt)
          : null,
      })
      .returning();

    res.status(201).json({
      con: true,
      message: "Todo created successfully",
      data: newTodo[0],
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE a todo
export const updateTodo = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const validation = updateTodoSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        con: false,
        message: "validation failed",
        error: validation.error,
      });
    }

    const validatedData = validation.data;

    const [updatedTodo] = await db
      .update(todos)
      .set({
        ...validatedData,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        scheduledAt: validatedData.scheduledAt
          ? new Date(validatedData.scheduledAt)
          : null,
        updatedAt: new Date(),
      })
      .where(
        and(eq(todos.id, id as string), eq(todos.userId, userId as string)),
      )
      .returning();

    if (!updatedTodo) {
      return next(new AppError("Todo not found", 404));
    }

    res.status(200).json({
      con: true,
      message: "Update successful",
      data: updatedTodo,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE a todo
export const deleteTodo = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const [deleted] = await db
      .delete(todos)
      .where(
        and(eq(todos.id, id as string), eq(todos.userId, userId as string)),
      )
      .returning();

    if (!deleted) {
      return next(new AppError("Todo not found", 404));
    }

    res.status(200).json({
      con: true,
      message: "Todo deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// FOR ADMIN
//get all todos
export const getAllTodosByAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await TodoService.getAllTodosForAdmin(page, limit);
    res.status(200).json({
      con: true,
      message: "Fetch todos successful",
      data: {
        todos: result.todos,
        pagination: result.meta,
      },
    });
  } catch (error) {
    next(error);
  }
};

// delete todo by admin
export const deleteAnyTodo = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const deleted = await TodoService.deleteTodoByAdmin(id as string);
    if (!deleted) {
      return next(new AppError("Todo not found", 404));
    }

    res.status(200).json({
      con: true,
      message: "Admin deleted todo successfully",
    });
  } catch (error) {
    next(error);
  }
};
