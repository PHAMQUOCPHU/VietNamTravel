import axios from "axios";

export const fetchSafetyAlerts = async ({ backendUrl }) => {
  if (!backendUrl) {
    throw new Error("backendUrl is required");
  }

  const response = await axios.get(`${backendUrl}/api/safety/alerts`);
  return response.data;
};
