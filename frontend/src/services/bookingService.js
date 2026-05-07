import { buildHttpClient, withTokenHeader } from "./httpClient";

export const getUserBookings = async ({ backendUrl, token }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.get("/api/user/bookings", withTokenHeader(token));
  return data;
};

export const getBookings = async ({ backendUrl, token }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.get("/api/bookings", withTokenHeader(token));
  return data;
};

export const verifyVnPayPayment = async ({ backendUrl, vnp_TxnRef, vnp_ResponseCode }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.post("/api/payment/vnpay-verify", {
    vnp_TxnRef,
    vnp_ResponseCode,
  });
  return data;
};

export const getMyCollectionCities = async ({ backendUrl, token }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.get(
    "/api/bookings/my-collection",
    withTokenHeader(token),
  );
  return data;
};

export const getSchedulesByTour = async ({ backendUrl, tourId }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.get(`/api/bookings/schedules/${tourId}`);
  return data;
};

export const createBooking = async ({ backendUrl, token, payload }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.post("/api/bookings", payload, withTokenHeader(token));
  return data;
};

export const cancelBooking = async ({ backendUrl, token, bookingId }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.post(
    "/api/bookings/cancel",
    { bookingId },
    withTokenHeader(token),
  );
  return data;
};

export const cancelExpiredBooking = async ({ backendUrl, token, bookingId }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.post(
    "/api/bookings/cancel-expired",
    { bookingId },
    withTokenHeader(token),
  );
  return data;
};

export const createVnPayPayment = async ({ backendUrl, amount, bookingId, tourTitle }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.post("/api/payment/vnpay", {
    amount,
    bookingId,
    tourTitle,
  });
  return data;
};
