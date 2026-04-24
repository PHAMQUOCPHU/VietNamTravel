import express from "express";
import authMiddleware from "../middlewares/auth.js";
import {
  createReview,
  getMyReviewedBookings,
  getReviewStatsByTour,
} from "../controllers/reviewController.js";

const reviewRouter = express.Router();

reviewRouter.post("/", authMiddleware, createReview);
reviewRouter.get("/my-bookings", authMiddleware, getMyReviewedBookings);
reviewRouter.get("/stats/:tourId", getReviewStatsByTour);

export default reviewRouter;
