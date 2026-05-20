import { Server } from "socket.io";
import {
  authenticateSocket,
  AuthenticatedSocket,
} from "../middleware/socketAuth.js";
import { ChatService } from "../services/chat.service.js";
import OnlineUsersService from "../services/onlineUsers.service.js";
import {
  DeleteMessagePayload,
  EditMessagePayload,
  JoinConversationPayload,
  SendMessagePayload,
  TypingPayload,
} from "../types/index.js";

export const registerChatHandlers = (io: Server) => {
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const { id: userId } = authSocket.user;

    socket.join(ChatService.userRoom(userId));

    const cameOnline = OnlineUsersService.addConnection(userId, socket.id);

    socket.emit("connected", {
      userId,
      message: "Connected to chat server",
    });

    socket.emit("online_users", {
      onlineUserIds: ChatService.getOnlineUserIds(),
    });

    if (cameOnline) {
      io.emit("user_online", { userId, isOnline: true });
    }

    socket.on("join_conversation", async (payload: JoinConversationPayload) => {
      try {
        const { conversationId } = payload;
        if (!conversationId) {
          socket.emit("error", { message: "conversationId is required" });
          return;
        }

        const isMember = await ChatService.isMember(conversationId, userId);
        if (!isMember) {
          socket.emit("error", {
            message: "You are not a member of this conversation",
          });
          return;
        }

        await socket.join(ChatService.conversationRoom(conversationId));

        const members = await ChatService.getConversationMembers(conversationId);
        const onlineUserIds = members
          .filter((m) => m.isOnline)
          .map((m) => m.id);

        socket.emit("joined_conversation", { conversationId, onlineUserIds });
      } catch {
        socket.emit("error", { message: "Failed to join conversation" });
      }
    });

    socket.on("leave_conversation", (payload: JoinConversationPayload) => {
      const { conversationId } = payload;
      if (!conversationId) return;
      socket.leave(ChatService.conversationRoom(conversationId));
      socket.emit("left_conversation", { conversationId });
    });

    socket.on("send_message", async (payload: SendMessagePayload) => {
      try {
        const { conversationId, content, tempId } = payload;

        if (!conversationId || !content) {
          socket.emit("error", {
            message: "conversationId and content are required",
          });
          return;
        }

        const message = await ChatService.sendMessage(
          conversationId,
          userId,
          content,
          tempId,
        );

        io.to(ChatService.conversationRoom(conversationId)).emit(
          "message_received",
          message,
        );
      } catch (error) {
        socket.emit("error", {
          message:
            error instanceof Error ? error.message : "Failed to send message",
        });
      }
    });

    socket.on("edit_message", async (payload: EditMessagePayload) => {
      try {
        const { messageId, conversationId, content } = payload;

        if (!messageId || !conversationId || !content) {
          socket.emit("error", {
            message: "messageId, conversationId and content are required",
          });
          return;
        }

        const message = await ChatService.editMessage(
          messageId,
          conversationId,
          userId,
          content,
        );

        io.to(ChatService.conversationRoom(conversationId)).emit(
          "message_edited",
          message,
        );
      } catch (error) {
        socket.emit("error", {
          message:
            error instanceof Error ? error.message : "Failed to edit message",
        });
      }
    });

    socket.on("delete_message", async (payload: DeleteMessagePayload) => {
      try {
        const { messageId, conversationId } = payload;

        if (!messageId || !conversationId) {
          socket.emit("error", {
            message: "messageId and conversationId are required",
          });
          return;
        }

        const result = await ChatService.deleteMessage(
          messageId,
          conversationId,
          userId,
        );

        io.to(ChatService.conversationRoom(conversationId)).emit(
          "message_deleted",
          result,
        );
      } catch (error) {
        socket.emit("error", {
          message:
            error instanceof Error ? error.message : "Failed to delete message",
        });
      }
    });

    socket.on("typing", async (payload: TypingPayload) => {
      try {
        const { conversationId, isTyping } = payload;
        if (!conversationId) return;

        const isMember = await ChatService.isMember(conversationId, userId);
        if (!isMember) return;

        socket
          .to(ChatService.conversationRoom(conversationId))
          .emit("user_typing", {
            conversationId,
            userId,
            isTyping,
          });
      } catch {
        // typing events are best-effort
      }
    });

    socket.on("disconnect", () => {
      const wentOffline = OnlineUsersService.removeConnection(
        userId,
        socket.id,
      );

      if (wentOffline) {
        io.emit("user_offline", { userId, isOnline: false });
      }
    });
  });
};
