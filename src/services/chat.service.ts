import { and, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  conversationMembers,
  conversations,
  messages,
  users,
} from "../db/schema.js";
import {
  MessageDeletedPayload,
  MessageEditedPayload,
  MessageReceivedPayload,
} from "../types/index.js";
import OnlineUsersService from "./onlineUsers.service.js";

export class ChatService {
  static async isMember(conversationId: string, userId: string) {
    const [member] = await db
      .select({ id: conversationMembers.id })
      .from(conversationMembers)
      .where(
        and(
          eq(conversationMembers.conversationId, conversationId),
          eq(conversationMembers.userId, userId),
        ),
      )
      .limit(1);

    return !!member;
  }

  static async findPrivateConversation(userId1: string, userId2: string) {
    const user1Conversations = await db
      .select({ conversationId: conversationMembers.conversationId })
      .from(conversationMembers)
      .innerJoin(
        conversations,
        eq(conversations.id, conversationMembers.conversationId),
      )
      .where(
        and(
          eq(conversationMembers.userId, userId1),
          eq(conversations.type, "private"),
        ),
      );

    if (user1Conversations.length === 0) return null;

    const ids = user1Conversations.map((c) => c.conversationId);

    const [match] = await db
      .select({ conversationId: conversationMembers.conversationId })
      .from(conversationMembers)
      .innerJoin(
        conversations,
        eq(conversations.id, conversationMembers.conversationId),
      )
      .where(
        and(
          eq(conversationMembers.userId, userId2),
          eq(conversations.type, "private"),
          inArray(conversationMembers.conversationId, ids),
        ),
      )
      .limit(1);

    return match?.conversationId ?? null;
  }

  static async createPrivateConversation(
    currentUserId: string,
    targetUserId: string,
  ) {
    if (currentUserId === targetUserId) {
      throw new Error("Cannot start a private chat with yourself");
    }

    const [targetUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (!targetUser) {
      throw new Error("User not found");
    }

    const existingId = await this.findPrivateConversation(
      currentUserId,
      targetUserId,
    );
    if (existingId) {
      return this.getConversationById(existingId, currentUserId);
    }

    const [conversation] = await db
      .insert(conversations)
      .values({
        type: "private",
        createdBy: currentUserId,
      })
      .returning();

    await db.insert(conversationMembers).values([
      { conversationId: conversation.id, userId: currentUserId },
      { conversationId: conversation.id, userId: targetUserId },
    ]);

    return this.getConversationById(conversation.id, currentUserId);
  }

  static async createGroupConversation(
    currentUserId: string,
    name: string,
    memberIds: string[],
  ) {
    const uniqueMemberIds = [
      ...new Set([currentUserId, ...memberIds]),
    ].filter(Boolean);

    if (uniqueMemberIds.length < 2) {
      throw new Error("A group chat requires at least 2 members");
    }

    const existingUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.id, uniqueMemberIds));

    if (existingUsers.length !== uniqueMemberIds.length) {
      throw new Error("One or more members were not found");
    }

    const [conversation] = await db
      .insert(conversations)
      .values({
        type: "group",
        name,
        createdBy: currentUserId,
      })
      .returning();

    await db.insert(conversationMembers).values(
      uniqueMemberIds.map((userId) => ({
        conversationId: conversation.id,
        userId,
        isAdmin: userId === currentUserId,
      })),
    );

