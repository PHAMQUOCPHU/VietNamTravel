import bookingModel from "../models/bookingModel.js";
import tourModel from "../models/TourModel.js";
import userModel from "../models/userModel.js";
import scheduleModel from "../models/scheduleModel.js";
import voucherModel from "../models/voucherModel.js";
import { voucherWasUsedBy } from "../utils/voucherHelpers.js";
import {
  notifyBookingCancelled,
  notifyBookingConfirmedByAdmin,
  trySendDepartureReminderIfDue,
} from "../services/userNotifications.js";
import {
  notifyAdminNewBooking,
  notifyAdminCancelRequest,
} from "../services/adminNotifications.js";

const AUTO_CANCEL_REASON = "Hệ thống tự động hủy do quá hạn thanh toán";
const USER_CANCEL_REASON = "Khách hàng yêu cầu huỷ";
const HOLD_DURATION_MS = 3 * 60 * 60 * 1000;

const ADMIN_BOOKING_STATUS = [
  "pending",
  "confirmed",
  "cancel_pending",
  "cancelled",
];

/** Tổng khách trên đơn — an toàn khi guestSize thiếu / dữ liệu cũ */
const countBookingTravelers = (booking) => {
  const a = Number(booking?.guestSize?.adult);
  const c = Number(booking?.guestSize?.children);
  const adults = Number.isFinite(a) && a >= 0 ? a : 1;
  const children = Number.isFinite(c) && c >= 0 ? c : 0;
  return Math.max(1, adults + children);
};

const getDeadlineTime = (createdAt) => {
  if (!createdAt) return null;
  const createdAtTime = new Date(createdAt).getTime();
  if (Number.isNaN(createdAtTime)) return null;
  return new Date(createdAtTime + HOLD_DURATION_MS);
};

const attachDeadlineTime = (booking) => {
  const plainBooking = booking.toObject ? booking.toObject() : booking;
  const normalizedReason =
    plainBooking.status === "cancelled" && !plainBooking.cancellationReason
      ? USER_CANCEL_REASON
      : plainBooking.cancellationReason;
  return {
    ...plainBooking,
    cancellationReason: normalizedReason,
    deadlineTime: getDeadlineTime(plainBooking.createdAt),
  };
};

const autoCancelOneBooking = async (booking, reason = AUTO_CANCEL_REASON) => {
  if (!booking || booking.status !== "pending") return null;

  const totalTravelers = countBookingTravelers(booking);

  if (booking.scheduleId && totalTravelers > 0) {
    await scheduleModel.findByIdAndUpdate(booking.scheduleId, {
      $inc: { joinedParticipants: -totalTravelers },
    });
  }

  const cancelled = await bookingModel.findByIdAndUpdate(
    booking._id,
    {
      status: "cancelled",
      cancellationReason: reason,
    },
    { new: true, runValidators: false },
  );
  if (cancelled) {
    try {
      await notifyBookingCancelled(cancelled);
    } catch (e) {
      console.error("[booking] notify cancel:", e.message);
    }
  }
  return cancelled;
};

export const autoCancelExpiredCashBookings = async () => {
  const now = Date.now();
  const pendingUnpaidBookings = await bookingModel.find({
    status: "pending",
    paymentStatus: false,
  });

  const expiredBookings = pendingUnpaidBookings.filter((booking) => {
    const deadlineTime = getDeadlineTime(booking.createdAt);
    return deadlineTime && now > deadlineTime.getTime();
  });

  for (const booking of expiredBookings) {
    await autoCancelOneBooking(booking, AUTO_CANCEL_REASON);
  }

  return expiredBookings.length;
};

