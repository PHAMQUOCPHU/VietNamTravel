import React from "react";
import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaMapMarkedAlt,
  FaMoneyBillWave,
  FaCcPaypal,
  FaQrcode,
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="mt-16 sm:mt-20 md:mt-24 border-t border-blue-100 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-8 sm:py-10 md:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-10">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-blue-600 tracking-tight mb-2 sm:mb-3">
              VietNam Travel
            </h2>
            <p className="text-xs sm:text-sm leading-6 sm:leading-7 text-slate-600 dark:text-slate-300">
              Nền tảng đặt tour thông minh, giúp bạn tìm hành trình phù hợp và
              trải nghiệm chuyến đi trọn vẹn hơn mỗi ngày.
            </p>
            <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-5">
              <a
                href="#"
                className="w-8 sm:w-9 h-8 sm:h-9 rounded-lg bg-white text-blue-600 border border-blue-100 shadow-sm flex items-center justify-center hover:-translate-y-0.5 transition dark:bg-slate-900 dark:border-slate-700"
              >
                <FaFacebookF className="text-sm sm:text-base" />
              </a>
              <a
                href="#"
                className="w-8 sm:w-9 h-8 sm:h-9 rounded-lg bg-white text-pink-500 border border-pink-100 shadow-sm flex items-center justify-center hover:-translate-y-0.5 transition dark:bg-slate-900 dark:border-slate-700"
              >
                <FaInstagram className="text-sm sm:text-base" />
              </a>
              <a
                href="#"
                className="w-8 sm:w-9 h-8 sm:h-9 rounded-lg bg-white text-sky-500 border border-sky-100 shadow-sm flex items-center justify-center hover:-translate-y-0.5 transition dark:bg-slate-900 dark:border-slate-700"
              >
                <FaTwitter className="text-sm sm:text-base" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-slate-800 mb-3 sm:mb-4 dark:text-slate-100">
              Liên kết nhanh
            </h3>
            <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <li>
                <Link to="/" className="hover:text-blue-600 transition">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link to="/tours" className="hover:text-blue-600 transition">
                  Tour du lịch
                </Link>
              </li>
              <li>
                <Link to="/blogs" className="hover:text-blue-600 transition">
                  Blogs
                </Link>
              </li>
              <li>
                <Link
                  to="/my-booking"
                  className="hover:text-blue-600 transition"
                >
                  Đơn đặt của tôi
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-slate-800 mb-3 sm:mb-4 dark:text-slate-100">
              Liên hệ
            </h3>
            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <p>12 Nguyễn Văn Bảo, P.1, Gò Vấp, TP.HCM</p>
              <p>0905 713 702</p>
              <p>phamquocphu@gmail.com</p>
            </div>
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=12%20Nguy%E1%BB%85n%20V%C4%83n%20B%E1%BA%A3o%2C%20G%C3%B2%20V%E1%BA%A5p%2C%20TP.HCM"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 sm:mt-4 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-blue-600 text-white text-xs sm:text-sm font-bold hover:bg-blue-700 transition"
            >
              <FaMapMarkedAlt size={14} className="sm:w-4 sm:h-4" />
              Chỉ đường Google Maps
            </a>
          </div>

          <div>
            <h3 className="text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-slate-800 mb-3 sm:mb-4 dark:text-slate-100">
              Phương thức thanh toán
            </h3>
            <div className="space-y-2 sm:space-y-2.5">
              <div className="flex items-center gap-2 rounded-lg sm:rounded-xl bg-white border border-slate-200 px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200">
                <FaMoneyBillWave className="text-emerald-500 shrink-0 text-sm" />
                <span className="truncate">Tiền mặt (COD)</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg sm:rounded-xl bg-white border border-slate-200 px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200">
                <FaQrcode className="text-blue-500 shrink-0 text-sm" />
                <span className="truncate">VNPay</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg sm:rounded-xl bg-white border border-slate-200 px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200">
                <FaCcPaypal className="text-sky-500 shrink-0 text-sm" />
                <span className="truncate">PayPal (Quốc tế)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 sm:mt-10 pt-4 sm:pt-6 border-t border-blue-100 dark:border-slate-800 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400 px-2">
          © {new Date().getFullYear()} VietNam Travel. All rights reserved.
          <span className="mx-1 sm:mx-2">•</span>
          Designed by{" "}
          <a
            href="https://phamquocphu.com"
            className="text-blue-600 hover:text-blue-700 transition"
          >
            Phạm Quốc Phú
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
