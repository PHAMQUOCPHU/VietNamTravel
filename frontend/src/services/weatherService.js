import axios from "axios";

/**
 * @param {{ backendUrl: string, region?: "all" | "vn" }} opts
 * region=vn — chỉ tin liên quan Việt Nam (tọa độ trong bbox VN hoặc tên/quốc gia có Vietnam).
 */
export const fetchSafetyAlerts = async ({ backendUrl, region = "all" }) => {
  if (!backendUrl) {
    throw new Error("backendUrl is required");
  }

  const params = {};
  if (region === "vn") params.region = "vn";

  const response = await axios.get(`${backendUrl}/api/safety/alerts`, {
    params,
  });
  return response.data;
};
