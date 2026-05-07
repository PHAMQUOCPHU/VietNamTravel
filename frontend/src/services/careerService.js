import { buildHttpClient } from "./httpClient";

export const getJobs = async ({ backendUrl }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.get("/api/jobs");
  return data;
};

export const searchJobApplicationByEmail = async ({ backendUrl, email, signal }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.get(
    `/api/job-applications/search?email=${encodeURIComponent(String(email || "").trim())}`,
    { signal },
  );
  return data;
};

export const submitJobApplication = async ({
  backendUrl,
  fullName,
  email,
  phone,
  jobId,
  cvFile,
}) => {
  const client = buildHttpClient(backendUrl);
  const form = new FormData();
  form.append("fullName", fullName);
  form.append("email", email);
  form.append("phone", phone);
  form.append("jobId", String(jobId));
  form.append("cv", cvFile);

  const { data } = await client.post("/api/job-applications/submit", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

