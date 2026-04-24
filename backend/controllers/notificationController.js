import notificationModel from "../models/notificationModel.js";
import bookingModel from "../models/bookingModel.js";
import { composeNotificationMessage } from "../services/userNotifications.js";

export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await notificationModel
      .find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const bookingIds = [
      ...new Set(
        notifications.map((n) => n.bookingId).filter(Boolean).map(String),
      ),
    ];

    const bookings =
      bookingIds.length > 0
        ? await bookingModel
            .find({ _id: { $in: bookingIds } })
            .populate("tourId", "title city")
            .lean()
        : [];

    const bookingById = new Map(bookings.map((b) => [String(b._id), b]));
    const ownerId = String(req.userId);

    const enriched = notifications.map((n) => {
      if (!n.bookingId) return n;
      const booking = bookingById.get(String(n.bookingId));
      if (!booking || String(booking.userId) !== ownerId) return n;
      const nextMessage = composeNotificationMessage(n.type, booking, n.meta || {});
      if (!nextMessage) return n;
      return { ...n, message: nextMessage };
    });

    res.json({ success: true, notifications: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await notificationModel.countDocuments({
      userId: req.userId,
      read: false,
    });
    res.json({ success: true, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await notificationModel.updateOne(
      { _id: id, userId: req.userId },
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

export const markAllNotificationsRead = async (req, res) => {
  try {
    await notificationModel.updateMany(
      { userId: req.userId, read: false },
      { $set: { read: true } },
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
