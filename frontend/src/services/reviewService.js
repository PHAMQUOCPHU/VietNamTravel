import { getReviewStatsApi, submitReviewApi } from "../api";

export const submitReview = async ({
  backendUrl,
  token,
  bookingId,
  rating,
  comment,
  survey,
}) => {
  return submitReviewApi({ backendUrl, token, bookingId, rating, comment, survey });
};

export const getReviewStats = async ({ backendUrl, target }) => {
  return getReviewStatsApi({ backendUrl, target });
};
