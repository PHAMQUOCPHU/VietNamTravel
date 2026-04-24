import mongoose from "mongoose";

const adminNotificationSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, index: true },
    title: { type: String, default: "" },
    message: { type: String, required: true },
    read: { type: Boolean, default: false, index: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

adminNotificationSchema.index({ createdAt: -1 });

const adminNotificationModel =
  mongoose.models.admin_notification ||
  mongoose.model("admin_notification", adminNotificationSchema);

export default adminNotificationModel;
