import { getReviewStatsApi, submitReviewApi } from "../api";

export const submitReview = async ({
  backendUrl,
  token,
  bookingId,
  rating,
  comment,
  survey,
  images,
}) => {
  return submitReviewApi({ backendUrl, token, bookingId, rating, comment, survey, images });
};

export const getReviewStats = async ({ backendUrl, target }) => {
  return getReviewStatsApi({ backendUrl, target });
};
