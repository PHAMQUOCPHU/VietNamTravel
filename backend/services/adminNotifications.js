import adminNotificationModel from "../models/adminNotificationModel.js";
import siteConfigModel from "../models/siteConfigModel.js";
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

async function isAdminNotifEnabled(key) {
  try {
    const doc = await siteConfigModel
      .findOne({ key: "default" })
      .select("notifications")
      .lean();
    const n = doc?.notifications || {};
    const v = n?.[key];
    // undefined => mặc định bật để không làm "mất" thông báo khi chưa cấu hình
    return v === undefined ? true : Boolean(v);
  } catch {
    // nếu DB lỗi, ưu tiên vẫn gửi để không mất thông báo vận hành
    return true;
  }
}

export async function notifyAdminNewBooking(booking) {
  if (!(await isAdminNotifEnabled("newOrder"))) return null;
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
  if (!(await isAdminNotifEnabled("cancelRequest"))) return null;
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

export async function notifyAdminAccountCreated(user) {
  if (!(await isAdminNotifEnabled("newUser"))) return null;
  const id = user?._id != null ? String(user._id) : "";
  if (!id) return null;
  const name = String(user?.name || "Tài khoản mới").trim();
  const email = String(user?.email || "").trim();
  const role = String(user?.role || "user").trim();
  const message = `Đã tạo tài khoản mới: ${name}${email ? ` (${email})` : ""} · role=${role}.`;
  try {
    return await persistAdminNotification({
      type: "account_created",
      title: "Tài khoản mới được tạo",
      message,
      meta: { userId: id, email, role },
    });
  } catch (e) {
    console.error("[admin-notification] account_created:", e.message);
    return null;
  }
}

export async function notifyAdminNewReview(review, booking) {
  if (!(await isAdminNotifEnabled("newReview"))) return null;
  const id = review?._id != null ? String(review._id) : "";
  if (!id) return null;
  const rating = Number(review?.rating) || 0;
  const tourTitle = String(booking?.tourId?.title || booking?.tourTitle || "Tour").trim();
  const message = `Có review mới (${rating}★) cho "${tourTitle}".`;
  try {
    return await persistAdminNotification({
      type: "new_review",
      title: "Review mới",
      message,
      meta: { reviewId: id, bookingId: booking?._id ? String(booking._id) : undefined },
    });
  } catch (e) {
    console.error("[admin-notification] new_review:", e.message);
    return null;
  }
}

export async function notifyAdminPaymentSuccess(booking) {
  if (!(await isAdminNotifEnabled("paymentSuccess"))) return null;
  if (!booking?._id) return null;
  const code = bookingShortCode(booking);
  const customer = String(booking.name || "Khách").trim() || "Khách";
  const tour = String(booking.tourTitle || booking?.tourId?.title || "Tour").trim();
  const message = `Thanh toán thành công #${code}: ${customer} — "${tour}".`;
  try {
    return await persistAdminNotification({
      type: "payment_success",
      title: "Thanh toán thành công",
      message,
      meta: { bookingId: String(booking._id), code },
    });
  } catch (e) {
    console.error("[admin-notification] payment_success:", e.message);
    return null;
  }
}

export async function notifyAdminBlogComment({ blog, comment }) {
  if (!(await isAdminNotifEnabled("blogComment"))) return null;
  const blogId = blog?._id != null ? String(blog._id) : "";
  if (!blogId) return null;
  const title = String(blog?.title || "Bài viết").trim();
  const userName = String(comment?.userName || "Người dùng").trim();
  const content = String(comment?.content || "").trim();
  const snippet = content.length > 140 ? `${content.slice(0, 140)}…` : content;
  const message = `${userName} vừa bình luận bài "${title}": ${snippet}`;
  try {
    return await persistAdminNotification({
      type: "blog_comment",
      title: "Bình luận bài viết mới",
      message,
      meta: { blogId, userId: comment?.userId ? String(comment.userId) : undefined },
    });
  } catch (e) {
    console.error("[admin-notification] blog_comment:", e.message);
    return null;
  }
}
