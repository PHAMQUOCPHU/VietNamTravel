import jobModel from "../models/jobModel.js";
import jobApplicationModel from "../models/jobApplicationModel.js";

const normalizeStringArray = (value) => {
  if (Array.isArray(value))
    return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/\r?\n|\|/)
      .map((item) => String(item).trim())
      .filter(Boolean);
  }
  return [];
};

const parseDeadline = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const parseHeadcount = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
};

/** Hết ngày hạn (theo UTC) → coi là quá hạn */
function isApplicationDeadlinePassed(deadline) {
  const d = new Date(deadline);
  if (Number.isNaN(d.getTime())) return false;
  const endUtc = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    23,
    59,
    59,
    999,
  );
  return Date.now() > endUtc;
}

async function closeExpiredActiveJobs() {
  const candidates = await jobModel
    .find({
      status: "Active",
      applicationDeadline: { $ne: null },
    })
    .select("_id applicationDeadline")
    .lean();
  const ids = candidates
    .filter((j) => isApplicationDeadlinePassed(j.applicationDeadline))
    .map((j) => j._id);
  if (ids.length) {
    await jobModel.updateMany(
      { _id: { $in: ids } },
      { $set: { status: "Closed" } },
    );
  }
}

/** Tránh quét hết hạn mỗi lần GET /jobs (gây nặng khi F5 liên tục) */
let lastExpiredJobsSweepAt = 0;
const EXPIRED_JOBS_SWEEP_MS = 120_000;

async function sweepExpiredJobsIfStale() {
  const now = Date.now();
  if (now - lastExpiredJobsSweepAt < EXPIRED_JOBS_SWEEP_MS) return;
  lastExpiredJobsSweepAt = now;
  await closeExpiredActiveJobs();
}

export const createJob = async (req, res) => {
  try {
    const {
      title,
      description,
      benefits,
      location,
      type,
      status,
      salary,
      workSchedule,
      applicationDeadline,
      headcount,
      requiredLanguage,
    } = req.body;

    if (!title || !location) {
      return res.status(400).json({
        success: false,
        message: "Tiêu đề và địa điểm là bắt buộc",
      });
    }

    const lang = ["english", "chinese", "japanese", "other", "none"].includes(
      requiredLanguage,
    )
      ? requiredLanguage
      : "none";

    const newJob = new jobModel({
      title: title.trim(),
      description: normalizeStringArray(description),
      benefits: normalizeStringArray(benefits),
      location: location.trim(),
      type: type?.trim() || "Full-time",
      status: status === "Closed" ? "Closed" : "Active",
      salary: salary?.trim() || "",
      workSchedule: workSchedule?.trim() || "",
      applicationDeadline: parseDeadline(applicationDeadline),
      headcount: parseHeadcount(headcount),
      requiredLanguage: lang,
    });

    await newJob.save();
    res.json({ success: true, job: newJob });
  } catch (error) {
    console.error("Create Job Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getJobs = async (req, res) => {
  try {
    await sweepExpiredJobsIfStale();
    const query = {};
    if (req.query.status) {
      query.status = req.query.status;
    }
    const jobs = await jobModel
      .find(query)
      .sort({ createdAt: -1 })
      .select(
        "-__v",
      )
      .lean();
    res.json({ success: true, jobs });
  } catch (error) {
    console.error("Get Jobs Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await jobModel.findById(id);
    if (!job) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy bài tuyển dụng" });
    }

    if (typeof req.body.title === "string" && req.body.title.trim()) {
      job.title = req.body.title.trim();
    }
    if (typeof req.body.location === "string" && req.body.location.trim()) {
      job.location = req.body.location.trim();
    }
    if (typeof req.body.type === "string" && req.body.type.trim()) {
      job.type = req.body.type.trim();
    }
    if (req.body.salary !== undefined) {
      job.salary = String(req.body.salary ?? "").trim();
    }
    if (req.body.workSchedule !== undefined) {
      job.workSchedule = String(req.body.workSchedule ?? "").trim();
    }
    if (typeof req.body.status === "string") {
      job.status = req.body.status;
    }
    if (req.body.description !== undefined) {
      job.description = normalizeStringArray(req.body.description);
    }
    if (req.body.benefits !== undefined) {
      job.benefits = normalizeStringArray(req.body.benefits);
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "applicationDeadline")) {
      job.applicationDeadline = parseDeadline(req.body.applicationDeadline);
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "headcount")) {
      job.headcount = parseHeadcount(req.body.headcount);
    }
    if (req.body.requiredLanguage !== undefined) {
      const lang = req.body.requiredLanguage;
      job.requiredLanguage = [
        "english",
        "chinese",
        "japanese",
        "other",
        "none",
      ].includes(lang)
        ? lang
        : "none";
    }

    await job.save();
    await closeExpiredActiveJobs();
    const refreshed = await jobModel.findById(id).select("-__v").lean();
    res.json({ success: true, job: refreshed || job.toObject?.() || job });
  } catch (error) {
    console.error("Update Job Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    const removed = await jobModel.findByIdAndDelete(id);
    if (!removed) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy bài tuyển dụng" });
    }

    // Archive related applications instead of deleting
    await jobApplicationModel.updateMany(
      { jobId: id },
      { $set: { isArchived: true } },
    );

    res.json({
      success: true,
      message:
        "Bài tuyển dụng đã được xóa. Các hồ sơ ứng tuyển liên quan đã được lưu trữ.",
    });
  } catch (error) {
    console.error("Delete Job Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
