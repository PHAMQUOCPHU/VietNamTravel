/** Header chuẩn API admin backend (middleware đọc `atoken`). */
export const adminHeaders = (aToken) =>
  aToken ? { atoken: aToken } : {};
