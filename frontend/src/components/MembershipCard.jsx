import React from "react";
import { Crown, Star, Gem, ChevronRight } from "lucide-react";

const MembershipCard = ({ user, onClick }) => {
  // 1. LẤY TỔNG CHI TIÊU THẬT
  const total = Number(user?.totalSpent) || 0;

  // 2. TỰ ĐỘNG XÁC ĐỊNH HẠNG THEO SỐ TIỀN (Đồng bộ với Privileges)
  const getDisplayRank = () => {
    if (total >= 30000000) return "Kim cương";
    if (total >= 10000000) return "Vàng";
    return "Bạc";
  };

  const rank = getDisplayRank();

  const getCardStyle = (rankName) => {
    switch (rankName) {
      case "Vàng":
        return "from-amber-400 via-orange-500 to-yellow-600 shadow-amber-200";
      case "Kim cương":
        return "from-cyan-400 via-blue-500 to-indigo-600 shadow-cyan-200";
      default:
        return "from-slate-400 via-gray-500 to-slate-600 shadow-gray-200";
    }
  };

  // 3. TÍNH TOÁN TIẾN TRÌNH THEO MỐC
  const target =
    rank === "Bạc" ? 10000000 : rank === "Vàng" ? 30000000 : 30000000;
  const progress = Math.min(100, (total / target) * 100);

  return (
    <div
      onClick={onClick}
      className={`relative mx-3 mt-2 mb-4 p-4 rounded-2xl bg-gradient-to-br ${getCardStyle(rank)} 
      text-white cursor-pointer overflow-hidden group shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-95`}
    >
      {/* Hiệu ứng lấp lánh (Shimmer) */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg">
            {rank === "Kim cương" ? (
              <Gem size={20} />
            ) : rank === "Vàng" ? (
              <Star size={20} />
            ) : (
              <Crown size={20} />
            )}
          </div>
          <span className="text-[10px] font-black tracking-[0.2em] uppercase opacity-80">
            Vietnam Travel Priority
          </span>
        </div>

        <div className="mb-4">
          <p className="text-[10px] uppercase opacity-70 mb-1">
            Hạng thành viên
          </p>
          <h3 className="text-xl font-black tracking-tighter italic uppercase">
            {rank}
          </h3>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold">
            <span>Tiến trình</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-1000"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-[9px] font-medium italic opacity-80 underline">
            Xem đặc quyền của bạn
          </p>
          <ChevronRight
            size={14}
            className="group-hover:translate-x-1 transition-transform"
          />
        </div>
      </div>
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
    </div>
  );
};

export default MembershipCard;
