import mongoose from "mongoose";
import jobApplicationModel from "../models/jobApplicationModel.js";
import jobModel from "../models/jobModel.js";
import cloudinaryUpload from "../services/cloudinaryUpload.js";
import userModel from "../models/userModel.js";

// Upload CV and create job application
export const submitJobApplication = async (req, res) => {
  try {
    const { fullName, email, phone, jobId } = req.body;

    if (!fullName || !email || !phone || !jobId) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin và chọn vị trí ứng tuyển",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: "Vị trí tuyển dụng không hợp lệ",
      });
    }

    const job = await jobModel.findById(jobId).select("title status").lean();
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy vị trí tuyển dụng",
      });
    }

    if (job.status === "Closed") {
      return res.status(400).json({
        success: false,
        message: "Vị trí này đã đóng tuyển dụng, không thể nộp hồ sơ",
      });
    }

    const position = job.title?.trim() || "Ứng tuyển";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Email không hợp lệ",
      });
    }

    if (!/^0\d{9,10}$/.test(phone.trim())) {
      return res.status(400).json({
        success: false,
        message: "Số điện thoại không hợp lệ",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng tải lên file CV",
      });
    }

    // Check file size (max 5MB)
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: "File CV phải nhỏ hơn 5MB",
      });
    }

    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({
        success: false,
        message: "Chỉ chấp nhận file PDF",
      });
    }

    const safeName = (req.file.originalname || "cv.pdf")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 120);
    const publicId = `cv_${Date.now()}_${safeName.replace(/\.pdf$/i, "")}`;

    const uploadResult = await cloudinaryUpload(req.file.buffer, publicId);

    const cvUrl = uploadResult?.secure_url;
    if (!cvUrl) {
      return res.status(500).json({
        success: false,
        message: "Lỗi khi tải lên file CV lên Cloudinary",
      });
    }

    const emailNormalized = email.trim().toLowerCase();

    let userId = null;
    const user = await userModel
      .findOne({ email: emailNormalized })
      .select("_id")
      .lean();
    if (user) {
      userId = user._id;
    }

    // Create job application
    const jobApplication = new jobApplicationModel({
      fullName: fullName.trim(),
      email: emailNormalized,
      phone: phone.trim(),
      position,
      jobId,
      cvFileUrl: cvUrl,
      cvFileName: req.file.originalname,
      userId,
      status: "submitted",
    });

    await jobApplication.save();

    res.status(201).json({
      success: true,
      message: "Nộp hồ sơ thành công! Vui lòng theo dõi trạng thái.",
      application: jobApplication,
    });
  } catch (error) {
    console.error("Job Application Error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi nộp hồ sơ",
      error: error.message,
    });
  }
};

// Get job application by email
export const getJobApplicationByEmail = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email || !String(email).trim()) {
      return res.status(400).json({
        success: false,
        message: "Email là bắt buộc",
      });
    }

    const emailTrim = String(email).trim();
    const application = await jobApplicationModel
      .findOne({
        email: emailTrim.toLowerCase(),
        isArchived: { $ne: true },
      })
      .sort({ createdAt: -1 })
      .populate("jobId", "title")
      .lean();

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hồ sơ",
      });
    }

    res.status(200).json({
      success: true,
      application,
    });
  } catch (error) {
    console.error("Get Application Error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin hồ sơ",
    });
  }
};

// Get user's job application (for logged-in users)
export const getUserJobApplication = async (req, res) => {
  try {
    const { userId } = req.params;
    if (
      !userId ||
      String(req.userId) !== String(userId)
    ) {
      return res.status(403).json({
        success: false,
        message: "Không được xem hồ sơ của người khác",
      });
    }

    const applications = await jobApplicationModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .populate("jobId", "title")
      .lean();

    res.status(200).json({
      success: true,
      applications,
    });
  } catch (error) {
    console.error("Get User Applications Error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin hồ sơ",
    });
  }
};

// Get all job applications (admin only)
export const getAllJobApplications = async (req, res) => {
  try {
    const { includeArchived } = req.query;
    const query = {};

    // Only filter out archived by default
    if (!includeArchived) {
      query.isArchived = { $ne: true };
    }

    const applications = await jobApplicationModel
      .find(query)
      .sort({ createdAt: -1 })
      .populate("userId", "name email phone")
      .populate("jobId", "title")
      .lean();

    res.status(200).json({
      success: true,
      applications,
    });
  } catch (error) {
    console.error("Get All Applications Error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách hồ sơ",
    });
  }
};

// Update job application status (admin only)
const APPLICATION_STATUSES = [
  "submitted",
  "confirmed",
  "reviewed",
  "interview",
  "hired",
  "rejected",
];

export const updateJobApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, interviewDate, interviewNotes, adminNotes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({
        success: false,
        message: "Mã hồ sơ không hợp lệ",
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái là bắt buộc",
      });
    }

    if (!APPLICATION_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ",
      });
    }

    const patch = { status };
    if (interviewDate !== undefined) {
      patch.interviewDate = interviewDate ? new Date(interviewDate) : null;
    }
    if (interviewNotes !== undefined) {
      patch.interviewNotes = String(interviewNotes ?? "");
    }
    if (adminNotes !== undefined) {
      patch.adminNotes = String(adminNotes ?? "");
    }

    const application = await jobApplicationModel
      .findByIdAndUpdate(applicationId, { $set: patch }, { new: true })
      .populate("userId", "name email phone")
      .populate("jobId", "title")
      .lean();

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hồ sơ",
      });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái thành công",
      application,
    });
  } catch (error) {
    console.error("Update Application Error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật hồ sơ",
    });
  }
};
