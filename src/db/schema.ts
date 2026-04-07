import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

//register enum
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const todoStatusEnum = pgEnum("todo_status", [
  "pending",
  "in_progress",
  "completed",
]);
export const priorityEnum = pgEnum("priority", ["low", "medium", "high"]);

// user table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password").notNull(),
  role: userRoleEnum("role").default("user"),
  refreshToken: text("refreshToken"),
  isVerified: boolean("is_verified").default(false),
  verifyToken: text("verify_token"),
  verifyTokenExpiry: timestamp("verify_token_expiry"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

//todos tables
export const todos = pgTable(
  "todos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    status: todoStatusEnum("status").default("pending"),
    priority: priorityEnum("priority").default("medium"),
    dueDate: timestamp("due_date"),
    scheduledAt: timestamp("scheduled_at"),
    isAllDay: boolean("is_all_day").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("user_idx").on(table.userId),
    index("schedule_idx").on(table.scheduledAt),
    index("due_idx").on(table.dueDate),
  ],
);

//reminders tables (options) for notification
export const reminders = pgTable("reminders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  todoId: uuid("todo_id")
    .notNull()
    .references(() => todos.id, { onDelete: "cascade" }),
  remindAt: timestamp("remind_at").notNull(),
  isSent: boolean("is_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
