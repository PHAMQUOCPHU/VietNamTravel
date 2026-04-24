import { getTourByIdApi, getToursApi } from "../api";

export const getTours = async ({ backendUrl }) => {
  return getToursApi({ backendUrl });
};

export const getTourById = async ({ backendUrl, tourId }) => {
  return getTourByIdApi({ backendUrl, tourId });
};
