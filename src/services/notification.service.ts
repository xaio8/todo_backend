import { and, count, desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { notifications } from "../db/schema.js";
import { Notification, PaginationResult } from "../types/index.js";
import { emitToUser } from "../socket/ioInstance.js";

export interface CreateNotificationInput {
  userId: string;
  type: "todo_reminder" | "message" | "system";
  title: string;
  body?: string | null;
  referenceId?: string | null;
}

class NotificationService {
  // persist + push live to the user's sockets
  static async create(input: CreateNotificationInput): Promise<Notification> {
    const [row] = await db
      .insert(notifications)
      .values({
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        referenceId: input.referenceId ?? null,
      })
      .returning();

    emitToUser(input.userId, "notification:new", row);
    return row;
  }

  static async getUserNotifications(
    userId: string,
    page: number,
    limit: number,
  ): Promise<PaginationResult<Notification>> {
    const offset = (page - 1) * limit;
    const [data, totalCount] = await Promise.all([
      db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ value: count() })
        .from(notifications)
        .where(eq(notifications.userId, userId)),
    ]);

    const totalItems = totalCount[0].value;
    return {
      items: data,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        limit,
      },
    };
  }

  static async getUnreadCount(userId: string): Promise<number> {
    const [row] = await db
      .select({ value: count() })
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
      );
    return row.value;
  }

  static async markRead(userId: string, id: string) {
    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(eq(notifications.id, id), eq(notifications.userId, userId)),
      )
      .returning();
    return updated ?? null;
  }

  static async markAllRead(userId: string): Promise<number> {
    const updated = await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
      )
      .returning({ id: notifications.id });
    return updated.length;
  }
}

export default NotificationService;
