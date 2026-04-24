import {
  getNotificationsApi,
  getUnreadNotificationCountApi,
  readAllNotificationsApi,
} from "../api";

export const getUnreadNotificationCount = async ({ backendUrl, token }) => {
  return getUnreadNotificationCountApi({ backendUrl, token });
};

export const getNotifications = async ({ backendUrl, token }) => {
  return getNotificationsApi({ backendUrl, token });
};

export const readAllNotifications = async ({ backendUrl, token }) => {
  return readAllNotificationsApi({ backendUrl, token });
};
