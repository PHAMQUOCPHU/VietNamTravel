import express from "express";
import { postTourAdvisor } from "../controllers/geminiTourAdvisorController.js";

const router = express.Router();

/** GET để kiểm tra nhanh: curl http://localhost:5001/api/tour-advisor/ping */
router.get("/tour-advisor/ping", (req, res) => {
  res.json({ ok: true, service: "gemini-tour-advisor" });
});

router.post("/tour-advisor", postTourAdvisor);

export default router;
