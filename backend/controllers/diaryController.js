import diaryModel from "../models/diaryModel.js";
import bookingModel from "../models/bookingModel.js";
import { v2 as cloudinary } from "cloudinary";

// Helper function to upload multiple files
const uploadMultipleImages = async (files) => {
  const uploadPromises = files.map((file) => {
    return new Promise((resolve, reject) => {
      const b64 = Buffer.from(file.buffer).toString("base64");
      let dataURI = "data:" + file.mimetype + ";base64," + b64;
      cloudinary.uploader.upload(
        dataURI,
        { resource_type: "auto" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        },
      );
    });
  });
  return Promise.all(uploadPromises);
};

export const createDiary = async (req, res) => {
  try {
    const {
      userId,
      bookingId,
      tourId,
      tourTitle,
      title,
      content,
      rating,
      emotion,
      location,
      travelDate,
    } = req.body;

    // Check if a diary already exists for this booking
    const existingDiary = await diaryModel.findOne({ bookingId });
    if (existingDiary) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Bạn đã viết nhật ký cho chuyến đi này rồi.",
        });
    }

    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = await uploadMultipleImages(req.files);
    }

    const diary = new diaryModel({
      userId,
      bookingId,
      tourId,
      tourTitle,
      title,
      content,
      rating: Number(rating) || 5,
      emotion: emotion || "Tuyệt vời",
      location,
      travelDate: travelDate ? new Date(travelDate) : new Date(),
      images: imageUrls,
    });

    await diary.save();

    res.json({ success: true, message: "Đã lưu nhật ký thành công!", diary });
  } catch (error) {
    console.error("Lỗi khi tạo nhật ký:", error);
    res
      .status(500)
      .json({ success: false, message: "Đã xảy ra lỗi, vui lòng thử lại." });
  }
};

export const getUserDiaries = async (req, res) => {
  try {
    const { userId } = req.body;
    const diaries = await diaryModel.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, diaries });
  } catch (error) {
    console.error("Lỗi khi lấy nhật ký:", error);
    res.status(500).json({ success: false, message: "Đã xảy ra lỗi." });
  }
};

export const getEligibleBookings = async (req, res) => {
  try {
    const { userId } = req.body;
    // Lấy các booking đã confirmed (tour đã hoàn thành = bookAt + duration đã qua)
    const confirmedBookings = await bookingModel
      .find({ userId, status: "confirmed" })
      .populate("tourId", "duration")
      .sort({ createdAt: -1 });

    // Lọc những booking đã kết thúc tour (bookAt + duration days <= now)
    const now = new Date();
    const completedBookings = confirmedBookings.filter((b) => {
      if (!b.bookAt || !b.tourId?.duration) return false;
      const startDate = new Date(b.bookAt);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + (b.tourId.duration - 1));
      endDate.setHours(23, 59, 59, 999);
      return now > endDate;
    });

    // Lọc những booking chưa được viết nhật ký
    const writtenDiaries = await diaryModel
      .find({ userId })
      .select("bookingId");
    const writtenBookingIds = writtenDiaries.map((d) => d.bookingId.toString());

    const eligibleBookings = completedBookings.filter(
      (b) => !writtenBookingIds.includes(b._id.toString()),
    );

    res.json({ success: true, eligibleBookings });
  } catch (error) {
    console.error("Lỗi khi lấy booking hợp lệ:", error);
    res.status(500).json({ success: false, message: "Đã xảy ra lỗi." });
  }
};