// 1. Hàm đặt tour theo LỊCH TRÌNH
export const createBooking = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const { scheduleId, guestSize, paymentMethod } = req.body;

    const schedule = await scheduleModel
      .findById(scheduleId)
      .populate("tourId");
    if (!schedule) {
      return res
        .status(404)
        .json({ success: false, message: "Lịch khởi hành không tồn tại" });
    }

    const tour = schedule.tourId;
    const totalNewTravelers =
      Number(guestSize.adult) + Number(guestSize.children);

    if (
      schedule.joinedParticipants + totalNewTravelers >
      schedule.maxGroupSize
    ) {
      return res.status(400).json({
        success: false,
        message: `Ngày này đã đủ người! Chỉ còn ${schedule.maxGroupSize - schedule.joinedParticipants} chỗ trống.`,
      });
    }

    const priceAdult = tour.price;
    const priceChild = tour.price * 0.6;
    let finalTotalPrice =
      guestSize.adult * priceAdult + guestSize.children * priceChild;

    // Apply Voucher if provided
    if (req.body.voucherCode) {
      const codeNorm = String(req.body.voucherCode).trim().toUpperCase();
      const voucher = await voucherModel.findOne({
        code: codeNorm,
        isActive: true,
      });
      if (
        voucher &&
        voucher.status === "active" &&
        !voucherWasUsedBy(voucher.usedBy, userId) &&
        new Date() <= new Date(voucher.expiryDate) &&
        finalTotalPrice >= voucher.minOrderValue &&
        voucher.usedCount < voucher.usageLimit
      ) {
        finalTotalPrice = Math.max(0, finalTotalPrice - voucher.discountValue);
        // KHÔNG TĂNG usedCount ở đây, chỉ tăng khi Admin xác nhận thanh toán
      }
    }

    const newBooking = new bookingModel({
      ...req.body,
      userId,
      tourId: tour._id,
      tourTitle: tour.title,
      scheduleId: schedule._id,
      bookAt: schedule.startDate,
      totalPrice: finalTotalPrice,
      status: "pending",
      paymentStatus: false,
      paymentMethod: paymentMethod || "COD",
    });

    await newBooking.save();

    await scheduleModel.findByIdAndUpdate(scheduleId, {
      $inc: { joinedParticipants: totalNewTravelers },
    });

    try {
      await notifyAdminNewBooking(newBooking);
    } catch (e) {
      console.error("[booking] admin notify new:", e.message);
    }

    res.status(200).json({
      success: true,
      message:
        paymentMethod === "Online"
          ? "Đang chờ thanh toán online"
          : "Đặt tour thành công!",
      bookingId: newBooking._id,
      data: newBooking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Lấy lịch trình của Tour
export const getSchedulesByTour = async (req, res) => {
  try {
    const { tourId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const schedules = await scheduleModel
      .find({
        tourId: tourId,
        startDate: { $gte: today },
      })
      .sort({ startDate: 1 });

    res.json({ success: true, schedules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Khách hàng yêu cầu hủy đơn
export const requestCancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.userId || req.body.userId;

    const booking = await bookingModel.findOne({ _id: bookingId, userId });

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn đặt tour" });
    }

    const st = String(booking.status || "").toLowerCase();

    if (st === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Đơn hàng đã bị hủy.",
      });
    }

    if (st === "cancel_pending") {
      return res.status(200).json({
        success: true,
        message: "Bạn đã gửi yêu cầu hủy trước đó. Vui lòng chờ admin xử lý.",
      });
    }

    if (st !== "pending" && st !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Trạng thái đơn không cho phép gửi yêu cầu hủy.",
      });
    }

    const updated = await bookingModel.findByIdAndUpdate(
      bookingId,
      { status: "cancel_pending", cancellationReason: USER_CANCEL_REASON },
      { new: true, runValidators: false },
    );

    try {
      if (updated) await notifyAdminCancelRequest(updated);
    } catch (e) {
      console.error("[booking] admin notify cancel-request:", e.message);
    }

    res
      .status(200)
      .json({ success: true, message: "Đã gửi yêu cầu hủy tour thành công." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Admin cập nhật trạng thái
export const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId, status } = req.body;
    if (!bookingId || !status) {
      return res.status(400).json({
        success: false,
        message: "Thiếu bookingId hoặc status",
      });
    }
    if (!ADMIN_BOOKING_STATUS.includes(String(status))) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ",
      });
    }

    const booking = await bookingModel.findById(bookingId);
    if (!booking)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn hàng" });

    const previousStatus = booking.status;

    if (booking.status !== "cancelled" && status === "cancelled") {
      const totalTravelers = countBookingTravelers(booking);
      if (booking.scheduleId) {
        await scheduleModel.findByIdAndUpdate(booking.scheduleId, {
          $inc: { joinedParticipants: -totalTravelers },
        });
      }
    }

    const isConfirmedCashOrder =
      status === "confirmed" &&
      String(booking.paymentMethod || "").toLowerCase() !== "online";

    const nextUpdate = {
      status,
      paymentStatus: isConfirmedCashOrder ? true : booking.paymentStatus,
    };
    if (status === "cancelled" && previousStatus === "cancel_pending") {
      nextUpdate.cancellationReason = USER_CANCEL_REASON;
    }
    /** Admin từ chối hủy: giữ chỗ (chưa từng trừ joinedParticipants khi cancel_pending). */
    if (status === "confirmed" && previousStatus === "cancel_pending") {
      nextUpdate.cancellationReason = "";
    }

    const updated = await bookingModel
      .findByIdAndUpdate(bookingId, nextUpdate, {
        new: true,
        runValidators: false,
      })
      .populate("userId", "name email")
      // Móc thêm duration ở đây để Frontend tính toán sau khi cập nhật
      .populate("tourId", "title duration city")
      .populate("scheduleId", "startDate maxGroupSize joinedParticipants");

    if (updated) {
      try {
        if (status === "confirmed" && previousStatus !== "confirmed") {
          // Xử lý xác nhận Voucher (Nếu có)
          if (updated.voucherCode) {
            const codeNorm = String(updated.voucherCode).trim().toUpperCase();
            const voucher = await voucherModel.findOne({
              code: codeNorm,
            });
            const userIdStr = String(updated.userId?._id || updated.userId);
            const alreadyUsed = voucher?.usedBy.some(
              (id) => String(id) === userIdStr,
            );
            if (voucher && !alreadyUsed) {
              voucher.usedCount += 1;
              voucher.usedBy.push(userIdStr);

              if (voucher.usedCount >= voucher.usageLimit) {
                voucher.status = "exhausted";
              }
              await voucher.save();
            }
          }

          await notifyBookingConfirmedByAdmin(updated);
          try {
            await trySendDepartureReminderIfDue(updated);
          } catch (remErr) {
            console.error("[booking] departure reminder:", remErr.message);
          }
        }
        if (status === "cancelled" && previousStatus !== "cancelled") {
          await notifyBookingCancelled(updated);
        }
      } catch (notifyErr) {
        console.error("[booking] notify status:", notifyErr.message);
      }
    }

    res.json({
      success: true,
      message: "Cập nhật trạng thái thành công!",
      updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Lấy danh sách cho User (ĐÃ SỬA: LẤY DURATION)
export const getBookings = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const bookings = await bookingModel
      .find({ userId })
      .populate("userId", "name email")
      .populate("tourId", "title price image duration")
      .populate("scheduleId", "startDate maxGroupSize joinedParticipants")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      bookings: bookings.map(attachDeadlineTime),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Lấy danh sách cho Admin (ĐÃ SỬA: LẤY DURATION)
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await bookingModel
      .find({})
      .populate("userId", "name email")
      .populate("tourId", "title price image duration city")
      .populate("scheduleId", "startDate maxGroupSize joinedParticipants")
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings: bookings.map(attachDeadlineTime),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi lấy dữ liệu Admin" });
  }
};

