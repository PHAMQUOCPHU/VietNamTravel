import express from "express";
import {
  createJob,
  getJobs,
  updateJob,
  deleteJob,
} from "../controllers/jobController.js";
import adminAuth from "../middlewares/adminAuth.js";

const router = express.Router();

router.get("/", getJobs);
router.post("/", adminAuth, createJob);
router.put("/:id", adminAuth, updateJob);
router.delete("/:id", adminAuth, deleteJob);

export default router;
