import notificationModel from "../models/notificationModel.js";
import bookingModel from "../models/bookingModel.js";
import { getSocketIO } from "./socketRegistry.js";
import { getBookingShortCodePlain } from "../utils/bookingShortCode.js";

/** 8 ký tự cuối — đồng bộ với FE / admin (#XXXXXXXX) */
export const bookingDisplayCode = (booking) =>
  getBookingShortCodePlain(booking);

/** userId sau populate có thể là object { _id, name, email } — cần chuẩn hóa cho DB + socket room. */
export const normalizeUserId = (ref) => {
  if (ref == null) return null;
  if (typeof ref === "string") return ref;
  if (typeof ref === "object") {
    if (ref._id != null) return ref._id;
    if (typeof ref.toString === "function") return ref.toString();
  }
  return ref;
};

const formatVnd = (amount) =>
  `${Number(amount || 0).toLocaleString("vi-VN")} đ`;

/** Ngày lịch (năm, tháng, ngày) theo múi Asia/Ho_Chi_Minh */
function toVietnamYMD(date) {
  const s = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  const [year, month, day] = s.split("-").map(Number);
  return { year, month, day };
}

function ymdEqual(a, b) {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

/** Ngày khởi hành thực tế: ưu tiên lịch tour (schedule), tránh lệch với bookAt. */
function getDepartureDateForBooking(b) {
  const s = b?.scheduleId;
  if (s && typeof s === "object" && s.startDate != null) {
    return new Date(s.startDate);
  }
  if (b?.bookAt) return new Date(b.bookAt);
  return null;
}

/** Cộng `delta` ngày lịch cho một YMD (lịch dương, không DST VN) */
function addCalendarDaysYmd({ year, month, day }, delta) {
  const x = new Date(Date.UTC(year, month - 1, day + delta));
  return {
    year: x.getUTCFullYear(),
    month: x.getUTCMonth() + 1,
    day: x.getUTCDate(),
  };
}

/** Tên điểm đến hiển thị trong ngoặc: ưu tiên thành phố tour, sau đó tên tour trên booking. */
const getTripPlaceLabel = (booking) => {
  const tour = booking?.tourId;
  const city =
    tour && typeof tour === "object" && typeof tour.city === "string"
      ? tour.city.trim()
      : "";
  if (city) return city;
  const title =
    (typeof booking?.tourTitle === "string" && booking.tourTitle.trim()) ||
    (tour && typeof tour === "object" && typeof tour.title === "string" && tour.title.trim()) ||
    "";
  return title || "điểm đến";
};

const formatDepartureDate = (booking) => {
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

const bookingTripSummary = (booking) => {
  const code = bookingDisplayCode(booking);
  const place = getTripPlaceLabel(booking);
  const dateStr = formatDepartureDate(booking);
  return { code, place, dateStr };
};

/**
 * Nội dung hiển thị chuẩn (dùng khi tạo thông báo + khi GET list để thông báo cũ vẫn đủ chi tiết).
 * `meta` từ document notification (vd. cancellationReason đã snapshot).
 */
export const composeNotificationMessage = (type, booking, meta = {}) => {
  if (!booking?._id) return null;
  const { code, place, dateStr } = bookingTripSummary(booking);

  switch (type) {
    case "booking_confirmed":
      return `Đơn hàng #${code} đi (${place}), khởi hành ngày ${dateStr}. Đơn đã được Admin phê duyệt — chúc bạn có một chuyến đi vui vẻ!`;
    case "booking_cancelled": {
      const reason = String(
        meta?.cancellationReason ?? booking?.cancellationReason ?? "",
      ).trim();
      const reasonPart = reason ? ` Lý do: ${reason}` : "";
      return `Rất tiếc, đơn hàng #${code} đi (${place}), khởi hành ngày ${dateStr} đã bị hủy.${reasonPart} Vui lòng liên hệ hỗ trợ để biết thêm chi tiết.`;
    }
    case "payment_success": {
      const amountText = formatVnd(booking.totalPrice);
      return `Đơn hàng #${code} đi (${place}), khởi hành ngày ${dateStr}. Bạn đã thanh toán thành công ${amountText}. Hệ thống đang cập nhật hóa đơn cho bạn.`;
    }
    case "departure_reminder":
      return `Đơn hàng #${code} đi (${place}), khởi hành ngày ${dateStr} — chỉ còn vài giờ nữa là lên đường. Đừng quên kiểm tra lại hành lý nhé!`;
    default:
      return null;
  }
};

async function persistAndEmit({ userId, type, message, title = "", bookingId = null, meta = {} }) {
  const ownerId = normalizeUserId(userId);
  if (!ownerId) {
    console.warn("[notification] Bỏ qua: không có userId hợp lệ");
    return null;
  }

  const doc = await notificationModel.create({
    userId: ownerId,
    type,
    message,
    title,
    bookingId,
    meta,
    read: false,
  });
  const io = getSocketIO();
  const room = String(ownerId);
  if (io) {
    io.to(room).emit("user_notification", { notification: doc.toObject() });
  }
  return doc;
}

export async function notifyBookingConfirmedByAdmin(booking) {
  if (!booking?.userId) return null;
  const { code, place, dateStr } = bookingTripSummary(booking);
  const message = composeNotificationMessage("booking_confirmed", booking, {});
  return persistAndEmit({
    userId: booking.userId,
    type: "booking_confirmed",
    title: "Đơn hàng đã được xác nhận",
    message,
    bookingId: booking._id,
    meta: { code, place, departureDate: dateStr },
  });
}

export async function notifyPaymentSuccess(booking, tourTitle) {
  if (!booking?.userId) return null;
  const { code, place, dateStr } = bookingTripSummary(booking);
  const message = composeNotificationMessage("payment_success", booking, {});
  return persistAndEmit({
    userId: booking.userId,
    type: "payment_success",
    title: "Thanh toán thành công",
    message,
    bookingId: booking._id,
    meta: {
      amountVnd: Number(booking.totalPrice) || 0,
      tourTitle: tourTitle || booking.tourTitle || place,
      code,
      place,
      departureDate: dateStr,
    },
  });
}

export async function notifyBookingCancelled(booking) {
  if (!booking?.userId) return null;
  const { code, place, dateStr } = bookingTripSummary(booking);
  const reason = String(booking?.cancellationReason || "").trim();
  const meta = { code, place, departureDate: dateStr, cancellationReason: reason || undefined };
  const message = composeNotificationMessage("booking_cancelled", booking, meta);
  return persistAndEmit({
    userId: booking.userId,
    type: "booking_cancelled",
    title: "Đơn hàng đã hủy",
    message,
    bookingId: booking._id,
    meta,
  });
}

export async function notifyDeparture24h(booking) {
  if (!normalizeUserId(booking?.userId)) return null;
  const { code, place, dateStr } = bookingTripSummary(booking);
  const message = composeNotificationMessage("departure_reminder", booking, {});
  return persistAndEmit({
    userId: booking.userId,
    type: "departure_reminder",
    title: "Nhắc lịch khởi hành",
    message,
    bookingId: booking._id,
    meta: { code, place, departureDate: dateStr, tourTitle: booking.tourTitle || place },
  });
}

/**
 * Nếu ngày khởi hành (VN) = ngày mai (VN) và đơn đã confirmed: gửi nhắc 1 lần.
 * Chỉ set departureReminder24hSent khi đã tạo notification thành công.
 */
async function sendDepartureReminderIfTomorrowVn(booking, tomorrowVn) {
  const eff = getDepartureDateForBooking(booking);
  if (!eff || Number.isNaN(eff.getTime())) return false;
  const depVn = toVietnamYMD(eff);
  if (!ymdEqual(depVn, tomorrowVn)) return false;

  const plain = booking.toObject ? booking.toObject() : { ...booking };
  plain.bookAt = eff;

  const doc = await notifyDeparture24h(plain);
  if (doc) {
    await bookingModel.findByIdAndUpdate(booking._id, { departureReminder24hSent: true });
    return true;
  }
  return false;
}

/**
 * Gọi ngay khi đơn vừa được xác nhận / thanh toán — tránh phải chờ tới tick cron 30 phút.
 * Tự populate schedule nếu thiếu.
 */
export async function trySendDepartureReminderIfDue(booking) {
  if (!booking?._id || booking.status !== "confirmed") return null;
  if (booking.departureReminder24hSent === true) return null;

  const hasSchedule =
    booking.scheduleId &&
    typeof booking.scheduleId === "object" &&
    booking.scheduleId.startDate != null;

  const b = hasSchedule
    ? booking
    : await bookingModel
        .findById(booking._id)
        .populate("scheduleId", "startDate")
        .populate("tourId", "title city");

  if (!b || b.status !== "confirmed" || b.departureReminder24hSent === true) return null;

  const now = new Date();
  const tomorrowVn = addCalendarDaysYmd(toVietnamYMD(now), 1);
  const sent = await sendDepartureReminderIfTomorrowVn(b, tomorrowVn);
  return sent ? b : null;
}

/**
 * Gọi từ cron: nhắc **trước một ngày lịch** (VN): hôm nay theo VN là ngày kề trước ngày khởi hành.
 * Trước đây dùng bookAt trong [now+23h, now+25h] — với bookAt kiểu nửa đêm / đầu ngày
 * thì không bao giờ khớp (vd. 19/4 10h → 20/4 0h chỉ cách ~14h).
 */
export async function processDepartureReminders() {
  const now = new Date();
  const todayVn = toVietnamYMD(now);
  const tomorrowVn = addCalendarDaysYmd(todayVn, 1);

  /** Giới hạn DB rộng để không bỏ sót bookAt lệch múi; lọc chính xác bằng ngày VN bên dưới */
  const wMin = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const wMax = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const candidates = await bookingModel
    .find({
      status: "confirmed",
      departureReminder24hSent: { $ne: true },
      bookAt: { $gte: wMin, $lte: wMax },
    })
    .populate("scheduleId", "startDate");

  let count = 0;
  for (const b of candidates) {
    const sent = await sendDepartureReminderIfTomorrowVn(b, tomorrowVn);
    if (sent) count += 1;
  }
  return count;
}
