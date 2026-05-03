import express from "express";
import adminAuth from "../middlewares/adminAuth.js";
import { getTerms, updateTerms } from "../controllers/termsController.js";

const router = express.Router();

router.get("/", getTerms);
router.put("/", adminAuth, updateTerms);

export default router;
