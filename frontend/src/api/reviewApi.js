import { buildHttpClient, withTokenHeader } from "./httpClient";

export const submitReviewApi = async ({
  backendUrl,
  token,
  bookingId,
  rating,
  comment,
  survey,
}) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.post(
    "/api/reviews",
    { bookingId, rating, comment, survey },
    withTokenHeader(token),
  );
  return data;
};

export const getReviewStatsApi = async ({ backendUrl, target }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.get(`/api/reviews/stats/${target}`);
  return data;
};
