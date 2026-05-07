import React, { useState, useEffect, useRef, useContext, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Lock, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from "react-toastify";
import { AdminContext } from "../context/AdminContext.jsx";
import { getSocket } from "../lib/socketClient";

const ADMIN_ROOM = "ADMIN";

const AdminHeader = () => {
  const navigate = useNavigate();
  const { aToken, backendUrl, setAToken } = useContext(AdminContext);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifOpen, setNotifOpen] = useState(false);
  const [sessionMenuOpen, setSessionMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef(null);
  const sessionMenuRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  const timeString = currentTime.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const dateString = currentTime.toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const fetchUnread = useCallback(async () => {
    if (!aToken) return;
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/admin/notifications/unread-count`,
        {
          headers: { token: aToken },
        },
      );
      if (data.success) setUnreadCount(data.unreadCount || 0);
    } catch {
      setUnreadCount(0);
    }
  }, [aToken, backendUrl]);

  const fetchList = useCallback(async () => {
    if (!aToken) return;
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/admin/notifications`,
        {
          headers: { token: aToken },
        },
      );
      if (data.success) setNotifications(data.notifications || []);
    } catch {
      setNotifications([]);
    }
  }, [aToken, backendUrl]);

  const markAllRead = useCallback(async () => {
    if (!aToken) return;
    try {
      await axios.post(
        `${backendUrl}/api/admin/notifications/read-all`,
        {},
        { headers: { token: aToken } },
      );
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      /* ignore */
    }
  }, [aToken, backendUrl]);

  useEffect(() => {
    if (!aToken) return undefined;

    // tránh warning "setState in effect" của eslint rule dự án
    const t = setTimeout(() => {
      fetchUnread();
    }, 0);

    const socket = getSocket(backendUrl);
    socket.emit("join_room", ADMIN_ROOM);

    const onAdminNotification = (payload) => {
      const msg = payload?.notification?.message;
      setUnreadCount((c) => c + 1);
      toast.info(msg || "Có thông báo mới", { autoClose: 5000 });
    };

    socket.on("admin_notification", onAdminNotification);
    return () => {
      clearTimeout(t);
      socket.off("admin_notification", onAdminNotification);
    };
  }, [aToken, backendUrl, fetchUnread]);

  useEffect(() => {
    const close = (e) => {
      if (
        notifOpen &&
        panelRef.current &&
        !panelRef.current.contains(e.target)
      ) {
        setNotifOpen(false);
      }
      if (
        sessionMenuOpen &&
        sessionMenuRef.current &&
        !sessionMenuRef.current.contains(e.target)
      ) {
        setSessionMenuOpen(false);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [notifOpen, sessionMenuOpen]);

  const togglePanel = async (e) => {
    e.stopPropagation();
    const next = !notifOpen;
    setSessionMenuOpen(false);
    setNotifOpen(next);
    if (next && aToken) {
      await fetchList();
      await markAllRead();
    }
  };

  const toggleSessionMenu = (e) => {
    e.stopPropagation();
    setSessionMenuOpen((v) => !v);
    setNotifOpen(false);
  };

  const handleLogout = () => {
    setAToken("");
    localStorage.removeItem("adminToken");
    setSessionMenuOpen(false);
    toast.info("Đã đăng xuất");
    navigate("/admin/login");
  };

  return (
    <header className="h-16 sm:h-20 md:h-24 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-3 sm:px-4 md:px-8 sticky top-0 z-10">
      <div>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <h2 className="text-sm sm:text-lg md:text-xl font-bold text-gray-800 truncate">
            {getGreeting()}, <span className="text-blue-600">Admin!</span>
          </h2>
          <span className="hidden sm:inline-block bg-blue-50 text-blue-700 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-mono font-bold shadow-sm whitespace-nowrap">
            {timeString}
          </span>
        </div>
        <p className="hidden sm:block text-xs text-gray-400 mt-1 font-medium italic">
          {dateString}
        </p>
      </div>

      {aToken ? (
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Notifications — để nút khóa nằm sát mép phải, menu đăng xuất căn đẹp hơn */}
          <div className="relative" ref={panelRef}>
            <button
              type="button"
              onClick={togglePanel}
              className="relative p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-gray-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-sm"
              title="Thông báo hệ thống"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-0.5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-[min(24rem,calc(100vw-2rem))] max-h-[min(70vh,440px)] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-gray-100 z-[60]">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-slate-50/80 rounded-t-2xl">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                    Thông báo
                  </span>
                  <Link
                    to="/admin/bookings"
                    onClick={() => setNotifOpen(false)}
                    className="text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    Quản lý đặt tour
                  </Link>
                </div>
                <div className="p-2 space-y-1">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-8 italic">
                      Chưa có thông báo
                    </p>
                  ) : (
                    notifications.slice(0, 12).map((n) => (
                      <div
                        key={n._id}
                        className={`rounded-xl px-3 py-2.5 text-xs leading-snug ${
                          n.read
                            ? "bg-slate-50 text-slate-600"
                            : "bg-blue-50/90 text-slate-800"
                        }`}
                      >
                        <p className="font-bold text-[10px] uppercase text-blue-600 mb-0.5">
                          {n.title}
                        </p>
                        <p>{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {n.createdAt
                            ? new Date(n.createdAt).toLocaleString("vi-VN")
                            : ""}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Đăng xuất — khóa, popover căn mép phải nút + mũi tên */}
          <div className="relative" ref={sessionMenuRef}>
            <button
              type="button"
              onClick={toggleSessionMenu}
              className={`
                relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl border transition shadow-sm
                ${
                  sessionMenuOpen
                    ? "border-blue-300 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                }
              `}
              title="Đăng xuất khỏi Admin"
              aria-expanded={sessionMenuOpen}
              aria-haspopup="true"
            >
              <Lock className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
            </button>

            <AnimatePresence>
              {sessionMenuOpen && (
                <motion.div
                  role="menu"
                  aria-label="Phiên làm việc"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
                  className="absolute right-0 top-[calc(100%+10px)] z-[70] w-[min(220px,calc(100vw-1.5rem))] origin-top-right"
                >
                  <div className="relative rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-sm py-2 shadow-xl shadow-slate-300/30 ring-1 ring-slate-900/5">
                    <span
                      className="absolute -top-1.5 right-4 h-3 w-3 rotate-45 border-l border-t border-slate-200/90 bg-white"
                      aria-hidden
                    />
                    <p className="px-3.5 pt-1 pb-2 text-[11px] font-semibold text-slate-500 leading-tight">
                      Bạn sắp thoát khỏi bảng điều khiển.
                    </p>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="mx-1.5 flex w-[calc(100%-12px)] items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-red-50 hover:text-red-700"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                        <LogOut size={18} strokeWidth={2.25} aria-hidden />
                      </span>
                      <span className="flex flex-col gap-0.5 min-w-0">
                        <span>Đăng xuất</span>
                        <span className="text-[10px] font-medium text-slate-400">
                          Kết thúc phiên Admin
                        </span>
                      </span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : null}
    </header>
  );
};

export default AdminHeader;
