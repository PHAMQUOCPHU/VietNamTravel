import { useEffect, useState, useContext, useCallback } from "react";
import { AppContext } from "../../context";
import { getBookings } from "../../services";

const useMyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { backendUrl, bookingRefreshTick = 0 } = useContext(AppContext);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      const res = await getBookings({ backendUrl, token });
      if (res.success) {
        setBookings(res.bookings || []);
      }
    } catch {
      setError("Lỗi kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings, bookingRefreshTick]);

  return { bookings, loading, error, refetchBookings: fetchBookings };
};

export default useMyBookings;
