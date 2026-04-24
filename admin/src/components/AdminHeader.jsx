import React, { useState, useEffect, useRef, useContext } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { AdminContext } from "../context/AdminContext.jsx";
import { getSocket } from "../lib/socketClient";

const ADMIN_ROOM = "ADMIN";

const AdminHeader = () => {
  const { aToken, backendUrl } = useContext(AdminContext);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef(null);

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

  const fetchUnread = async () => {
    if (!aToken) return;
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/notifications/unread-count`, {
        headers: { token: aToken },
      });
      if (data.success) setUnreadCount(data.unreadCount || 0);
    } catch {
      setUnreadCount(0);
    }
  };

  const fetchList = async () => {
    if (!aToken) return;
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/notifications`, {
        headers: { token: aToken },
      });
      if (data.success) setNotifications(data.notifications || []);
    } catch {
      setNotifications([]);
    }
  };

  const markAllRead = async () => {
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
  };

  useEffect(() => {
    if (!aToken) return undefined;

    fetchUnread();

    const socket = getSocket(backendUrl);
    socket.emit("join_room", ADMIN_ROOM);

    const onAdminNotification = (payload) => {
      const msg = payload?.notification?.message;
      setUnreadCount((c) => c + 1);
      toast.info(msg || "Có thông báo mới", { autoClose: 5000 });
    };

    socket.on("admin_notification", onAdminNotification);
    return () => {
      socket.off("admin_notification", onAdminNotification);
    };
  }, [aToken, backendUrl]);

  useEffect(() => {
    const close = (e) => {
      if (notifOpen && panelRef.current && !panelRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [notifOpen]);

  const togglePanel = async (e) => {
    e.stopPropagation();
    const next = !notifOpen;
    setNotifOpen(next);
    if (next && aToken) {
      await fetchList();
      await markAllRead();
    }
  };

  return (
    <header className="h-24 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-10">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-800">
            {getGreeting()}, <span className="text-blue-600">Admin!</span>
          </h2>
          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-mono font-bold shadow-sm">
            {timeString}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1 font-medium italic">{dateString}</p>
      </div>

      {aToken ? (
        <div className="flex items-center gap-3" ref={panelRef}>
          <div className="relative">
            <button
              type="button"
              onClick={togglePanel}
              className="relative p-3 rounded-2xl border border-gray-200 bg-white text-slate-700 hover:bg-slate-50 transition shadow-sm"
              title="Thông báo hệ thống"
            >
              <Bell className="w-5 h-5 text-blue-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-0.5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-96 max-h-[min(70vh,440px)] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-gray-100 z-50">
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
                    <p className="text-xs text-slate-400 text-center py-8 italic">Chưa có thông báo</p>
                  ) : (
                    notifications.slice(0, 12).map((n) => (
                      <div
                        key={n._id}
                        className={`rounded-xl px-3 py-2.5 text-xs leading-snug ${
                          n.read ? "bg-slate-50 text-slate-600" : "bg-blue-50/90 text-slate-800"
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
        </div>
      ) : null}
    </header>
  );
};

export default AdminHeader;