    return this.getConversationById(conversation.id, currentUserId);
  }

  static async getConversationMembers(conversationId: string) {
    const members = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        isAdmin: conversationMembers.isAdmin,
        joinedAt: conversationMembers.joinedAt,
      })
      .from(conversationMembers)
      .innerJoin(users, eq(users.id, conversationMembers.userId))
      .where(eq(conversationMembers.conversationId, conversationId));

    return members.map((member) => ({
      ...member,
      isOnline: OnlineUsersService.isOnline(member.id),
    }));
  }

  static async getConversationById(conversationId: string, userId: string) {
    const isMember = await this.isMember(conversationId, userId);
    if (!isMember) {
      throw new Error("Conversation not found");
    }

    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const members = await this.getConversationMembers(conversationId);

    const [lastMessage] = await db
      .select({
        id: messages.id,
        content: messages.content,
        senderId: messages.senderId,
        isEdited: messages.isEdited,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, conversationId),
          eq(messages.isDeleted, false),
        ),
      )
      .orderBy(desc(messages.createdAt))
      .limit(1);

    return {
      ...conversation,
      members,
      lastMessage: lastMessage ?? null,
    };
  }

  static async getUserConversations(userId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;

    const memberRows = await db
      .select({ conversationId: conversationMembers.conversationId })
      .from(conversationMembers)
      .where(eq(conversationMembers.userId, userId));

    const conversationIds = memberRows.map((row) => row.conversationId);

    if (conversationIds.length === 0) {
      return {
        conversations: [],
        meta: { total: 0, totalPages: 0, currentPage: page, limit },
      };
    }

    const [data, totalCount] = await Promise.all([
      db
        .select()
        .from(conversations)
        .where(inArray(conversations.id, conversationIds))
        .orderBy(desc(conversations.updatedAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ value: count() })
        .from(conversations)
        .where(inArray(conversations.id, conversationIds)),
    ]);

    const enriched = await Promise.all(
      data.map(async (conversation) => {
        const members = await this.getConversationMembers(conversation.id);

        const [lastMessage] = await db
          .select({
            id: messages.id,
            content: messages.content,
            senderId: messages.senderId,
            isEdited: messages.isEdited,
            createdAt: messages.createdAt,
          })
          .from(messages)
          .where(
            and(
              eq(messages.conversationId, conversation.id),
              eq(messages.isDeleted, false),
            ),
          )
          .orderBy(desc(messages.createdAt))
          .limit(1);

        return {
          ...conversation,
          members,
          lastMessage: lastMessage ?? null,
        };
      }),
    );

    const total = totalCount[0].value;
    return {
      conversations: enriched,
      meta: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    };
  }

  static async getMessages(
    conversationId: string,
    userId: string,
    page: number,
    limit: number,
  ) {
    const isMember = await this.isMember(conversationId, userId);
    if (!isMember) {
      throw new Error("Conversation not found");
    }

    const offset = (page - 1) * limit;

    const [data, totalCount] = await Promise.all([
      db
        .select({
          id: messages.id,
          conversationId: messages.conversationId,
          senderId: messages.senderId,
          senderName: users.name,
          content: messages.content,
          isDeleted: messages.isDeleted,
          isEdited: messages.isEdited,
          createdAt: messages.createdAt,
          updatedAt: messages.updatedAt,
        })
        .from(messages)
        .leftJoin(users, eq(users.id, messages.senderId))
        .where(
          and(
            eq(messages.conversationId, conversationId),
            eq(messages.isDeleted, false),
          ),
        )
        .orderBy(desc(messages.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ value: count() })
        .from(messages)
        .where(
          and(
            eq(messages.conversationId, conversationId),
            eq(messages.isDeleted, false),
          ),
        ),
    ]);

    const total = totalCount[0].value;
    return {
      messages: data.reverse(),
      meta: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    };
  }

  static async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    tempId?: string,
  ): Promise<MessageReceivedPayload> {
    const trimmed = content.trim();
    if (!trimmed) {
      throw new Error("Message content cannot be empty");
    }

    const isMember = await this.isMember(conversationId, senderId);
    if (!isMember) {
      throw new Error("You are not a member of this conversation");
    }

    const [sender] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, senderId))
      .limit(1);

    const [message] = await db
      .insert(messages)
      .values({
        conversationId,
        senderId,
        content: trimmed,
      })
      .returning();

    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));

    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId!,
      senderName: sender?.name ?? "Unknown",
      content: message.content,
      isEdited: message.isEdited,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt?.toISOString(),
      tempId,
    };
  }

  static async editMessage(
    messageId: string,
    conversationId: string,
    userId: string,
    content: string,
  ): Promise<MessageEditedPayload> {
    const trimmed = content.trim();
    if (!trimmed) {
      throw new Error("Message content cannot be empty");
    }

    const isMember = await this.isMember(conversationId, userId);
    if (!isMember) {
      throw new Error("You are not a member of this conversation");
    }

    const [existing] = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.id, messageId),
          eq(messages.conversationId, conversationId),
          eq(messages.isDeleted, false),
        ),
      )
      .limit(1);

    if (!existing) {
      throw new Error("Message not found");
    }

    if (existing.senderId !== userId) {
      throw new Error("You can only edit your own messages");
    }

    const now = new Date();
    const [updated] = await db
      .update(messages)
      .set({
        content: trimmed,
        isEdited: true,
        updatedAt: now,
      })
      .where(eq(messages.id, messageId))
      .returning();

    await db
      .update(conversations)
      .set({ updatedAt: now })
      .where(eq(conversations.id, conversationId));

    return {
      id: updated.id,
      conversationId: updated.conversationId,
      content: updated.content,
      isEdited: true,
      updatedAt: now.toISOString(),
    };
  }

  static async deleteMessage(
    messageId: string,
    conversationId: string,
    userId: string,
  ): Promise<MessageDeletedPayload> {
    const isMember = await this.isMember(conversationId, userId);
    if (!isMember) {
      throw new Error("You are not a member of this conversation");
    }

    const [existing] = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.id, messageId),
          eq(messages.conversationId, conversationId),
          eq(messages.isDeleted, false),
        ),
      )
      .limit(1);

    if (!existing) {
      throw new Error("Message not found");
    }

    if (existing.senderId !== userId) {
      throw new Error("You can only delete your own messages");
    }

    await db
      .update(messages)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(messages.id, messageId));

    return { id: messageId, conversationId };
  }

  static getOnlineUserIds() {
    return OnlineUsersService.getOnlineUserIds();
  }

  static async addGroupMembers(
    conversationId: string,
    adminUserId: string,
    memberIds: string[],
  ) {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conversation || conversation.type !== "group") {
      throw new Error("Group conversation not found");
    }

    const [adminMember] = await db
      .select({ isAdmin: conversationMembers.isAdmin })
      .from(conversationMembers)
      .where(
        and(
          eq(conversationMembers.conversationId, conversationId),
          eq(conversationMembers.userId, adminUserId),
        ),
      )
      .limit(1);

    if (!adminMember?.isAdmin) {
      throw new Error("Only group admins can add members");
    }

    const uniqueIds = [...new Set(memberIds)].filter(Boolean);
    if (uniqueIds.length === 0) {
      throw new Error("No members to add");
    }

    const existingUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.id, uniqueIds));

    if (existingUsers.length !== uniqueIds.length) {
      throw new Error("One or more members were not found");
    }

    const existingMembers = await db
      .select({ userId: conversationMembers.userId })
      .from(conversationMembers)
      .where(
        and(
          eq(conversationMembers.conversationId, conversationId),
          inArray(conversationMembers.userId, uniqueIds),
        ),
      );

    const existingSet = new Set(existingMembers.map((m) => m.userId));
    const toAdd = uniqueIds.filter((id) => !existingSet.has(id));

    if (toAdd.length === 0) {
      throw new Error("All users are already members");
    }

    await db.insert(conversationMembers).values(
      toAdd.map((userId) => ({
        conversationId,
        userId,
        isAdmin: false,
      })),
    );

    return this.getConversationById(conversationId, adminUserId);
  }

  static conversationRoom(conversationId: string) {
    return `conversation:${conversationId}`;
  }

  static userRoom(userId: string) {
    return `user:${userId}`;
  }
}
