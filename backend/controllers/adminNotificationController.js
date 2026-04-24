import adminNotificationModel from "../models/adminNotificationModel.js";

export const getAdminNotifications = async (_req, res) => {
  try {
    const notifications = await adminNotificationModel
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAdminUnreadCount = async (_req, res) => {
  try {
    const unreadCount = await adminNotificationModel.countDocuments({ read: false });
    res.json({ success: true, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAdminNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await adminNotificationModel.updateOne(
      { _id: id },
      { $set: { read: true } },
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy thông báo" });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllAdminNotificationsRead = async (_req, res) => {
  try {
    await adminNotificationModel.updateMany({ read: false }, { $set: { read: true } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
