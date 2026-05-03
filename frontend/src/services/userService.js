import {
  getCaptchaApi,
  getReviewedBookingIdsApi,
  getUserProfileApi,
  loginUserApi,
  requestOtpApi,
  toggleFavoriteTourApi,
  toggleSavedJobApi,
} from "../api";

export const getUserProfile = async ({ backendUrl, token }) => {
  return getUserProfileApi({ backendUrl, token });
};

export const toggleFavoriteTour = async ({ backendUrl, token, tourId }) => {
  return toggleFavoriteTourApi({ backendUrl, token, tourId });
};

export const toggleSavedJob = async ({ backendUrl, token, jobId }) => {
  return toggleSavedJobApi({ backendUrl, token, jobId });
};

export const getCaptcha = async ({ backendUrl }) => {
  return getCaptchaApi({ backendUrl });
};

export const loginUser = async ({ backendUrl, email, password, userCaptcha, serverCaptcha }) => {
  return loginUserApi({ backendUrl, email, password, userCaptcha, serverCaptcha });
};

export const requestOtp = async ({ backendUrl, email }) => {
  return requestOtpApi({ backendUrl, email });
};

export const getReviewedBookingIds = async ({ backendUrl, token }) => {
  return getReviewedBookingIdsApi({ backendUrl, token });
};
