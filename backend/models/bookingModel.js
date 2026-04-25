import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    // Sửa userId thành ObjectId để sau này lấy thông tin khách nhanh hơn nếu cần
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    // QUAN TRỌNG: Sửa tourId thành ObjectId và ref đến model 'tour'
    // Lưu ý: chữ 'tour' phải khớp với tên bạn đặt trong mongoose.model("tour", ...)
    tourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tour",
      required: true,
    },

    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "schedule",
      required: true,
    },
    tourTitle: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    guestSize: {
      adult: { type: Number, default: 1 },
      children: { type: Number, default: 0 },
    },
    totalPrice: { type: Number, required: true },
    bookAt: { type: Date, required: true },
    specialRequests: { type: String },
    paymentMethod: { type: String, default: "COD" },
    paymentStatus: { type: Boolean, default: false },
    vnpayOrderId: { type: String },
    cancellationReason: { type: String, default: "" },
    voucherCode: { type: String, default: "" },

    // TRẠNG THÁI ĐƠN HÀNG
    status: { type: String, default: "pending" },
    /** Đã gửi thông báo nhắc 24h trước giờ khởi hành (tránh trùng) */
    departureReminder24hSent: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const bookingModel =
  mongoose.models.booking || mongoose.model("booking", bookingSchema);

export default bookingModel;
