import reviewModel from "../models/reviewModel.js";
import bookingModel from "../models/bookingModel.js";
import { uploadBufferToCloudinary, CLOUDINARY_FOLDERS } from "../services/cloudinaryUpload.js";
import { notifyAdminNewReview } from "../services/adminNotifications.js";

const surveyKeys = ["guide", "transport", "food", "schedule"];

const getTravelStatus = (bookAt, duration) => {
  if (!bookAt) return "UPCOMING";
  const now = new Date();
  const startDate = new Date(bookAt);
  startDate.setHours(0, 0, 0, 0);
  const days = Number(duration) || 1;
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + (days - 1));
  endDate.setHours(23, 59, 59, 999);

  if (now < startDate) return "UPCOMING";
  if (now >= startDate && now <= endDate) return "ONGOING";
  return "COMPLETED";
};

export const createReview = async (req, res) => {
  try {
    console.log("=== CREATE REVIEW ===");
    console.log("req.body:", req.body);
    console.log("req.files:", req.files);
    
    const userId = req.userId;
    let { bookingId, rating, comment = "", survey } = req.body;

    if (typeof survey === "string") {
      try {
        survey = JSON.parse(survey);
      } catch (err) {
        return res.json({ success: false, message: "Dữ liệu khảo sát không hợp lệ" });
      }
    }

    if (!bookingId || !rating || !survey) {
      return res.json({ success: false, message: "Thiếu dữ liệu đánh giá" });
    }

    for (const key of surveyKeys) {
      if (!survey[key]) {
        return res.json({ success: false, message: `Thiếu khảo sát cho mục ${key}` });
      }
    }

    const booking = await bookingModel
      .findOne({ _id: bookingId, userId })
      .populate("tourId", "duration title");

    if (!booking) {
      return res.json({ success: false, message: "Không tìm thấy đơn đặt tour hợp lệ" });
    }

    if (booking.status !== "confirmed") {
      return res.json({
        success: false,
        message: "Chỉ có thể đánh giá đơn đã xác nhận và hoàn thành chuyến đi",
      });
    }

    const travelStatus = getTravelStatus(
      booking.bookAt,
      booking.tourId?.duration || 1,
    );
    if (travelStatus !== "COMPLETED") {
      return res.json({
        success: false,
        message: "Bạn chỉ có thể đánh giá sau khi tour kết thúc",
      });
    }

    const existed = await reviewModel.findOne({ bookingId });
    if (existed) {
      return res.json({ success: false, message: "Đơn này đã được đánh giá trước đó" });
    }

    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        uploadBufferToCloudinary(file, CLOUDINARY_FOLDERS.reviews)
      );
      imageUrls = await Promise.all(uploadPromises);
    }

    const newReview = await reviewModel.create({
      userId,
      tourId: booking.tourId?._id,
      bookingId,
      rating: Number(rating),
      comment: String(comment || "").trim(),
      images: imageUrls,
      survey,
    });
    try {
      await notifyAdminNewReview(newReview, booking);
    } catch {
      // ignore
    }

    return res.json({
      success: true,
      message: "Cảm ơn bạn đã đánh giá chuyến đi",
      review: newReview,
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const getReviewStatsByTour = async (req, res) => {
  try {
    const { tourId } = req.params;
    const reviews = await reviewModel
      .find({ tourId })
      .populate("userId", "name image")
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? (
            reviews.reduce((sum, item) => sum + (Number(item.rating) || 0), 0) /
            totalReviews
          ).toFixed(1)
        : "0.0";

    const surveyStats = {};
    surveyKeys.forEach((key) => {
      const counts = { "Tệ": 0, "Hài lòng": 0, "Rất hài lòng": 0 };
      reviews.forEach((r) => {
        const value = r.survey?.[key];
        if (value && counts[value] !== undefined) counts[value] += 1;
      });

      const satisfiedCount = counts["Hài lòng"] + counts["Rất hài lòng"];
      const satisfiedPercent =
        totalReviews > 0 ? Math.round((satisfiedCount / totalReviews) * 100) : 0;
      surveyStats[key] = {
        counts,
        satisfiedPercent,
      };
    });

    const latestReviews = reviews.slice(0, 3).map((r) => ({
      _id: r._id,
      rating: r.rating,
      comment: r.comment,
      images: r.images || [],
      createdAt: r.createdAt,
      userName: r.userId?.name || "Khách hàng",
    }));

    const allReviews = reviews.map((r) => ({
      _id: r._id,
      rating: r.rating,
      comment: r.comment,
      images: r.images || [],
      createdAt: r.createdAt,
      userName: r.userId?.name || "Khách hàng",
    }));

    return res.json({
      success: true,
      stats: {
        totalReviews,
        averageRating: Number(averageRating),
        survey: surveyStats,
      },
      latestReviews,
      reviews: allReviews,
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const getMyReviewedBookings = async (req, res) => {
  try {
    const userId = req.userId;
    const reviews = await reviewModel.find({ userId }).select("bookingId");
    return res.json({
      success: true,
      bookingIds: reviews.map((item) => String(item.bookingId)),
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
