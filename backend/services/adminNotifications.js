import adminNotificationModel from "../models/adminNotificationModel.js";
import { getSocketIO } from "./socketRegistry.js";
import { getBookingShortCodePlain } from "../utils/bookingShortCode.js";

/** Cùng chuỗi với chat: admin join phòng này để nhận thông báo realtime */
export const ADMIN_SOCKET_ROOM = "ADMIN";

const bookingShortCode = (booking) => getBookingShortCodePlain(booking);

const formatDeparture = (booking) => {
  if (!booking?.bookAt) return "—";
  try {
    return new Date(booking.bookAt).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

async function persistAdminNotification({ type, title, message, meta = {} }) {
  const doc = await adminNotificationModel.create({
    type,
    title,
    message,
    read: false,
    meta,
  });
  const io = getSocketIO();
  if (io) {
    io.to(ADMIN_SOCKET_ROOM).emit("admin_notification", {
      notification: doc.toObject(),
    });
  }
  return doc;
}

export async function notifyAdminNewBooking(booking) {
  if (!booking?._id) return null;
  const code = bookingShortCode(booking);
  const customer = String(booking.name || "Khách").trim() || "Khách";
  const tour = String(booking.tourTitle || "Tour").trim();
  const dateStr = formatDeparture(booking);
  const message = `Đơn mới #${code}: ${customer} vừa đặt "${tour}", khởi hành ngày ${dateStr}.`;
  try {
    return await persistAdminNotification({
      type: "new_booking",
      title: "Đơn đặt tour mới",
      message,
      meta: { bookingId: String(booking._id), code },
    });
  } catch (e) {
    console.error("[admin-notification] new_booking:", e.message);
    return null;
  }
}

export async function notifyAdminCancelRequest(booking) {
  if (!booking?._id) return null;
  const code = bookingShortCode(booking);
  const customer = String(booking.name || "Khách").trim() || "Khách";
  const tour = String(booking.tourTitle || "Tour").trim();
  const dateStr = formatDeparture(booking);
  const message = `Yêu cầu hủy #${code}: ${customer} — "${tour}", khởi hành ${dateStr}. Vui lòng vào Quản lý đặt tour để duyệt.`;
  try {
    return await persistAdminNotification({
      type: "cancel_request",
      title: "Cần duyệt hủy tour",
      message,
      meta: { bookingId: String(booking._id), code },
    });
  } catch (e) {
    console.error("[admin-notification] cancel_request:", e.message);
    return null;
  }
}
