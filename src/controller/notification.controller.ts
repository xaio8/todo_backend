import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";
import NotificationService from "../services/notification.service.js";

// list notifications for logged in user
export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;

    const result = await NotificationService.getUserNotifications(
      userId,
      page,
      limit,
    );

    res.status(200).json({
      con: true,
      message: "Notifications fetch successful",
      data: {
        notifications: result.items,
        pagination: result.meta,
      },
    });
  } catch (error) {
    next(error);
  }
};

// unread count for badge
export const getUnreadCount = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id as string;
    const unread = await NotificationService.getUnreadCount(userId);
    res.status(200).json({
      con: true,
      message: "Unread count fetch successful",
      data: { count: unread },
    });
  } catch (error) {
    next(error);
  }
};

// mark single notification read
export const markNotificationRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id as string;
    const { id } = req.params;

    const updated = await NotificationService.markRead(userId, id as string);
    if (!updated) {
      return next(new AppError("Notification not found", 404));
    }

    res.status(200).json({
      con: true,
      message: "Notification marked as read",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// mark all notifications read
export const markAllNotificationsRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id as string;
    const count = await NotificationService.markAllRead(userId);

    res.status(200).json({
      con: true,
      message: `${count} notifications marked as read`,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};
