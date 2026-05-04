import React, { useContext } from "react";
import { motion } from "framer-motion";
import { Copy, Check, TicketPercent } from "lucide-react";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";

const VoucherCard = ({ voucher, isSidebar = false, onUseNow }) => {
  const { user } = useContext(AppContext);
  const [copied, setCopied] = React.useState(false);

  const limit = Math.max(1, Number(voucher.usageLimit) || 1);
  const isExhausted = (Number(voucher.usedCount) || 0) >= limit;
  const isUsedByUser =
    Boolean(voucher.usedByMe) ||
    !!(user?._id &&
      voucher.usedBy?.some((id) => String(id) === String(user._id)));
  const isDisabled = isExhausted || isUsedByUser || new Date(voucher.expiryDate) < new Date();

  const handleCopy = () => {
    if (isDisabled) return;
    navigator.clipboard.writeText(voucher.code);
    setCopied(true);
    toast.success("Đã copy mã: " + voucher.code);
    setTimeout(() => setCopied(false), 2000);
  };

  let statusLabel = "";
  if (isUsedByUser) statusLabel = "Đã dùng";
  else if (isExhausted) statusLabel = "Hết lượt";
  else if (new Date(voucher.expiryDate) < new Date()) statusLabel = "Hết hạn";

  return (
    <motion.div
      whileHover={isDisabled ? {} : { scale: 1.02 }}
      className={`relative flex w-full min-w-0 overflow-hidden rounded-xl border bg-white shadow-sm ${isSidebar ? "flex-row items-stretch" : "items-center"} ${isDisabled ? "border-gray-200 grayscale opacity-80" : "border-blue-100"}`}
    >
      <div className={`${isDisabled ? "bg-gray-400" : "bg-blue-600"} text-white ${isSidebar ? "p-3 w-16" : "p-4"} flex flex-col justify-center items-center relative h-full`}>
        <TicketPercent size={isSidebar ? 24 : 28} />
        {/* Đường răng cưa */}
        <div className={`absolute right-0 top-0 bottom-0 w-[4px] bg-[radial-gradient(circle_at_right,_transparent_4px,_${isDisabled ? "#9ca3af" : "#2563eb"}_4px)] bg-[length:4px_12px]`}></div>
      </div>
      
      <div className={`flex-1 ${isSidebar ? "p-3 pl-4 flex flex-col justify-center" : "p-3 pl-4 flex justify-between items-center"} bg-gradient-to-r ${isDisabled ? "from-gray-50 to-white" : "from-blue-50/50 to-white"}`}>
        <div className={isSidebar ? "mb-2" : ""}>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Giảm {voucher.discountValue.toLocaleString()}đ</p>
          <div className="flex items-center gap-2 mb-1">
            <p className={`text-sm font-black ${isDisabled ? "text-gray-600 bg-gray-100 border-gray-200" : "text-blue-900 bg-blue-100/50 border-blue-200"} font-mono inline-block px-2 py-0.5 rounded border`}>
              {voucher.code}
            </p>
            {isDisabled && (
              <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {statusLabel}
              </span>
            )}
          </div>
          <p className="text-[10px] text-gray-400">Đơn tối thiểu: {voucher.minOrderValue.toLocaleString()}đ</p>
          
          {isSidebar && !isDisabled && (
             <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
               <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${Math.min(((Number(voucher.usedCount) || 0) / limit) * 100, 100)}%` }}></div>
             </div>
          )}
          {isSidebar && !isDisabled && (
            <p className="text-[9px] text-gray-400 mt-1 text-right font-medium tracking-wider">ĐÃ DÙNG {voucher.usedCount}/{limit}</p>
          )}
        </div>
        
        <div className={`${isSidebar ? "flex items-center justify-between mt-2 pt-2 border-t border-gray-100" : "ml-2"}`}>
          {!isSidebar ? (
            <button
              onClick={handleCopy}
              disabled={isDisabled}
              className={`p-2 rounded-full transition-colors ${
                isDisabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : copied ? "bg-emerald-100 text-emerald-600" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
              }`}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          ) : (
            <>
              <button
                onClick={handleCopy}
                disabled={isDisabled}
                className={`text-[11px] font-bold flex items-center gap-1 ${isDisabled ? "text-gray-400 cursor-not-allowed" : "text-blue-600 hover:text-blue-700"}`}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Đã copy" : "Sao chép"}
              </button>
              
              <button
                onClick={() => {
                  if(!isDisabled && onUseNow) onUseNow(voucher.code);
                }}
                disabled={isDisabled}
                className={`px-4 py-1.5 rounded-full text-[11px] font-bold text-white ${isDisabled ? "bg-gray-300 cursor-not-allowed" : "bg-gradient-to-r from-orange-500 to-red-500 shadow-md hover:shadow-lg transition-all active:scale-95"}`}
              >
                Dùng ngay
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(VoucherCard);
