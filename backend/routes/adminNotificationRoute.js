import express from "express";
import adminAuth from "../middlewares/adminAuth.js";
import {
  getAdminNotifications,
  getAdminUnreadCount,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from "../controllers/adminNotificationController.js";

const adminNotificationRouter = express.Router();

adminNotificationRouter.get("/", adminAuth, getAdminNotifications);
adminNotificationRouter.get("/unread-count", adminAuth, getAdminUnreadCount);
adminNotificationRouter.post("/read-all", adminAuth, markAllAdminNotificationsRead);
adminNotificationRouter.post("/:id/read", adminAuth, markAdminNotificationRead);

export default adminNotificationRouter;
