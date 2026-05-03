import mongoose from "mongoose";

const jobApplicationSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
    },
    position: {
      type: String,
      required: true,
      default: "tour_guide",
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "job",
      default: null,
    },
    cvFileUrl: {
      type: String,
      required: true,
    },
    cvFileName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "submitted",
        "confirmed",
        "reviewed",
        "interview",
        "hired",
        "rejected",
      ],
      default: "submitted",
    },
    interviewDate: {
      type: Date,
      default: null,
    },
    interviewNotes: {
      type: String,
      default: "",
    },
    adminNotes: {
      type: String,
      default: "",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

jobApplicationSchema.index({ email: 1, isArchived: 1, createdAt: -1 });
jobApplicationSchema.index({ jobId: 1 });
jobApplicationSchema.index({ userId: 1, createdAt: -1 });
jobApplicationSchema.index({ createdAt: -1 });
jobApplicationSchema.index({ status: 1 });

const jobApplicationModel = mongoose.model(
  "jobApplication",
  jobApplicationSchema,
);

export default jobApplicationModel;
