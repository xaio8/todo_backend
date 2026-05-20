import { Request, Response, NextFunction } from "express";
import z from "zod";
import { AppError } from "../utils/AppError.js";
import { ChatService } from "../services/chat.service.js";

export const createPrivateChatSchema = z.object({
  targetUserId: z.uuid("Invalid user id"),
});

export const createGroupChatSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100),
  memberIds: z.array(z.uuid("Invalid user id")).min(1, "At least one member is required"),
});

export const addGroupMembersSchema = z.object({
  memberIds: z.array(z.uuid("Invalid user id")).min(1, "At least one member is required"),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, "Message content is required").max(5000),
});

export const editMessageSchema = z.object({
  content: z.string().min(1, "Message content is required").max(5000),
});

export const getConversations = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await ChatService.getUserConversations(userId, page, limit);

    res.status(200).json({
      con: true,
      message: "Conversations fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getConversation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const id = req.params.id as string;

    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    const conversation = await ChatService.getConversationById(id, userId);

    res.status(200).json({
      con: true,
      message: "Conversation fetched successfully",
      data: conversation,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Conversation not found") {
      return next(new AppError(error.message, 404));
    }
    next(error);
  }
};

export const createPrivateChat = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    const parsed = createPrivateChatSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        con: false,
        message: "Validation failed",
        error: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const conversation = await ChatService.createPrivateConversation(
      userId,
      parsed.data.targetUserId,
    );

    res.status(201).json({
      con: true,
      message: "Private chat ready",
      data: conversation,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "User not found") {
        return next(new AppError(error.message, 404));
      }
      if (error.message === "Cannot start a private chat with yourself") {
        return next(new AppError(error.message, 400));
      }
    }
    next(error);
  }
};

export const createGroupChat = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    const parsed = createGroupChatSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        con: false,
        message: "Validation failed",
        error: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const conversation = await ChatService.createGroupConversation(
      userId,
      parsed.data.name,
      parsed.data.memberIds,
    );

    res.status(201).json({
      con: true,
      message: "Group chat created successfully",
      data: conversation,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return next(new AppError(error.message, 404));
      }
      if (error.message.includes("requires at least")) {
        return next(new AppError(error.message, 400));
      }
    }
    next(error);
  }
};

export const getMessages = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const id = req.params.id as string;

    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await ChatService.getMessages(id, userId, page, limit);

    res.status(200).json({
      con: true,
      message: "Messages fetched successfully",
      data: result,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Conversation not found") {
      return next(new AppError(error.message, 404));
    }
    next(error);
  }
};

export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const id = req.params.id as string;

    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    const parsed = sendMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        con: false,
        message: "Validation failed",
        error: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const message = await ChatService.sendMessage(
      id,
      userId,
      parsed.data.content,
    );

    res.status(201).json({
      con: true,
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "You are not a member of this conversation") {
        return next(new AppError(error.message, 403));
      }
      if (error.message === "Message content cannot be empty") {
        return next(new AppError(error.message, 400));
      }
    }
    next(error);
  }
};

export const editMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const messageId = req.params.messageId as string;
    const conversationId = req.params.id as string;

    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    const parsed = editMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        con: false,
        message: "Validation failed",
        error: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const message = await ChatService.editMessage(
      messageId,
      conversationId,
      userId,
      parsed.data.content,
    );

    res.status(200).json({
      con: true,
      message: "Message edited successfully",
      data: message,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Message not found") {
        return next(new AppError(error.message, 404));
      }
      if (
        error.message === "You can only edit your own messages" ||
        error.message === "You are not a member of this conversation"
      ) {
        return next(new AppError(error.message, 403));
      }
      if (error.message === "Message content cannot be empty") {
        return next(new AppError(error.message, 400));
      }
    }
    next(error);
  }
};

export const deleteMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const messageId = req.params.messageId as string;
    const conversationId = req.params.id as string;

    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    const result = await ChatService.deleteMessage(
      messageId,
      conversationId,
      userId,
    );

    res.status(200).json({
      con: true,
      message: "Message deleted successfully",
      data: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Message not found") {
        return next(new AppError(error.message, 404));
      }
      if (
        error.message === "You can only delete your own messages" ||
        error.message === "You are not a member of this conversation"
      ) {
        return next(new AppError(error.message, 403));
      }
    }
    next(error);
  }
};

export const getOnlineUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user?.id) {
      return next(new AppError("Unauthorized", 401));
    }

    res.status(200).json({
      con: true,
      message: "Online users fetched successfully",
      data: { onlineUserIds: ChatService.getOnlineUserIds() },
    });
  } catch (error) {
    next(error);
  }
};

export const addGroupMembers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const id = req.params.id as string;

    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    const parsed = addGroupMembersSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        con: false,
        message: "Validation failed",
        error: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const conversation = await ChatService.addGroupMembers(
      id,
      userId,
      parsed.data.memberIds,
    );

    res.status(200).json({
      con: true,
      message: "Members added successfully",
      data: conversation,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return next(new AppError(error.message, 404));
      }
      if (
        error.message.includes("admin") ||
        error.message.includes("already members") ||
        error.message.includes("No members")
      ) {
        return next(new AppError(error.message, 400));
      }
    }
    next(error);
  }
};
