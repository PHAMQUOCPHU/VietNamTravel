import { buildHttpClient, withTokenHeader } from "./httpClient";

export const getUserBookingsApi = async ({ backendUrl, token }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.get("/api/user/bookings", withTokenHeader(token));
  return data;
};

export const getBookingsApi = async ({ backendUrl, token }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.get("/api/bookings", withTokenHeader(token));
  return data;
};

export const getSchedulesByTourApi = async ({ backendUrl, tourId }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.get(`/api/bookings/schedules/${tourId}`);
  return data;
};

export const createBookingApi = async ({ backendUrl, token, payload }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.post("/api/bookings", payload, withTokenHeader(token));
  return data;
};

export const cancelBookingApi = async ({ backendUrl, token, bookingId }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.post(
    "/api/bookings/cancel",
    { bookingId },
    withTokenHeader(token),
  );
  return data;
};

export const cancelExpiredBookingApi = async ({ backendUrl, token, bookingId }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.post(
    "/api/bookings/cancel-expired",
    { bookingId },
    withTokenHeader(token),
  );
  return data;
};

export const createVnPayPaymentApi = async ({
  backendUrl,
  amount,
  bookingId,
  tourTitle,
}) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.post("/api/payment/vnpay", {
    amount,
    bookingId,
    tourTitle,
  });
  return data;
};
