import { buildHttpClient, withTokenHeader } from "../api/httpClient";

export const sendSignUpOtpRequest = async ({ backendUrl, email }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.post("/api/user/send-otp", { email });
  return data;
};

export const verifyAndRegisterRequest = async ({ backendUrl, email, otp, fullData }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.post("/api/user/register", { email, otp, ...fullData });
  return data;
};

export const forgotPasswordRequest = async ({ backendUrl, email }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.post("/api/user/forgot-password", { email });
  return data;
};

export const verifyForgotOtpRequest = async ({ backendUrl, email, otp }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.post("/api/user/verify-otp-forgot", {
    email,
    otp: otp.trim(),
  });
  return data;
};

export const resetPasswordRequest = async ({ backendUrl, email, newPassword }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.post("/api/user/reset-password", {
    email,
    newPassword,
  });
  return data;
};

export const changePasswordRequest = async ({ backendUrl, token, oldPassword, newPassword }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.post(
    "/api/user/change-password",
    { oldPassword, newPassword },
    withTokenHeader(token),
  );
  return data;
};

export const updateProfileRequest = async ({ backendUrl, token, formData }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.post(
    "/api/user/update-profile",
    formData,
    withTokenHeader(token),
  );
  return data;
};
