import React, { useState, useEffect, useContext } from "react";
import { motion } from "framer-motion";
import { Copy, Check, TicketPercent, Clock } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { AppContext } from "../context/AppContext";

const VoucherWallet = () => {
  const { backendUrl, token } = useContext(AppContext);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!backendUrl) return;
    const ac = new AbortController();
    (async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/vouchers/public`, {
          signal: ac.signal,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!ac.signal.aborted && data.success) {
          setVouchers(data.vouchers);
        }
      } catch (error) {
        if (
          error.code !== "ERR_CANCELED" &&
          error.name !== "CanceledError"
        ) {
          console.error("Lỗi lấy danh sách voucher", error);
        }
      } finally {
        if (!ac.signal.aborted) {
          setLoading(false);
        }
      }
    })();
    return () => ac.abort();
  }, [backendUrl, token]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8 bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
        <h2 className="text-2xl font-black text-blue-900 mb-2 flex justify-center items-center gap-2">
          <TicketPercent className="text-blue-600" /> Kho Voucher
        </h2>
        <p className="text-sm font-semibold text-blue-600 italic">
          "Kho tàng ưu đãi của bạn. Bỏ túi mã hay, đi ngay không lo nghĩ!"
        </p>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 font-medium py-10">Đang tải mã giảm giá...</div>
      ) : vouchers.length === 0 ? (
        <div className="text-center text-gray-400 font-medium py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          Hiện tại chưa có mã giảm giá nào. Bạn quay lại sau nhé!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vouchers.map((voucher) => (
            <VoucherItem key={voucher._id} voucher={voucher} />
          ))}
        </div>
      )}
    </div>
  );
};

const VoucherItem = ({ voucher }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(voucher.code);
    setCopied(true);
    toast.success("Đã copy: " + voucher.code);
    setTimeout(() => setCopied(false), 2000);
  };

  const daysLeft = Math.ceil((new Date(voucher.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
  const limit = Math.max(1, Number(voucher.usageLimit) || 1);
  const usagePercent = Math.min(
    ((Number(voucher.usedCount) || 0) / limit) * 100,
    100,
  );

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="flex bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative"
    >
      {/* Răng cưa */}
      <div className="w-1/3 bg-gradient-to-br from-blue-600 to-indigo-600 p-4 flex flex-col items-center justify-center text-white relative">
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Giảm</span>
        <span className="text-xl font-black">{voucher.discountValue.toLocaleString()}đ</span>
        {/* Điểm răng cưa */}
        <div className="absolute right-0 top-0 bottom-0 w-[6px] bg-[radial-gradient(circle_at_right,_transparent_4px,_white_4px)] bg-[length:6px_14px]"></div>
      </div>
      
      <div className="w-2/3 p-4 bg-white relative">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Mã giảm giá</p>
            <p className="font-mono font-black text-gray-800 text-lg bg-gray-100 px-2 rounded mt-1 inline-block border border-gray-200">{voucher.code}</p>
          </div>
          <button 
            onClick={handleCopy}
            className={`p-1.5 rounded-full transition-colors ${copied ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
        
        <p className="text-[10px] font-semibold text-gray-500 mb-3">
          Đơn tối thiểu: {voucher.minOrderValue.toLocaleString()}đ
        </p>

        <div className="space-y-3">
          {/* Progress Bar Lượt dùng */}
          <div>
            <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1">
              <span>Đã dùng {voucher.usedCount}/{limit}</span>
              <span>{usagePercent.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${usagePercent > 80 ? 'bg-orange-500' : 'bg-blue-500'}`}
                style={{ width: `${usagePercent}%` }}
              ></div>
            </div>
          </div>

          {/* Ngày hết hạn */}
          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-50 p-1.5 rounded-lg border border-gray-100 inline-flex">
            <Clock size={12} className={daysLeft <= 3 ? "text-orange-500" : "text-emerald-500"} />
            {daysLeft > 0 ? (
              <span className={daysLeft <= 3 ? "text-orange-600" : ""}>Còn lại {daysLeft} ngày</span>
            ) : (
              <span className="text-red-500">Hết hạn hôm nay</span>
            )}
          </div>
        </div>
      </div>
      
      {/* Vòng tròn khuyết 2 góc */}
      <div className="absolute top-0 right-0 w-3 h-3 bg-gray-50 rounded-bl-full border-l border-b border-gray-100"></div>
      <div className="absolute bottom-0 right-0 w-3 h-3 bg-gray-50 rounded-tl-full border-l border-t border-gray-100"></div>
    </motion.div>
  );
};

export default VoucherWallet;
