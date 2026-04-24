import express from "express";
import authMiddleware from "../middlewares/auth.js";
import {
  getMyNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/notificationController.js";

const notificationRouter = express.Router();

notificationRouter.get("/", authMiddleware, getMyNotifications);
notificationRouter.get("/unread-count", authMiddleware, getUnreadCount);
notificationRouter.post("/read-all", authMiddleware, markAllNotificationsRead);
notificationRouter.post("/:id/read", authMiddleware, markNotificationRead);

export default notificationRouter;