// 7. User tự động hủy đơn khi đồng hồ về 0
export const cancelExpiredBookingByUser = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.userId || req.body.userId;

    const booking = await bookingModel.findOne({ _id: bookingId, userId });
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn đặt tour" });
    }

    if (booking.status === "cancelled") {
      return res.status(200).json({
        success: true,
        message: "Đơn hàng đã bị hủy trước đó",
        booking: attachDeadlineTime(booking),
      });
    }

    const deadlineTime = getDeadlineTime(booking.createdAt);
    const isExpired = deadlineTime && Date.now() >= deadlineTime.getTime();

    if (!isExpired || booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Đơn hàng chưa quá hạn thanh toán hoặc không hợp lệ để tự hủy",
      });
    }

    const updatedBooking = await autoCancelOneBooking(
      booking,
      AUTO_CANCEL_REASON,
    );
    return res.status(200).json({
      success: true,
      message: "Đơn hàng của bạn đã bị hủy tự động do quá hạn thanh toán",
      booking: attachDeadlineTime(updatedBooking),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Thống kê
export const getAdminStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const totalUsers = await userModel.countDocuments();
    const totalTours = await tourModel.countDocuments();
    const bookings = await bookingModel
      .find({
        $or: [
          { paymentStatus: true },
          { status: "confirmed", paymentMethod: { $ne: "Online" } },
        ],
      })
      .populate("tourId", "region");

    const totalRevenue = bookings.reduce(
      (sum, item) => sum + (item.totalPrice || 0),
      0,
    );

    const monthlyLabels = [];
    const monthlyData = [];
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthlyLabels.push(`Thang ${d.getMonth() + 1}`);
      monthlyData.push(0);
    }

    const weeklyLabels = [];
    const weeklyData = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      weeklyLabels.push(`${d.getDate()}/${d.getMonth() + 1}`);
      weeklyData.push(0);
    }

    const paymentBreakdown = { cash: 0, online: 0 };
    const regionBreakdown = { bac: 0, trung: 0, nam: 0 };
    let rangeRevenue = 0;
    let rangeBookingCount = 0;
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);

    bookings.forEach((booking) => {
      const createdAt = new Date(booking.createdAt);
      const monthOffset =
        (now.getFullYear() - createdAt.getFullYear()) * 12 +
        (now.getMonth() - createdAt.getMonth());
      if (monthOffset >= 0 && monthOffset < 6) {
        const idx = 5 - monthOffset;
        monthlyData[idx] += booking.totalPrice || 0;
      }

      const bookingDay = new Date(createdAt);
      bookingDay.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor(
        (new Date().setHours(0, 0, 0, 0) - bookingDay.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      if (daysDiff >= 0 && daysDiff < 7) {
        const idx = 6 - daysDiff;
        weeklyData[idx] += booking.totalPrice || 0;
      }

      const paymentMethod = String(booking.paymentMethod || "").toLowerCase();
      if (paymentMethod.includes("online")) paymentBreakdown.online += 1;
      else paymentBreakdown.cash += 1;

      const region = booking.tourId?.region;
      if (region === "Bắc") regionBreakdown.bac += 1;
      else if (region === "Trung") regionBreakdown.trung += 1;
      else if (region === "Nam") regionBreakdown.nam += 1;

      const inStart = !start || createdAt >= start;
      const inEnd = !end || createdAt <= end;
      if (inStart && inEnd) {
        rangeRevenue += booking.totalPrice || 0;
        rangeBookingCount += 1;
      }
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalTours,
        totalRevenue,
        monthlyLabels,
        monthlyData,
        weeklyLabels,
        weeklyData,
        paymentBreakdown,
        regionBreakdown,
        rangeRevenue,
        rangeBookingCount,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Các hàm lịch trình khác
export const createSchedule = async (req, res) => {
  try {
    const { tourId, startDate, maxGroupSize } = req.body;
    const newSchedule = new scheduleModel({ tourId, startDate, maxGroupSize });
    await newSchedule.save();
    res.json({ success: true, message: "Thêm lịch khởi hành thành công!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    await scheduleModel.findByIdAndDelete(id);
    res.json({ success: true, message: "Đã xóa lịch khởi hành" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 10. Lấy dữ liệu bộ sưu tập (Tỉnh thành đã đi)
export const getUserCollection = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;

    // Lấy tất cả booking (trừ cancelled) để kiểm tra tour đã kết thúc dựa trên ngày, không phải status
    const bookings = await bookingModel
      .find({
        userId,
        status: { $ne: "cancelled" }, // Loại trừ booking đã hủy
      })
      .populate("tourId", "city duration");

    const now = new Date();
    const visitedCities = [];

    bookings.forEach((booking) => {
      if (booking.tourId) {
        const startDate = new Date(booking.bookAt);
        const duration = booking.tourId.duration || 1;

        // Tính ngày kết thúc = Ngày bắt đầu + (số ngày - 1)
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + (duration - 1));
        endDate.setHours(23, 59, 59, 999);

        // Nếu ngày hiện tại đã qua ngày kết thúc tour => đã hoàn thành
        if (now > endDate) {
          // Lấy tên thành phố/tỉnh (Chuẩn hóa chữ hoa/thường để tránh trùng)
          const cityName = booking.tourId.city.trim();
          if (!visitedCities.includes(cityName)) {
            visitedCities.push(cityName);
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      count: visitedCities.length,
      cities: visitedCities, // Danh sách các tỉnh thành đã đi
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
