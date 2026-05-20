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

export interface ChatParams {
  model?: string;
  prompt: string;
}

export interface SendMessagePayload {
  conversationId: string;
  content: string;
  tempId?: string;
}

export interface JoinConversationPayload {
  conversationId: string;
}

export interface TypingPayload {
  conversationId: string;
  isTyping: boolean;
}

export interface MessageReceivedPayload {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt?: string;
  tempId?: string;
}

export interface EditMessagePayload {
  messageId: string;
  conversationId: string;
  content: string;
}

export interface DeleteMessagePayload {
  messageId: string;
  conversationId: string;
}

export interface MessageEditedPayload {
  id: string;
  conversationId: string;
  content: string;
  isEdited: true;
  updatedAt: string;
}

export interface MessageDeletedPayload {
  id: string;
  conversationId: string;
}

export interface UserOnlinePayload {
  userId: string;
  isOnline: boolean;
}

export interface TypingEventPayload {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}
