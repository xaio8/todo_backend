import { Router } from "express";
import * as chatController from "../controller/chat.controller.js";
import { protectedRoute } from "../middleware/protectedRoute.js";

const chatRoute = Router();

chatRoute.use(protectedRoute);

chatRoute.get("/online-users", chatController.getOnlineUsers);
chatRoute.get("/conversations", chatController.getConversations);
chatRoute.get("/conversations/:id", chatController.getConversation);
chatRoute.post("/conversations/private", chatController.createPrivateChat);
chatRoute.post("/conversations/group", chatController.createGroupChat);
chatRoute.post("/conversations/:id/members", chatController.addGroupMembers);
chatRoute.get("/conversations/:id/messages", chatController.getMessages);
chatRoute.post("/conversations/:id/messages", chatController.sendMessage);
chatRoute.patch(
  "/conversations/:id/messages/:messageId",
  chatController.editMessage,
);
chatRoute.delete(
  "/conversations/:id/messages/:messageId",
  chatController.deleteMessage,
);

export default chatRoute;
