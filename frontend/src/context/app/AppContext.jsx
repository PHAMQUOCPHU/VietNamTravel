/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getSocket } from "../../lib/socketClient";
import { BACKEND_URL } from "../../config/env";
import {
  getNotifications,
  getPublicSiteConfig,
  getTours,
  getUnreadNotificationCount,
  getUserBookings as getUserBookingsApi,
  getUserProfile,
  readAllNotifications,
  toggleFavoriteTour,
  toggleSavedJob as toggleSavedJobRequest,
} from "../../services";

export const AppContext = createContext();
const TOURS_CACHE_KEY = "vt_tours_cache_v1";
const TOURS_CACHE_TTL_MS = 60 * 1000;

const readToursCache = () => {
  try {
    const raw = sessionStorage.getItem(TOURS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.ts || !Array.isArray(parsed?.tours)) return null;
    if (Date.now() - parsed.ts > TOURS_CACHE_TTL_MS) return null;
    return parsed.tours;
  } catch {
    return null;
  }
};

const writeToursCache = (tours) => {
  try {
    sessionStorage.setItem(
      TOURS_CACHE_KEY,
      JSON.stringify({ ts: Date.now(), tours }),
    );
  } catch {
    // ignore cache write errors
  }
};

const AppContextProvider = (props) => {
  const navigate = useNavigate();
  const backendUrl = BACKEND_URL;
  const isDev = import.meta.env.DEV;
  const warnDev = useCallback(
    (...args) => {
      if (isDev) console.warn(...args);
    },
    [isDev],
  );

  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [tours, setTours] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviewRefreshTick, setReviewRefreshTick] = useState(0);
  const [bookingRefreshTick, setBookingRefreshTick] = useState(0);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [siteConfig, setSiteConfig] = useState({ homeSlides: null, logoUrl: "" });

  const refreshSiteConfig = useCallback(async () => {
    try {
      const data = await getPublicSiteConfig({ backendUrl });
      if (data?.success) {
        setSiteConfig({
          homeSlides: data.homeSlides || null,
          maintenance: data.maintenance || null,
          logoUrl:
            typeof data.logoUrl === "string" ? data.logoUrl.trim() : "",
        });
      }
    } catch (error) {
      warnDev("[site-config] load failed", error);
    }
  }, [backendUrl, warnDev]);

  const loadUserProfileData = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getUserProfile({ backendUrl, token });
      if (data.success) {
        setUser((prev) =>
          prev?.totalSpent !== undefined
            ? { ...data.user, totalSpent: prev.totalSpent }
            : data.user,
        );
        localStorage.setItem("user", JSON.stringify(data.user));
      }
    } catch (error) {
      warnDev("[profile] load failed", error);
    }
  }, [token, backendUrl, warnDev]);

  const getUserBookings = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getUserBookingsApi({ backendUrl, token });
      if (data.success) {
        setBookings(data.bookings);
        const total = data.bookings
          .filter(
            (order) =>
              order.status === "confirmed" || order.status === "Đã xác nhận",
          )
          .reduce((sum, order) => sum + (Number(order.totalPrice) || 0), 0);

        setUser((prev) =>
          prev ? { ...prev, totalSpent: total } : { totalSpent: total },
        );
      }
    } catch (error) {
      warnDev("[bookings] load failed", error);
    }
  }, [token, backendUrl, warnDev]);

  const getToursData = useCallback(async () => {
    const cachedTours = readToursCache();
    if (cachedTours && cachedTours.length > 0) {
      setTours(cachedTours);
    }
    try {
      const data = await getTours({ backendUrl });
      if (data.success) {
        setTours(data.tours);
        writeToursCache(data.tours);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      warnDev("[tours] load failed", error);
      toast.error("Không thể kết nối đến server");
    }
  }, [backendUrl, warnDev]);

  const toggleFavorite = useCallback(
    async (tourId) => {
      if (!token) {
        toast.info("Vui lòng đăng nhập để yêu thích tour!");
        navigate("/login");
        return;
      }
      try {
        const data = await toggleFavoriteTour({ backendUrl, token, tourId });
        if (data.success) {
          setUser((prev) => ({ ...prev, favorites: data.favorites }));
          await loadUserProfileData();
          toast.success(data.message);
        }
      } catch (error) {
        warnDev("[favorites] toggle failed", error);
        toast.error("Không thể cập nhật yêu thích");
      }
    },
    [token, backendUrl, navigate, loadUserProfileData, warnDev],
  );

  const toggleSavedJob = useCallback(
    async (jobId) => {
      if (!token) {
        toast.info("Vui lòng đăng nhập để lưu vị trí tuyển dụng!");
        navigate("/login");
        return;
      }
      try {
        const data = await toggleSavedJobRequest({
          backendUrl,
          token,
          jobId,
        });
        if (data.success) {
          setUser((prev) =>
            prev ? { ...prev, savedJobs: data.savedJobs } : prev,
          );
          await loadUserProfileData();
          toast.success(data.message);
        } else if (data.message) {
          toast.error(data.message);
        }
      } catch (error) {
        warnDev("[jobs] toggle saved failed", error);
        toast.error("Không thể cập nhật vị trí đã lưu");
      }
    },
    [token, backendUrl, navigate, loadUserProfileData, warnDev],
  );

  useEffect(() => {
    getToursData();
  }, [getToursData]);

  useEffect(() => {
    refreshSiteConfig();
  }, [refreshSiteConfig]);

  useEffect(() => {
    if (token) {
      loadUserProfileData();
      getUserBookings();
    } else {
      setUser(null);
      setBookings([]);
      setNotificationUnreadCount(0);
      setNotifications([]);
      localStorage.removeItem("user");
    }
  }, [token, loadUserProfileData, getUserBookings]);

  useEffect(() => {
    if (bookingRefreshTick === 0) return;
    getUserBookings();
  }, [bookingRefreshTick, getUserBookings]);

  const fetchNotificationUnreadCount = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getUnreadNotificationCount({ backendUrl, token });
      if (data.success) setNotificationUnreadCount(data.unreadCount || 0);
    } catch {
      setNotificationUnreadCount(0);
    }
  }, [token, backendUrl]);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getNotifications({ backendUrl, token });
      if (data.success) setNotifications(data.notifications || []);
    } catch {
      setNotifications([]);
    }
  }, [token, backendUrl]);

  const markAllNotificationsRead = useCallback(async () => {
    if (!token) return;
    try {
      await readAllNotifications({ backendUrl, token });
      setNotificationUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // ignore
    }
  }, [token, backendUrl]);

  useEffect(() => {
    if (!token || !user?._id) return undefined;

    fetchNotificationUnreadCount();

    const socket = getSocket(backendUrl);
    const roomId = String(user._id);
    socket.emit("join_room", roomId);

    const bookingRelatedTypes = new Set([
      "booking_confirmed",
      "booking_cancelled",
      "payment_success",
      "departure_reminder",
    ]);

    const onUserNotification = (payload) => {
      const n = payload?.notification;
      const msg = n?.message;
      setNotificationUnreadCount((c) => c + 1);
      toast.info(msg || "Bạn có thông báo mới", { autoClose: 6000 });
      if (n?.type && bookingRelatedTypes.has(n.type)) {
        setBookingRefreshTick((t) => t + 1);
      }
    };

    socket.on("user_notification", onUserNotification);
    return () => {
      socket.off("user_notification", onUserNotification);
    };
  }, [token, user?._id, backendUrl, fetchNotificationUnreadCount]);

  const logout = useCallback(() => {
    setToken("");
    setUser(null);
    setBookings([]);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("adminToken");
    toast.info("Đã đăng xuất");
    navigate("/login");
    window.location.reload();
  }, [navigate]);

  const notifyReviewUpdated = useCallback(() => {
    setReviewRefreshTick((prev) => prev + 1);
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      token,
      setToken,
      backendUrl,
      tours,
      bookings,
      getToursData,
      loadUserProfileData,
      getUserBookings,
      reviewRefreshTick,
      bookingRefreshTick,
      notifyReviewUpdated,
      logout,
      toggleFavorite,
      toggleSavedJob,
      notificationUnreadCount,
      notifications,
      fetchNotifications,
      fetchNotificationUnreadCount,
      markAllNotificationsRead,
      siteConfig,
      refreshSiteConfig,
    }),
    [
      user,
      token,
      backendUrl,
      tours,
      bookings,
      getToursData,
      loadUserProfileData,
      getUserBookings,
      reviewRefreshTick,
      bookingRefreshTick,
      notifyReviewUpdated,
      logout,
      toggleFavorite,
      toggleSavedJob,
      notificationUnreadCount,
      notifications,
      fetchNotifications,
      fetchNotificationUnreadCount,
      markAllNotificationsRead,
      siteConfig,
      refreshSiteConfig,
    ],
  );

  return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
};

export default AppContextProvider;
