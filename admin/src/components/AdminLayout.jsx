import { useEffect, useState } from "react";
import { useLocation, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import AdminHeader from "./AdminHeader";
import { motion } from "framer-motion";
import { Menu } from "lucide-react";

const AdminLayout = () => {
  const location = useLocation();
  const isBookingsPage = location.pathname === "/admin/bookings";

  /** Trang đặt vé: sidebar thu gọn mặc định để bảng rộng gần full màn hình */
  const [sidebarOpen, setSidebarOpen] = useState(
    () => location.pathname !== "/admin/bookings",
  );

  useEffect(() => {
    setSidebarOpen(!isBookingsPage);
  }, [isBookingsPage]);

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      {isBookingsPage && sidebarOpen ? (
        <button
          type="button"
          aria-label="Đóng menu"
          className="fixed inset-0 z-30 bg-black/35 backdrop-blur-[1px] transition-opacity md:bg-black/25"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div
        className={
          isBookingsPage
            ? `fixed inset-y-0 left-0 z-40 w-64 shrink-0 transition-transform duration-300 ease-out ${
                sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
              }`
            : "sticky top-0 z-20 h-screen w-64 shrink-0 self-start"
        }
      >
        <Sidebar
          onNavigate={() => {
            if (isBookingsPage) setSidebarOpen(false);
          }}
        />
      </div>

      {isBookingsPage && !sidebarOpen ? (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="fixed left-3 top-24 z-30 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 shadow-lg transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          title="Mở menu điều hướng"
        >
          <Menu size={20} className="text-blue-600" />
          <span className="hidden sm:inline">Menu</span>
        </button>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader />
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`p-4 sm:p-6 md:p-8 ${isBookingsPage ? "max-w-none px-2 sm:px-4 md:px-6 lg:px-8" : ""}`}
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
};

export default AdminLayout;
