import { Router } from "express";
import * as notificationController from "../controller/notification.controller.js";
import { protectedRoute } from "../middleware/protectedRoute.js";

const notificationRoute = Router();

notificationRoute.use(protectedRoute);
notificationRoute.get("/", notificationController.getNotifications);
notificationRoute.get("/unread-count", notificationController.getUnreadCount);
notificationRoute.patch(
  "/read-all",
  notificationController.markAllNotificationsRead,
);
notificationRoute.patch(
  "/:id/read",
  notificationController.markNotificationRead,
);

export default notificationRoute;
