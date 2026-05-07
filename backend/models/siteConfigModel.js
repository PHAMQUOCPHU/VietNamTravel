import mongoose from "mongoose";

const slideSchema = new mongoose.Schema(
  {
    url: { type: String, default: "" },
    alt: { type: String, default: "" },
  },
  { _id: false },
);

const siteConfigSchema = new mongoose.Schema(
  {
    key: { type: String, default: "default", unique: true, index: true },
    /** URL ảnh logo website (Cloudinary hoặc HTTPS). Rỗng = dùng /logo.png phía frontend */
    logoUrl: { type: String, default: "" },
    /** Logo panel admin (sidebar, favicon tab admin). Rỗng = asset mặc định trong build admin */
    adminLogoUrl: { type: String, default: "" },
    notifications: {
      newOrder: { type: Boolean, default: true },
      cancelRequest: { type: Boolean, default: true },
      newUser: { type: Boolean, default: true },
      newReview: { type: Boolean, default: true },
      paymentSuccess: { type: Boolean, default: true },
      blogComment: { type: Boolean, default: true },
    },
    homeSlides: { type: [slideSchema], default: [] },
    maintenance: {
      enabled: { type: Boolean, default: false },
      title: { type: String, default: "Đang bảo trì hệ thống" },
      message: {
        type: String,
        default: "Trang web đang cập nhật, vui lòng quay lại sau.",
      },
      contact: {
        name: { type: String, default: "Mr Phú" },
        phone: { type: String, default: "0905713702" },
        email: { type: String, default: "pham quocphu431027@gmail.com" },
      },
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user", default: null },
  },
  { timestamps: true },
);

const siteConfigModel =
  mongoose.models.site_config || mongoose.model("site_config", siteConfigSchema);

export default siteConfigModel;

