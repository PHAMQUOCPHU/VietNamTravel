import React from "react";
import { Link } from "react-router-dom";
import { FaFacebookF, FaInstagram, FaTwitter, FaMapMarkedAlt } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-t border-blue-100 mt-24">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

        {/* Brand */}
        <div>
          <h2 className="text-3xl font-bold text-blue-600 mb-4">
            VietNam Travel ✈️
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Nền tảng đặt tour du lịch thông minh,  
            giúp bạn khám phá điểm đến phù hợp  
            và tận hưởng chuyến đi trọn vẹn.
          </p>
        </div>

        {/* Links */}
        <div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-5">
            Liên kết nhanh
          </h3>
          <ul className="space-y-3 text-lg">
            <li><Link to="/" className="hover:text-blue-600">Trang chủ</Link></li>
            <li><Link to="/tours" className="hover:text-blue-600">Tour du lịch</Link></li>
            <li><Link to="/about" className="hover:text-blue-600">Giới thiệu</Link></li>
            <li><Link to="/contact" className="hover:text-blue-600">Liên hệ</Link></li>
          </ul>
        </div>

        {/* Contact + Direction */}
        <div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-5">
            Liên hệ
          </h3>

          <p className="text-lg text-gray-600 mb-2">
            📍 12 Nguyễn Văn Bảo, Phường 1, Gò Vấp, TP.HCM
          </p>
          <p className="text-lg text-gray-600 mb-2">
            📞 0905 713 702
          </p>
          <p className="text-lg text-gray-600 mb-5">
            ✉️ phamquocphu@gmail.com
          </p>

          {/* Direction Button */}
          <a
            href="https://www.google.com/maps/dir/?api=1&destination=12%20Nguy%E1%BB%85n%20V%C4%83n%20B%E1%BA%A3o%2C%20G%C3%B2%20V%E1%BA%A5p%2C%20TP.HCM"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-5 py-3 rounded-xl
                       bg-blue-500 text-white text-lg font-semibold
                       hover:bg-blue-600 transition shadow-md"
          >
            <FaMapMarkedAlt size={22} />
            Chỉ đường trên Google Maps
          </a>

          {/* Social */}
          <div className="flex gap-4 mt-6">
            <FaFacebookF className="text-blue-600 text-2xl cursor-pointer hover:scale-110 transition" />
            <FaInstagram className="text-pink-500 text-2xl cursor-pointer hover:scale-110 transition" />
            <FaTwitter className="text-sky-500 text-2xl cursor-pointer hover:scale-110 transition" />
          </div>
        </div>

        {/* Map */}
        <div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-5">
            Bản đồ
          </h3>
          <div className="w-full h-60 rounded-xl overflow-hidden shadow-md border">
            <iframe
              title="TripGo Map"
              src="https://www.google.com/maps?q=12%20Nguy%E1%BB%85n%20V%C4%83n%20B%E1%BA%A3o%2C%20G%C3%B2%20V%E1%BA%A5p%2C%20TP.HCM&output=embed"
              className="w-full h-full border-0"
              loading="lazy"
            />
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-blue-100 py-6 text-center text-lg text-gray-500">
        © {new Date().getFullYear()} PhamQuocPhu. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
