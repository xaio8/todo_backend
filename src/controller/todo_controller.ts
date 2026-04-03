import { Request, Response, NextFunction } from "express";
import { db } from "../db/index.js";
import { todos } from "../db/schema.js";
import { AppError } from "../utils/AppError.js";
import { eq } from "drizzle-orm";

// GET all todos for a specific user
export const getAllTodos = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // In a real app, user_id would come from your Auth middleware (req.user.id)
    const { userId } = req.query;

    if (!userId) {
      return next(new AppError("User ID is required to fetch todos", 400));
    }

    const userTodos = await db
      .select()
      .from(todos)
      .where(eq(todos.userId, userId as string));

    res.status(200).json({
      con: true,
      data: userTodos,
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
    const {
      title,
      description,
      userId,
      priority,
      dueDate,
      scheduledAt,
      isAllDay,
    } = req.body;

    if (!title || !userId) {
      return next(new AppError("Title and User ID are required", 400));
    }

    const newTodo = await db
      .insert(todos)
      .values({
        userId,
        title,
        description,
        priority: priority || "medium",
        dueDate: dueDate ? new Date(dueDate) : null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        isAllDay: isAllDay ?? false,
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

// UPDATE a todo status
// export const updateTodoStatus = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;

//     const updatedTodo = await db
//       .update(todos)
//       .set({
//         status,
//         updatedAt: new Date()
//       })
//       .where(eq(todos.id, id))
//       .returning();

//     if (updatedTodo.length === 0) {
//       return next(new AppError("Todo not found", 404));
//     }

//     res.status(200).json({
//       con: true,
//       data: updatedTodo[0]
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// DELETE a todo
export const deleteTodo = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const deleted = await db
      .delete(todos)
      .where(eq(todos.id, id as string))
      .returning();

    if (deleted.length === 0) {
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
