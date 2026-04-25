import { buildHttpClient, withTokenHeader } from "./httpClient";

export const submitReviewApi = async ({
  backendUrl,
  token,
  bookingId,
  rating,
  comment,
  survey,
  images,
}) => {
  const client = buildHttpClient(backendUrl);

  if (images && images.length > 0) {
    const formData = new FormData();
    formData.append("bookingId", bookingId);
    formData.append("rating", rating);
    formData.append("comment", comment);
    formData.append("survey", JSON.stringify(survey));

    images.forEach((image) => {
      formData.append("images", image);
    });

    const { data } = await client.post("/api/reviews", formData, {
      ...withTokenHeader(token),
      headers: {
        ...withTokenHeader(token).headers,
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  }

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
