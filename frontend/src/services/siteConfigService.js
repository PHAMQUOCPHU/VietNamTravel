import { buildHttpClient, withTokenHeader } from "./httpClient";

export const getPublicSiteConfig = async ({ backendUrl, signal }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.get("/api/site-config/public", { signal });
  return data;
};

export const updateHomeSlide = async ({
  backendUrl,
  token,
  slot,
  imageFile,
  alt,
}) => {
  const client = buildHttpClient(backendUrl);
  const fd = new FormData();
  fd.append("slot", String(slot));
  if (alt != null) fd.append("alt", String(alt));
  fd.append("image", imageFile);

  const { data } = await client.post(
    "/api/site-config/home-slide",
    fd,
    {
      ...withTokenHeader(token),
      headers: {
        ...(withTokenHeader(token).headers || {}),
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return data;
};

