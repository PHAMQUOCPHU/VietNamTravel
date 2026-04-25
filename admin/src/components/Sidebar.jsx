import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import {
  LayoutDashboard,
  Map,
  Calendar,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  ChevronRight,
  PlusCircle,
  MessageCircle,
  BadgePercent,
  Handshake,
  Ticket,
} from "lucide-react";

// Import logo từ thư mục assets
import logo from "../assets/images/logo.png";

const Sidebar = ({ onNavigate }) => {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

  useEffect(() => {
    let mounted = true;
    const fetchUnreadCount = async () => {
      try {
        const { data } = await axios.get(
          `${backendUrl}/api/messages/admin/unread-count`,
        );
        if (mounted && data.success) {
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        if (mounted) setUnreadCount(0);
      }
    };

    fetchUnreadCount();
    const timer = setInterval(fetchUnreadCount, 8000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [backendUrl, location.pathname]);

  const menuItems = [
    {
      icon: <LayoutDashboard size={20} />,
      label: "Dashboard",
      path: "/admin",
      matchPaths: ["/admin"],
    },
    {
      icon: <Map size={20} />,
      label: "Quản lý Tours",
      path: "/admin/tours",
      matchPaths: ["/admin/tours", "/admin/edit-tour/"],
    },
    {
      icon: <PlusCircle size={20} />,
      label: "Thêm Tour mới",
      path: "/admin/add-tour",
    },
    {
      icon: <BadgePercent size={20} />,
      label: "Khuyến mãi",
      path: "/admin/promotions",
      matchPaths: ["/admin/promotions"],
    },
    {
      icon: <Calendar size={20} />,
      label: "Đơn đặt vé",
      path: "/admin/bookings",
    },
    { icon: <Users size={20} />, label: "Người dùng", path: "/admin/users" },
    {
      icon: <MessageCircle size={20} />,
      label: "Tin nhắn",
      path: "/admin/messages",
      hasBadge: true,
    },
    {
      icon: <MessageSquare size={20} />,
      label: "Bài viết",
      path: "/admin/posts",
      matchPaths: ["/admin/posts", "/admin/add-blog", "/admin/edit-blog/", "/admin/blog-list"],
    },
    {
      icon: <Handshake size={20} />,
      label: "Đối tác",
      path: "/admin/partners",
      matchPaths: ["/admin/partners"],
    },
    {
      icon: <Ticket size={20} />,
      label: "Quản lý Voucher",
      path: "/admin/vouchers",
      matchPaths: ["/admin/vouchers"],
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    window.location.href = "/admin/login";
  };

  return (
    <div className="h-screen w-64 bg-white border-r border-gray-100 flex flex-col py-6 sticky top-0">
      {/* Phần Logo & Thương hiệu */}
      <div className="px-6 mb-10 flex items-center gap-3">
        <div className="w-12 h-10 rounded-lg overflow-hidden flex items-center justify-center shadow-md border border-gray-100 bg-gray-50">
          <img
            src={logo}
            alt="VN Travel Logo"
            className="w-full h-full object-cover shadow-inner"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-extrabold text-gray-800 tracking-tight leading-none">
            VN <span className="text-blue-600">Travel</span>
          </span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">
            Admin Panel
          </span>
        </div>
      </div>

      {/* Danh sách Menu Điều hướng */}
      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item, index) => {
          const isActive = item.matchPaths
            ? item.matchPaths.some((matchPath) =>
                matchPath.endsWith("/")
                  ? location.pathname.startsWith(matchPath)
                  : location.pathname === matchPath,
              )
            : location.pathname === item.path;

          return (
            <Link
              key={index}
              to={item.path}
              onClick={() => onNavigate?.()}
            >
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  flex items-center justify-between px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-200
                  ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                      : "text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? "text-white" : "text-gray-400"}>
                    {item.icon}
                  </span>
                  <span className="font-semibold text-[15px]">
                    {item.label}
                  </span>

                  {/* HIỂN THỊ SỐ THÔNG BÁO ĐỎ */}
                  {item.hasBadge && unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1 animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </div>

                {isActive && (
                  <motion.div layoutId="activeTab">
                    <ChevronRight size={16} />
                  </motion.div>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Nút Đăng xuất */}
      <div className="px-4 pt-4 border-t border-gray-50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-gray-500 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all group"
        >
          <div className="p-2 rounded-lg group-hover:bg-red-100 transition-colors">
            <LogOut size={20} />
          </div>
          <span className="font-bold text-[15px]">Đăng xuất</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
