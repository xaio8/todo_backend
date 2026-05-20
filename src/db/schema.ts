import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
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
export const conversationEnum = pgEnum("conversation_type", [
  "private",
  "group",
]);

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
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
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
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date()),
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

// conversation table
export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: conversationEnum("type").notNull(),
  name: varchar("name", { length: 100 }),
  createdBy: uuid("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// conversation members table
export const conversationMembers = pgTable(
  "conversation_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .references(() => conversations.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    isAdmin: boolean("is_admin").default(false).notNull(),
    joinedAt: timestamp("joined_at").defaultNow(),
  },
  (table) => ({
    uniqueMember: uniqueIndex("unique_member").on(
      table.conversationId,
      table.userId,
    ),
    conversationIdx: index("conversation_member_conversation_idx").on(
      table.conversationId,
    ),
    userIdx: index("conversation_member_user_idx").on(table.userId),
  }),
);

// messages table
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .references(() => conversations.id, { onDelete: "cascade" })
      .notNull(),
    senderId: uuid("sender_id").references(() => users.id, {
      onDelete: "set null",
    }),
    content: text("content").notNull(),
    isDeleted: boolean("is_deleted").default(false).notNull(),
    isEdited: boolean("is_edited").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => ({
    conversationIdx: index("messages_conversation_idx").on(
      table.conversationId,
    ),

    senderIdx: index("messages_sender_idx").on(table.senderId),
  }),
);
