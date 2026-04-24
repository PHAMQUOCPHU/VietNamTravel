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
    <footer className="mt-24 border-t border-blue-100 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <h2 className="text-3xl font-extrabold text-blue-600 tracking-tight mb-3">
              VietNam Travel
            </h2>
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
              Nền tảng đặt tour thông minh, giúp bạn tìm hành trình phù hợp và trải
              nghiệm chuyến đi trọn vẹn hơn mỗi ngày.
            </p>
            <div className="flex gap-3 mt-5">
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-white text-blue-600 border border-blue-100 shadow-sm flex items-center justify-center hover:-translate-y-0.5 transition dark:bg-slate-900 dark:border-slate-700"
              >
                <FaFacebookF />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-white text-pink-500 border border-pink-100 shadow-sm flex items-center justify-center hover:-translate-y-0.5 transition dark:bg-slate-900 dark:border-slate-700"
              >
                <FaInstagram />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-white text-sky-500 border border-sky-100 shadow-sm flex items-center justify-center hover:-translate-y-0.5 transition dark:bg-slate-900 dark:border-slate-700"
              >
                <FaTwitter />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-base font-black uppercase tracking-wider text-slate-800 mb-4 dark:text-slate-100">
              Liên kết nhanh
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
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
                <Link to="/my-booking" className="hover:text-blue-600 transition">
                  Đơn đặt của tôi
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-black uppercase tracking-wider text-slate-800 mb-4 dark:text-slate-100">
              Liên hệ
            </h3>
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <p>12 Nguyễn Văn Bảo, P.1, Gò Vấp, TP.HCM</p>
              <p>0905 713 702</p>
              <p>phamquocphu@gmail.com</p>
            </div>
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=12%20Nguy%E1%BB%85n%20V%C4%83n%20B%E1%BA%A3o%2C%20G%C3%B2%20V%E1%BA%A5p%2C%20TP.HCM"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition"
            >
              <FaMapMarkedAlt size={16} />
              Chỉ đường Google Maps
            </a>
          </div>

          <div>
            <h3 className="text-base font-black uppercase tracking-wider text-slate-800 mb-4 dark:text-slate-100">
              Phương thức thanh toán
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200">
                <FaMoneyBillWave className="text-emerald-500" />
                Tiền mặt (COD)
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200">
                <FaQrcode className="text-blue-500" />
                VNPay
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200">
                <FaCcPaypal className="text-sky-500" />
                PayPal (Quốc tế)
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-blue-100 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400">
          © {new Date().getFullYear()} VietNam Travel. All rights reserved.
          <span className="mx-2">•</span>
          Designed by <a href="https://phamquocphu.com" className="text-blue-600 hover:text-blue-700 transition">Phạm Quốc Phú</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
