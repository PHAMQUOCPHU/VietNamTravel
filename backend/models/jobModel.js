import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: [String],
      default: [],
    },
    benefits: {
      type: [String],
      default: [],
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      trim: true,
      default: "Full-time",
    },
    status: {
      type: String,
      enum: ["Active", "Closed"],
      default: "Active",
    },
    salary: {
      type: String,
      trim: true,
      default: "",
    },
    workSchedule: {
      type: String,
      trim: true,
      default: "",
    },
    applicationDeadline: {
      type: Date,
      default: null,
    },
    headcount: {
      type: Number,
      default: null,
      min: 0,
    },
    requiredLanguage: {
      type: String,
      enum: ["english", "chinese", "japanese", "other", "none"],
      default: "none",
    },
  },
  {
    timestamps: true,
  },
);

jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ status: 1, applicationDeadline: 1 });

const jobModel = mongoose.model("job", jobSchema);
export default jobModel;
