import express from "express";
import { createDiary, getUserDiaries, getEligibleBookings } from "../controllers/diaryController.js";
import authMiddleware from "../middlewares/auth.js";
import upload from "../middlewares/multer.js";

const diaryRouter = express.Router();

diaryRouter.get("/list", authMiddleware, getUserDiaries);
diaryRouter.get("/eligible", authMiddleware, getEligibleBookings);
diaryRouter.post("/create", authMiddleware, upload.array("images", 5), createDiary);

export default diaryRouter;
