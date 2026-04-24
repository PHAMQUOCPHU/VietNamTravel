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
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "male",
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
  },
  { timestamps: true },
);

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
