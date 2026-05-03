import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, default: "" },
    order: { type: Number, required: true },
  },
  { _id: false },
);

const termsSchema = new mongoose.Schema(
  {
    sections: { type: [sectionSchema], default: [] },
    lastUpdated: { type: Date, default: Date.now },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
  },
  { timestamps: true },
);

termsSchema.index({ lastUpdated: -1 });

const termsModel =
  mongoose.models.terms || mongoose.model("terms", termsSchema);

export default termsModel;
