import express from "express";
import {
  submitJobApplication,
  getJobApplicationByEmail,
  getUserJobApplication,
  getAllJobApplications,
  updateJobApplicationStatus,
} from "../controllers/jobApplicationController.js";
import multer from "../middlewares/multer.js";
import adminAuth from "../middlewares/adminAuth.js";
import userAuth from "../middlewares/auth.js";

const router = express.Router();

// Public routes
router.post("/submit", multer.single("cv"), submitJobApplication);
router.get("/search", getJobApplicationByEmail);

// User routes
router.get("/user/:userId", userAuth, getUserJobApplication);

// Admin routes
router.get("/", adminAuth, getAllJobApplications);
router.put("/:applicationId/status", adminAuth, updateJobApplicationStatus);

export default router;
