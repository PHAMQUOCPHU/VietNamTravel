import React, { useEffect, useState, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Ticket,
  ChevronRight,
  Home,
  Map,
  ArrowLeft,
  Heart,
  User,
  DollarSign,
  BookImage,
  AlertTriangle,
  Briefcase,
} from "lucide-react";
import VoucherCard from "./VoucherCard";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { getPublicVouchers } from "../services";
import { resolveSiteLogoSrc } from "../utils/siteLogo";

const AppSidebar = ({ isOpen, onClose }) => {
  const { backendUrl, user, token, siteConfig } = useContext(AppContext);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("menu"); // 'menu' | 'vouchers' | 'exchange'
  const [exchangeAmount, setExchangeAmount] = useState("");
  const [exchangeCurrency, setExchangeCurrency] = useState("USD");

  const exchangeRates = {
    USD: 25430,
    EUR: 27150,
    JPY: 168,
    CNY: 3520,
    GBP: 31800,
  };

  const exchangedValue =
    (parseFloat(exchangeAmount) || 0) * exchangeRates[exchangeCurrency];

  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;
    setView("menu");
    const ac = new AbortController();
    const load = async () => {
      setLoading(true);
      try {
        const data = await getPublicVouchers({
          backendUrl,
          token,
          signal: ac.signal,
        });
        if (!ac.signal.aborted && data.success) {
          setVouchers(data.vouchers);
        }
      } catch (error) {
        if (error.code !== "ERR_CANCELED" && error.name !== "CanceledError") {
          console.error(error);
        }
      } finally {
        if (!ac.signal.aborted) {
          setLoading(false);
        }
      }
    };
    load();
    return () => ac.abort();
  }, [isOpen, backendUrl, token]);

  const handleUseNow = (code) => {
    navigator.clipboard.writeText(code);
    onClose();
    navigate("/tours");
  };

  const handleNavigation = (path) => {
    onClose();
    navigate(path);
  };

  const logoSrc = resolveSiteLogoSrc(siteConfig?.logoUrl);

  const validVouchersCount = vouchers.filter((v) => {
    const limit = Math.max(1, Number(v.usageLimit) || 1);
    const isExhausted = (Number(v.usedCount) || 0) >= limit;
    const isUsedByUser =
      Boolean(v.usedByMe) ||
      !!(user?._id && v.usedBy?.some((id) => String(id) === String(user._id)));
    const isExpired = new Date(v.expiryDate) < new Date();
    return !isExhausted && !isUsedByUser && !isExpired;
  }).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-[340px] max-w-[85vw] bg-white z-[100] shadow-2xl flex flex-col overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {view === "menu" ? (
                <motion.div
                  key="menu"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  className="flex flex-col h-full"
                >
                  <div className="bg-white px-5 py-5 flex items-center justify-between border-b border-gray-100 shadow-sm z-10 gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <img
                        src={logoSrc}
                        alt=""
                        width={36}
                        height={36}
                        className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-gray-100"
                      />
                      <h2 className="truncate text-xl font-extrabold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
                        VietNam Travel
                      </h2>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-2 bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    <button
                      onClick={() => setView("vouchers")}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-200 transition-colors">
                          <Ticket size={20} />
                        </div>
                        <span className="font-bold text-gray-800">
                          Kho Voucher của tôi
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {validVouchersCount > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                            {validVouchersCount}
                          </span>
                        )}
                        <ChevronRight
                          size={18}
                          className="text-gray-400 group-hover:text-blue-500"
                        />
                      </div>
                    </button>

                    <div className="h-px bg-gray-100 my-2 mx-2"></div>

                    <button
                      onClick={() => handleNavigation("/diaries")}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-purple-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg group-hover:bg-purple-200 transition-colors">
                          <BookImage size={20} />
                        </div>
                        <span className="font-bold text-gray-800">
                          Nhật ký hành trình
                        </span>
                      </div>
                      <ChevronRight
                        size={18}
                        className="text-gray-400 group-hover:text-purple-500"
                      />
                    </button>

                    <div className="h-px bg-gray-100 my-2 mx-2"></div>

                    <button
                      onClick={() => handleNavigation("/disaster-map")}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 text-slate-700 rounded-lg group-hover:bg-slate-200 transition-colors">
                          <Map size={20} />
                        </div>
                        <span className="font-bold text-gray-800">
                          Bản đồ cảnh báo
                        </span>
                      </div>
                      <ChevronRight
                        size={18}
                        className="text-gray-400 group-hover:text-slate-500"
                      />
                    </button>

                    <div className="h-px bg-gray-100 my-2 mx-2"></div>

                    <button
                      onClick={() => setView("exchange")}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-emerald-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg group-hover:bg-emerald-200 transition-colors">
                          <DollarSign size={20} />
                        </div>
                        <span className="font-bold text-gray-800">
                          Đổi tỷ giá
                        </span>
                      </div>
                      <ChevronRight
                        size={18}
                        className="text-gray-400 group-hover:text-emerald-500"
                      />
                    </button>

                    <button
                      onClick={() => handleNavigation("/careers")}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-sky-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-sky-100 text-sky-600 rounded-lg group-hover:bg-sky-200 transition-colors">
                          <Briefcase size={20} />
                        </div>
                        <span className="font-bold text-gray-800">
                          Tuyển dụng
                        </span>
                      </div>
                      <ChevronRight
                        size={18}
                        className="text-gray-400 group-hover:text-sky-500"
                      />
                    </button>
                  </div>
                </motion.div>
              ) : view === "vouchers" ? (
                <motion.div
                  key="vouchers"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  className="flex flex-col h-full bg-slate-50"
                >
                  <div className="bg-white px-4 py-4 flex items-center border-b border-gray-100 shadow-sm z-10 gap-3">
                    <button
                      onClick={() => setView("menu")}
                      className="p-2 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-lg font-black text-gray-800">
                      Kho Voucher của tôi
                    </h2>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-10 space-y-3">
                        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                        <p className="text-xs text-gray-400 font-medium">
                          Đang tải mã giảm giá...
                        </p>
                      </div>
                    ) : vouchers.length > 0 ? (
                      vouchers.map((voucher) => (
                        <VoucherCard
                          key={voucher._id}
                          voucher={voucher}
                          isSidebar={true}
                          onUseNow={handleUseNow}
                        />
                      ))
                    ) : (
                      <div className="text-center py-10">
                        <Ticket className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium text-sm">
                          Chưa có mã giảm giá nào
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : view === "exchange" ? (
                <motion.div
                  key="exchange"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  className="flex flex-col h-full bg-slate-50"
                >
                  <div className="bg-white px-4 py-4 flex items-center border-b border-gray-100 shadow-sm z-10 gap-3">
                    <button
                      onClick={() => setView("menu")}
                      className="p-2 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-lg font-black text-gray-800">
                      Đổi tỷ giá ngoại tệ
                    </h2>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 space-y-6 flex flex-col">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                          Số lượng quy đổi
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={exchangeAmount}
                            onChange={(e) => setExchangeAmount(e.target.value)}
                            placeholder="Nhập số tiền..."
                            className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                          />
                          <select
                            value={exchangeCurrency}
                            onChange={(e) =>
                              setExchangeCurrency(e.target.value)
                            }
                            className="w-24 px-2 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700"
                          >
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="JPY">JPY</option>
                            <option value="CNY">CNY</option>
                            <option value="GBP">GBP</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                          Kết quả (VNĐ)
                        </label>
                        <div className="text-3xl font-black text-emerald-600 break-all">
                          {exchangedValue.toLocaleString("vi-VN")}{" "}
                          <span className="text-lg text-emerald-500">đ</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 italic">
                          Tỷ giá tham khảo: 1 {exchangeCurrency} ={" "}
                          {exchangeRates[exchangeCurrency].toLocaleString(
                            "vi-VN",
                          )}{" "}
                          VNĐ
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleNavigation("/tours")}
                      className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg hover:shadow-xl transition-all active:scale-95"
                    >
                      Dùng kết quả này để đặt Tour
                    </button>

                    <div className="mt-auto text-center pt-10">
                      <p className="text-sm font-semibold text-gray-500">
                        "Tính toán dễ dàng, an tâm khám phá Việt Nam!"
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AppSidebar;
