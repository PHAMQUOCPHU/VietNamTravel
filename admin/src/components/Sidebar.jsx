import { motion, AnimatePresence } from "framer-motion";
import { useContext, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AdminContext } from "../context/AdminContext";
import {
  LayoutDashboard,
  Map,
  Calendar,
  Users,
  MessageSquare,
  ChevronRight,
  MessageCircle,
  BadgePercent,
  Handshake,
  Ticket,
  Briefcase,
  ChevronDown,
  Settings,
} from "lucide-react";

import { resolveAdminPanelLogoSrc } from "../utils/adminBranding";

/** `matchPath` kết thúc bằng `/` → dùng startsWith */
function pathMatchesList(pathname, matchPaths) {
  return matchPaths.some((matchPath) =>
    matchPath.endsWith("/")
      ? pathname.startsWith(matchPath)
      : pathname === matchPath,
  );
}

function submenuItemActive(pathname, subItem) {
  if (subItem.matchPaths?.length) {
    return pathMatchesList(pathname, subItem.matchPaths);
  }
  return pathname === subItem.path;
}

const SIDEBAR_MENU_ITEMS = [
  {
    icon: <LayoutDashboard size={20} />,
    label: "Dashboard",
    path: "/admin",
    matchPaths: ["/admin"],
  },
  {
    icon: <Map size={20} />,
    label: "Quản lý tour",
    path: "/admin/tours",
    matchPaths: ["/admin/tours", "/admin/add-tour", "/admin/edit-tour/"],
    hasSubmenu: true,
    submenu: [
      {
        label: "Chỉnh sửa tour",
        path: "/admin/tours",
        matchPaths: ["/admin/tours", "/admin/edit-tour/"],
      },
      {
        label: "Thêm tour mới",
        path: "/admin/add-tour",
      },
    ],
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
    matchPaths: [
      "/admin/posts",
      "/admin/add-blog",
      "/admin/edit-blog/",
      "/admin/blog-list",
    ],
    hasSubmenu: true,
    submenu: [
      {
        label: "Quản lý bài viết",
        path: "/admin/posts",
        matchPaths: ["/admin/posts", "/admin/edit-blog/", "/admin/blog-list"],
      },
      {
        label: "Viết bài mới",
        path: "/admin/add-blog",
      },
    ],
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
  {
    icon: <Briefcase size={20} />,
    label: "Tuyển dụng",
    path: "/admin/jobs",
    matchPaths: ["/admin/jobs", "/admin/applications"],
    hasSubmenu: true,
    submenu: [
      {
        label: "Tin tuyển dụng",
        path: "/admin/jobs",
      },
      {
        label: "Hồ sơ ứng viên",
        path: "/admin/applications",
      },
    ],
  },
  {
    icon: <Settings size={20} />,
    label: "Cài đặt",
    path: "/admin/settings",
    matchPaths: ["/admin/settings", "/admin/settings/maintenance", "/admin/settings/terms"],
    hasSubmenu: true,
    submenu: [
      {
        label: "Cài đặt chung",
        path: "/admin/settings",
        matchPaths: ["/admin/settings"],
      },
      {
        label: "Chế độ bảo trì",
        path: "/admin/settings/maintenance",
        matchPaths: ["/admin/settings/maintenance"],
      },
      {
        label: "Điều khoản dịch vụ",
        path: "/admin/settings/terms",
        matchPaths: ["/admin/settings/terms"],
      },
    ],
  },
];

const Sidebar = ({ onNavigate }) => {
  const location = useLocation();
  const { adminChatUnreadCount, adminLogoUrl } = useContext(AdminContext);
  const sidebarLogoSrc = resolveAdminPanelLogoSrc(adminLogoUrl);
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleSubmenu = (index) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  useEffect(() => {
    const pathname = location.pathname;
    // tránh warning "setState in effect" của eslint rule dự án
    const t = setTimeout(() => {
      setExpandedMenus((prev) => {
        const next = { ...prev };
        SIDEBAR_MENU_ITEMS.forEach((item, index) => {
          if (!item.hasSubmenu || !item.submenu?.length) return;
          const anyChildActive = item.submenu.some((sub) =>
            submenuItemActive(pathname, sub),
          );
          if (anyChildActive) next[index] = true;
        });
        return next;
      });
    }, 0);
    return () => clearTimeout(t);
  }, [location.pathname]);

  return (
    <div className="h-screen w-64 bg-white border-r border-gray-100 flex flex-col py-4 sm:py-6 sticky top-0 overflow-y-auto">
      <div className="px-4 sm:px-6 mb-6 sm:mb-10 flex items-center gap-2 sm:gap-3">
        <div className="w-10 h-8 sm:w-12 sm:h-10 rounded-lg overflow-hidden flex items-center justify-center shadow-md border border-gray-100 bg-gray-50 shrink-0">
          <img
            src={sidebarLogoSrc}
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

      <nav className="flex-1 px-4 space-y-2.5">
        {SIDEBAR_MENU_ITEMS.map((item, index) => {
          const isActive = item.matchPaths
            ? pathMatchesList(location.pathname, item.matchPaths)
            : location.pathname === item.path;

          const hasSubmenu = item.hasSubmenu && item.submenu?.length > 0;
          const isExpanded = expandedMenus[index];

          return (
            <div key={item.label}>
              {hasSubmenu ? (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleSubmenu(index)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleSubmenu(index);
                    }
                  }}
                  className={`
                    flex items-center justify-between px-4 py-4 rounded-xl cursor-pointer transition-all duration-200
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
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={16} />
                  </motion.div>
                </div>
              ) : (
                <Link to={item.path} onClick={() => onNavigate?.()}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      flex items-center justify-between px-4 py-4 rounded-xl cursor-pointer transition-all duration-200
                      ${
                        isActive
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                          : "text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={isActive ? "text-white" : "text-gray-400"}
                      >
                        {item.icon}
                      </span>
                      <span className="font-semibold text-[15px]">
                        {item.label}
                      </span>

                      {item.hasBadge && adminChatUnreadCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1 animate-pulse">
                          {adminChatUnreadCount > 99 ? "99+" : adminChatUnreadCount}
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
              )}

              <AnimatePresence>
                {hasSubmenu && isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-blue-100 pl-2">
                      {item.submenu.map((subItem) => {
                        const isSubActive = submenuItemActive(
                          location.pathname,
                          subItem,
                        );
                        return (
                          <Link
                            key={subItem.path + subItem.label}
                            to={subItem.path}
                            onClick={() => onNavigate?.()}
                          >
                            <motion.div
                              whileHover={{ x: 4 }}
                              whileTap={{ scale: 0.98 }}
                              className={`
                                flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                                ${
                                  isSubActive
                                    ? "text-blue-600 bg-blue-50"
                                    : "text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                                }
                              `}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {subItem.label}
                            </motion.div>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
