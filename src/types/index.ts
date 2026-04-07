import { reminders, todos, users } from "../db/schema.js";

export type User = typeof users.$inferSelect;
export type Todo = typeof todos.$inferSelect;
export type Reminder = typeof reminders.$inferSelect;

export type NewUser = typeof users.$inferInsert;
export type NewTodo = typeof users.$inferInsert;

export type SafeUser = Omit<User, "password" | "refreshToken">;

export interface ApiResponse<T> {
  con: boolean;
  message: string;
  data?: T;
  error?: Array<{ field: string; message: string }>;
}
