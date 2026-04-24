import React, { useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { Bell, ArrowLeft } from "lucide-react";

const Notifications = () => {
  const {
    user,
    notifications,
    fetchNotifications,
    fetchNotificationUnreadCount,
    markAllNotificationsRead,
  } = useContext(AppContext);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchNotificationUnreadCount();
    }
  }, [user, fetchNotifications, fetchNotificationUnreadCount]);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center text-slate-500">
        Vui lòng{" "}
        <Link to="/login" className="text-blue-600 font-bold">
          đăng nhập
        </Link>{" "}
        để xem thông báo.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft size={18} /> Trang chủ
        </Link>
        {notifications.some((n) => !n.read) && (
          <button
            type="button"
            onClick={() => markAllNotificationsRead()}
            className="text-xs font-bold text-slate-500 hover:text-blue-600 uppercase tracking-wide"
          >
            Đánh dấu đã đọc hết
          </button>
        )}
      </div>

      <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3 mb-6">
        <Bell className="text-blue-600" />
        Thông báo
      </h1>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <p className="text-slate-400 text-center py-16 italic">Chưa có thông báo nào.</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`rounded-2xl border p-4 shadow-sm ${
                n.read
                  ? "bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800"
                  : "bg-blue-50/80 border-blue-100 dark:bg-slate-800 dark:border-blue-900"
              }`}
            >
              <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 mb-1">
                {n.title || "Thông báo"}
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{n.message}</p>
              <p className="text-[11px] text-slate-400 mt-2">
                {n.createdAt
                  ? new Date(n.createdAt).toLocaleString("vi-VN")
                  : ""}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
