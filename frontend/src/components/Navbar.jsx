import React, { useState, useContext, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  User,
  LogOut,
  ShieldCheck,
  Map, // Import thêm icon Map cho bộ sưu tập
  Heart,
  Sun,
  Moon,
  Bell,
  Compass,
} from "lucide-react";
import { AppContext } from "../context/AppContext";
import ChangePassword from "./ChangePassword";
import MembershipCard from "./MembershipCard";
import {
  DEFAULT_USER_AVATAR,
  buildNavLinks,
  getDisplayRank,
  getRankConfig,
} from "./navbar/navConfig";
import { motion, AnimatePresence } from "framer-motion";
import AppSidebar from "./AppSidebar";
import { TicketPercent } from "lucide-react";

const Navbar = () => {
  const {
    user,
    logout,
    notificationUnreadCount,
    fetchNotifications,
    markAllNotificationsRead,
    notifications,
  } = useContext(AppContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showChangePass, setShowChangePass] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifDesktopRef = useRef(null);
  const notifMobileRef = useRef(null);
  const [appSidebarOpen, setAppSidebarOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const currentSpent = Number(user?.totalSpent) || 0;
  const displayRank = getDisplayRank(currentSpent);

  const rankConfig = getRankConfig(displayRank);
  const RankIcon = rankConfig.icon;

  const handleCardClick = () => {
    navigate("/privileges");
    setMenuOpen(false);
  };

  const toggleMenu = (e) => {
    e.stopPropagation();
    setMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = savedTheme ? savedTheme === "dark" : prefersDark;
    setIsDarkMode(shouldUseDark);
    document.documentElement.classList.toggle("dark", shouldUseDark);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuOpen &&
        !event.target.closest(".mobile-menu-container") &&
        !event.target.closest(".menu-button")
      ) {
        setMenuOpen(false);
      }
      if (notifOpen) {
        const insideDesktop = notifDesktopRef.current?.contains(event.target);
        const insideMobile = notifMobileRef.current?.contains(event.target);
        if (!insideDesktop && !insideMobile) {
          setNotifOpen(false);
        }
      }
    };
    setTimeout(() => document.addEventListener("click", handleClickOutside), 0);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [menuOpen, notifOpen]);

  const toggleNotifications = async (e) => {
    e.stopPropagation();
    const next = !notifOpen;
    setNotifOpen(next);
    if (next && user) {
      await fetchNotifications();
      await markAllNotificationsRead();
    }
  };

  const navLinks = buildNavLinks(user);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav
        className={`w-full fixed top-0 left-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100 dark:bg-slate-900/95 dark:border-slate-800"
            : "bg-white/90 backdrop-blur-sm dark:bg-slate-900/90"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => setAppSidebarOpen(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>

              <Link
                to="/"
                className="flex-shrink-0 transition-transform hover:scale-105 duration-200"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mr-2 bg-sky-50 text-sky-600 border border-sky-100">
                    <Compass className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent hidden sm:block">
                    VietNam Travel
                  </span>
                </div>
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  id={link.id}
                  className={`relative px-4 py-2 text-sm font-bold transition-all duration-300 group
                    ${isActive(link.to) ? "text-blue-600" : "text-gray-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"}`}
                >
                  <span className="relative z-10 group-hover:-translate-y-0.5 transition-transform duration-300 inline-block">
                    {link.label}
                  </span>
                  <span
                    className={`absolute bottom-0 left-4 right-4 h-0.5 bg-blue-600 rounded-full transition-all duration-300 transform origin-left
                    ${isActive(link.to) ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100"}`}
                  />
                </Link>
              ))}
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => setIsDarkMode((prev) => !prev)}
                className="p-2.5 rounded-xl border border-gray-200 bg-white text-slate-700 hover:bg-slate-50 transition dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
                title={isDarkMode ? "Chuyển Light mode" : "Chuyển Dark mode"}
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              {user ? (
                <div className="relative" ref={notifDesktopRef}>
                  <button
                    id="nav-notifications"
                    type="button"
                    onClick={toggleNotifications}
                    className="relative p-2.5 rounded-xl border border-gray-200 bg-white text-slate-700 hover:bg-slate-50 transition dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
                    title="Thông báo"
                  >
                    <Bell size={18} />
                    {notificationUnreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-0.5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white dark:border-slate-900">
                        {notificationUnreadCount > 99 ? "99+" : notificationUnreadCount}
                      </span>
                    )}
                  </button>
                  {notifOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 max-h-[min(70vh,420px)] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-gray-100 z-[60] dark:bg-slate-900 dark:border-slate-700">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                          Thông báo
                        </span>
                        <Link
                          to="/notifications"
                          onClick={() => setNotifOpen(false)}
                          className="text-[11px] font-bold text-blue-600 hover:underline"
                        >
                          Xem tất cả
                        </Link>
                      </div>
                      <div className="p-2 space-y-1">
                        {(notifications || []).slice(0, 8).length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-6 italic">
                            Chưa có thông báo
                          </p>
                        ) : (
                          (notifications || []).slice(0, 8).map((n) => (
                            <div
                              key={n._id}
                              className={`rounded-xl px-3 py-2 text-xs ${
                                n.read
                                  ? "bg-slate-50 text-slate-600 dark:bg-slate-800"
                                  : "bg-blue-50 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                              }`}
                            >
                              <p className="font-bold text-[10px] uppercase text-blue-600 mb-0.5">
                                {n.title}
                              </p>
                              <p className="leading-snug">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
              {user ? (
                <div className="relative group">
                  <div className="flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100 dark:hover:bg-slate-800 dark:hover:border-slate-700">
                    <img
                      src={user.image || DEFAULT_USER_AVATAR}
                      alt="Profile"
                      className="w-10 h-10 rounded-full ring-2 ring-blue-100 object-cover shadow-sm"
                    />
                    <div className="flex flex-col items-start leading-tight">
                      <span className="text-sm font-bold text-gray-800 dark:text-slate-100">
                        {user.name}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${rankConfig.color}`}
                      >
                        <RankIcon size={14} className={rankConfig.iconClassName} />{" "}
                        {displayRank}
                      </span>
                    </div>
                  </div>

                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 overflow-hidden dark:bg-slate-900 dark:border-slate-700">
                    <div className="py-2">
                      <MembershipCard
                        user={{ ...user, rank: displayRank }}
                        onClick={handleCardClick}
                      />
                      <div className="px-4 py-2 text-[10px] text-gray-400 font-black uppercase tracking-widest border-b border-gray-50 dark:border-slate-700 dark:text-slate-400">
                        Cài đặt tài khoản
                      </div>

                      {/* 1. MỤC THÔNG TIN CÁ NHÂN */}
                      <Link
                        to="/profile"
                        className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors font-medium dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <User className="w-4 h-4 mr-3 text-blue-500" /> Thông
                        tin cá nhân
                      </Link>

                      {/* 2. MỤC BỘ SƯU TẬP CỦA TÔI (MỚI THÊM) */}
                      <Link
                        to="/favorites"
                        className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors font-medium dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <Heart className="w-4 h-4 mr-3 text-blue-500" /> Yêu thích
                      </Link>

                      <Link
                        to="/notifications"
                        className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors font-medium dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <Bell className="w-4 h-4 mr-3 text-blue-500" /> Thông báo
                      </Link>

                      <Link
                        to="/my-collection"
                        className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors font-medium dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <Map className="w-4 h-4 mr-3 text-blue-500" /> Bộ sưu
                        tập của tôi
                      </Link>

                      {/* 3. MỤC ĐỔI MẬT KHẨU */}
                      <button
                        onClick={() => setShowChangePass(true)}
                        className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors font-medium border-b border-gray-100 dark:text-slate-200 dark:hover:bg-slate-800 dark:border-slate-700"
                      >
                        <ShieldCheck className="w-4 h-4 mr-3 text-blue-500" />{" "}
                        Đổi mật khẩu
                      </button>

                      <button
                        onClick={logout}
                        className="w-full flex items-center px-4 py-4 text-sm text-red-600 font-black hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-3" /> Đăng xuất
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link to="/login">
                  <button className="px-6 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-200">
                    Login
                  </button>
                </Link>
              )}
            </div>

            <div className="md:hidden flex items-center space-x-3 mobile-menu-container">
              <button
                onClick={() => setIsDarkMode((prev) => !prev)}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                title={isDarkMode ? "Chuyển Light mode" : "Chuyển Dark mode"}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              {user && (
                <div className="relative" ref={notifMobileRef}>
                  <button
                    id="nav-notifications-mobile"
                    type="button"
                    onClick={toggleNotifications}
                    className="relative p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    title="Thông báo"
                  >
                    <Bell className="w-5 h-5" />
                    {notificationUnreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center border border-white dark:border-slate-900">
                        {notificationUnreadCount > 99 ? "99+" : notificationUnreadCount}
                      </span>
                    )}
                  </button>
                  {notifOpen && (
                    <div className="fixed left-4 right-4 top-20 max-h-[60vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-gray-100 z-[60] dark:bg-slate-900 dark:border-slate-700">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-slate-500">Thông báo</span>
                        <Link
                          to="/notifications"
                          onClick={() => setNotifOpen(false)}
                          className="text-[11px] font-bold text-blue-600"
                        >
                          Xem tất cả
                        </Link>
                      </div>
                      <div className="p-2 space-y-1 max-h-[50vh] overflow-y-auto">
                        {(notifications || []).slice(0, 8).length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-6 italic">Chưa có thông báo</p>
                        ) : (
                          (notifications || []).slice(0, 8).map((n) => (
                            <div
                              key={n._id}
                              className="rounded-xl px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                            >
                              <p className="font-bold text-[10px] uppercase text-blue-600 mb-0.5">{n.title}</p>
                              <p className="leading-snug">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {user && (
                <img
                  src={user.image || DEFAULT_USER_AVATAR}
                  alt="Profile"
                  className="w-9 h-9 rounded-full ring-2 ring-blue-100 object-cover"
                />
              )}
              <button
                onClick={toggleMenu}
                className="menu-button p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {menuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-md"
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed top-16 left-0 right-0 bg-white shadow-xl border-t border-gray-100 mobile-menu-container rounded-b-[2rem] overflow-hidden dark:bg-slate-900 dark:border-slate-700 max-h-[85vh] overflow-y-auto"
            >
            <div className="px-4 py-6 space-y-4">
              {user && (
                <MembershipCard
                  user={{ ...user, rank: displayRank }}
                  onClick={handleCardClick}
                />
              )}
              <div className="space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    id={`mobile-${link.id}`}
                    onClick={() => setMenuOpen(false)}
                    className={`block px-4 py-3 rounded-xl text-base font-bold transition-colors ${
                      isActive(link.to)
                        ? "bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400"
                        : "text-gray-700 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
                {user ? (
                  <div className="space-y-1">
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center px-4 py-3 text-gray-700 font-bold hover:bg-gray-50 rounded-xl dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <User className="w-5 h-5 text-blue-500 mr-4" /> Thông tin
                      cá nhân
                    </Link>

                    {/* BỘ SƯU TẬP CHO MOBILE */}
                    <Link
                      to="/favorites"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center px-4 py-3 text-gray-700 font-bold hover:bg-gray-50 rounded-xl dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Heart className="w-5 h-5 text-blue-500 mr-4" /> Yêu thích
                    </Link>

                    <Link
                      to="/notifications"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center px-4 py-3 text-gray-700 font-bold hover:bg-gray-50 rounded-xl dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Bell className="w-5 h-5 text-blue-500 mr-4" /> Thông báo
                    </Link>

                    <Link
                      to="/my-collection"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center px-4 py-3 text-gray-700 font-bold hover:bg-gray-50 rounded-xl dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Map className="w-5 h-5 text-blue-500 mr-4" /> Bộ sưu tập
                      của tôi
                    </Link>

                    <button
                      onClick={() => {
                        setShowChangePass(true);
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center px-4 py-3 text-gray-700 font-bold hover:bg-gray-50 rounded-xl dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <ShieldCheck className="w-5 h-5 text-blue-500 mr-4" /> Đổi
                      mật khẩu
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center px-4 py-4 text-red-600 font-black hover:bg-red-50 rounded-xl"
                    >
                      <LogOut className="w-5 h-5 mr-4" /> Đăng xuất
                    </button>
                  </div>
                ) : (
                  <Link to="/login" onClick={() => setMenuOpen(false)}>
                    <button className="w-full py-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-2xl font-black uppercase text-sm shadow-md transition-all">
                      Đăng nhập ngay
                    </button>
                  </Link>
                )}
              </div>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ChangePassword
        isOpen={showChangePass}
        onClose={() => setShowChangePass(false)}
      />

      <AppSidebar 
        isOpen={appSidebarOpen} 
        onClose={() => setAppSidebarOpen(false)} 
      />

      <div className="h-16 sm:h-20" />
    </>
  );
};

export default Navbar;
