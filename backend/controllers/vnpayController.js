import crypto from "crypto";
import moment from "moment";
import bookingModel from "../models/bookingModel.js";
import {
  notifyPaymentSuccess,
  trySendDepartureReminderIfDue,
} from "../services/userNotifications.js";
import { sendBookingTicketEmail } from "../services/bookingTicketEmail.js";

export const createVnpayPayment = async (req, res) => {
  try {
    const { amount, bookingId } = req.body;

    // 1. LẤY CẤU HÌNH TỪ .ENV
    const tmnCode = process.env.VNP_TMN_CODE;
    const secretKey = process.env.VNP_HASH_SECRET;
    const vnpUrl = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURN_URL;

    const date = new Date();
    const createDate = moment(date).format("YYYYMMDDHHmmss");

    // Tạo mã giao dịch duy nhất cho VNPay (TxnRef)
    const vnp_TxnRef = `${bookingId}_${moment(date).format("HHmmss")}`;

    // 2. CHUẨN BỊ THÔNG SỐ (PHẢI ĐÚNG TÊN BIẾN CỦA VNPAY)
    let vnp_Params = {};
    vnp_Params["vnp_Version"] = "2.1.0";
    vnp_Params["vnp_Command"] = "pay";
    vnp_Params["vnp_TmnCode"] = tmnCode;
    vnp_Params["vnp_Locale"] = "vn";
    vnp_Params["vnp_CurrCode"] = "VND";
    vnp_Params["vnp_TxnRef"] = vnp_TxnRef;
    vnp_Params["vnp_OrderInfo"] = "Thanh toan tour VietNam Travel"; // Không dùng tiếng Việt có dấu ở đây cho an toàn
    vnp_Params["vnp_OrderType"] = "other";
    vnp_Params["vnp_Amount"] = Math.round(amount) * 100; // VNPay quy định số tiền nhân 100
    vnp_Params["vnp_ReturnUrl"] = returnUrl;
    vnp_Params["vnp_IpAddr"] = "127.0.0.1";
    vnp_Params["vnp_CreateDate"] = createDate;

    // 3. SẮP XẾP THÔNG SỐ THEO ALPHABET (Bắt buộc để tạo chữ ký đúng)
    vnp_Params = Object.keys(vnp_Params)
      .sort()
      .reduce((obj, key) => {
        obj[key] = vnp_Params[key];
        return obj;
      }, {});

    // 4. TẠO CHỮ KÝ (SECURE HASH)
    const signData = new URLSearchParams(vnp_Params).toString();
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    vnp_Params["vnp_SecureHash"] = signed;

    // 5. TẠO URL CUỐI CÙNG
    const finalUrl = vnpUrl + "?" + new URLSearchParams(vnp_Params).toString();

    // Cập nhật mã vnpayOrderId vào database để sau này đối soát
    await bookingModel.findByIdAndUpdate(bookingId, {
      vnpayOrderId: vnp_TxnRef,
    });

    res.json({ success: true, paymentUrl: finalUrl });
  } catch (error) {
    console.error("VNPay Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Không thể tạo link thanh toán VNPay",
    });
  }
};

export const verifyVnpayPayment = async (req, res) => {
  try {
    const { vnp_TxnRef, vnp_ResponseCode } = req.body;

    if (vnp_ResponseCode === "00") {
      /**
       * Chỉ flip trạng thái khi CHƯA thanh toán — tránh 2 request song song
       * (StrictMode gọi verify 2 lần / user F5 trang return) tạo 2 thông báo + 2 toast.
       */
      const updated = await bookingModel
        .findOneAndUpdate(
          {
            vnpayOrderId: vnp_TxnRef,
            paymentStatus: { $ne: true },
          },
          { $set: { paymentStatus: true, status: "confirmed" } },
          { new: true },
        )
        .populate("tourId", "title city duration")
        .populate("scheduleId", "startDate");

      if (updated) {
        const tourTitle = updated.tourTitle || updated.tourId?.title || "tour";
        try {
          await notifyPaymentSuccess(updated, tourTitle);
        } catch (e) {
          console.error("[vnpay] notify payment:", e.message);
        }
        try {
          await sendBookingTicketEmail(updated);
        } catch (e) {
          console.error("[vnpay] ticket email:", e.message);
        }
        try {
          await trySendDepartureReminderIfDue(updated);
        } catch (e) {
          console.error("[vnpay] departure reminder:", e.message);
        }
      }
      res.json({ success: true, message: "Thanh toán thành công" });
    } else {
      res.json({ success: false, message: "Thanh toán thất bại" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
