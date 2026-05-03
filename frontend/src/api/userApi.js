import { buildHttpClient, withTokenHeader } from "./httpClient";

export const getUserProfileApi = async ({ backendUrl, token }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.get("/api/user/get-profile", withTokenHeader(token));
  return data;
};

export const toggleFavoriteTourApi = async ({ backendUrl, token, tourId }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.post(
    "/api/user/toggle-favorite",
    { tourId },
    withTokenHeader(token),
  );
  return data;
};

export const toggleSavedJobApi = async ({ backendUrl, token, jobId }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.post(
    "/api/user/toggle-saved-job",
    { jobId },
    withTokenHeader(token),
  );
  return data;
};

export const getCaptchaApi = async ({ backendUrl }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.get("/api/user/captcha");
  return data;
};

export const loginUserApi = async ({
  backendUrl,
  email,
  password,
  userCaptcha,
  serverCaptcha,
}) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.post("/api/user/login", {
    email,
    password,
    userCaptcha,
    serverCaptcha,
  });
  return data;
};

export const requestOtpApi = async ({ backendUrl, email }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.post("/api/user/send-otp", { email });
  return data;
};

export const getReviewedBookingIdsApi = async ({ backendUrl, token }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.get("/api/reviews/my-bookings", withTokenHeader(token));
  return data;
};
