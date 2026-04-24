import {
  cancelBookingApi,
  cancelExpiredBookingApi,
  createBookingApi,
  createVnPayPaymentApi,
  getBookingsApi,
  getSchedulesByTourApi,
  getUserBookingsApi,
} from "../api";

export const getUserBookings = async ({ backendUrl, token }) => {
  return getUserBookingsApi({ backendUrl, token });
};

export const getBookings = async ({ backendUrl, token }) => {
  return getBookingsApi({ backendUrl, token });
};

export const getSchedulesByTour = async ({ backendUrl, tourId }) => {
  return getSchedulesByTourApi({ backendUrl, tourId });
};

export const createBooking = async ({ backendUrl, token, payload }) => {
  return createBookingApi({ backendUrl, token, payload });
};

export const cancelBooking = async ({ backendUrl, token, bookingId }) => {
  return cancelBookingApi({ backendUrl, token, bookingId });
};

export const cancelExpiredBooking = async ({ backendUrl, token, bookingId }) => {
  return cancelExpiredBookingApi({ backendUrl, token, bookingId });
};

export const createVnPayPayment = async ({ backendUrl, amount, bookingId, tourTitle }) => {
  return createVnPayPaymentApi({ backendUrl, amount, bookingId, tourTitle });
};
