import axios from "axios";

export const getTourDispatchApi = async (
  { date, tourId, fromDate, toDate },
  token,
  backendUrl,
) => {
  const { data } = await axios.get(
    `${backendUrl.trim()}/api/bookings/dispatch`,
    {
      params: { date, tourId, fromDate, toDate },
      headers: { atoken: token },
    },
  );
  return data;
};
