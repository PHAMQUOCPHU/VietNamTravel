import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      default: "",
    },
    dob: {
      type: Date,
      default: null,
    },
    birthYear: {
      type: Number,
      default: null,
      min: 1900,
      max: 2200,
    },
    occupation: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "male",
    },
    maritalStatus: {
      type: String,
      enum: ["single", "married", "other"],
      default: "other",
    },
    image: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    /** false = ngừng hoạt động (không đăng nhập được) */
    isActive: {
      type: Boolean,
      default: true,
    },

    // --- THÊM PHẦN THÀNH VIÊN Ở ĐÂY ---
    rank: {
      type: String,
      enum: ["Bạc", "Vàng", "Kim cương"],
      default: "Bạc",
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    // --------------------------------
    // --- BƯỚC 1: THÊM MẢNG LƯU TOUR YÊU THÍCH ---
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tour", // Tham chiếu đến model tour
        default: [],
      },
    ],
    savedJobs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "job",
      },
    ],
  },
  { timestamps: true },
);

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
