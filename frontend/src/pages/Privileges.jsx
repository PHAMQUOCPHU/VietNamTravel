import React, { useContext, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import {
  Crown,
  Gem,
  Zap,
  Gift,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import MembershipCard from "../components/MembershipCard";

const Privileges = () => {
  const { user, getUserBookings } = useContext(AppContext);

  // Gọi lại API để đảm bảo số tiền và RANK mới nhất khi vào trang
  useEffect(() => {
    const fetchLatestData = async () => {
      if (getUserBookings) {
        await getUserBookings();
      }
    };
    fetchLatestData();
    window.scrollTo(0, 0);
  }, [getUserBookings]);

  const MILESTONES = {
    GOLD: 10000000,
    DIAMOND: 30000000,
  };

  const currentSpent = Number(user?.totalSpent) || 0;

  // LOGIC TỰ ĐỘNG XÁC ĐỊNH HẠNG TRÊN FRONTEND ĐỂ ĐỔI MÀU THẺ NGAY LẬP TỨC
  const getRank = () => {
    if (currentSpent >= MILESTONES.DIAMOND) return "Kim cương";
    if (currentSpent >= MILESTONES.GOLD) return "Vàng";
    return "Bạc";
  };

  const rank = getRank();

  const getNextRankInfo = () => {
    if (rank === "Bạc") {
      const needed = MILESTONES.GOLD - currentSpent;
      return {
        next: "Vàng",
        needed: needed > 0 ? needed : 0,
        progress: (currentSpent / MILESTONES.GOLD) * 100,
        color: "text-amber-500",
      };
    } else if (rank === "Vàng") {
      const needed = MILESTONES.DIAMOND - currentSpent;
      return {
        next: "Kim cương",
        needed: needed > 0 ? needed : 0,
        progress: (currentSpent / MILESTONES.DIAMOND) * 100,
        color: "text-cyan-500",
      };
    }
    return null;
  };

  const nextRank = getNextRankInfo();

  const benefits = [
    {
      id: 1,
      title: "Ưu đãi đặt vé",
      silver: "2%",
      gold: "5%",
      diamond: "10%",
      icon: <Zap size={18} className="text-yellow-500" />,
    },
    {
      id: 2,
      title: "Hỗ trợ ưu tiên",
      silver: "Email",
      gold: "Hotline",
      diamond: "Quản gia",
      icon: <Crown size={18} className="text-blue-500" />,
    },
    {
      id: 3,
      title: "Quà sinh nhật",
      silver: "500k",
      gold: "2 Triệu",
      diamond: "Free Resort",
      icon: <Gift size={18} className="text-pink-500" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-20 px-4 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
          <div className="flex justify-center">
            <div className="w-full max-w-sm drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
              {/* Truyền rank đã tính toán vào thẻ để đổi màu ngay */}
              <MembershipCard user={{ ...user, rank }} />
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                <TrendingUp size={24} />
              </div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">
                Tiến trình nâng hạng
              </h2>
            </div>

            {nextRank ? (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 p-5 rounded-2xl border border-dashed border-blue-100">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">
                    Tổng tích lũy hiện tại
                  </p>
                  <span className="text-3xl font-black text-gray-900">
                    {currentSpent.toLocaleString("vi-VN")}{" "}
                    <span className="text-sm font-medium text-gray-400 font-sans">
                      VNĐ
                    </span>
                  </span>
                </div>

                <p className="text-gray-600 leading-relaxed text-sm">
                  Sếp chỉ cần tích lũy thêm{" "}
                  <span className="font-black text-red-500 text-lg">
                    {nextRank.needed.toLocaleString("vi-VN")} VNĐ
                  </span>{" "}
                  để lên hạng{" "}
                  <span className={`font-black ${nextRank.color}`}>
                    {nextRank.next}
                  </span>
                  .
                </p>

                <div className="relative pt-2">
                  <div className="flex justify-between mb-2 text-[10px] font-black uppercase tracking-wider text-gray-400">
                    <span>{rank}</span>
                    <span>{nextRank.next}</span>
                  </div>
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-50 shadow-inner">
                    <div
                      className={`h-full transition-all duration-1000 rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]`}
                      style={{ width: `${Math.min(100, nextRank.progress)}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center">
                <div className="inline-block p-4 bg-cyan-50 rounded-full text-cyan-600 mb-4 animate-bounce">
                  <Gem size={32} />
                </div>
                <p className="font-black text-xl text-gray-800">
                  Sếp đã là Kim Cương!
                </p>
                <p className="text-sm text-gray-400 mt-2 italic">
                  Hưởng trọn mọi đặc quyền cao cấp nhất.
                </p>
              </div>
            )}
          </div>
        </div>

        <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2 px-2 uppercase tracking-tighter">
          Bảng đặc quyền thành viên{" "}
          <ChevronRight size={20} className="text-blue-500" />
        </h3>

        <div className="bg-white rounded-[2rem] shadow-2xl shadow-gray-200/50 overflow-hidden border border-gray-100">
          <div className="grid grid-cols-4 bg-gray-900 p-6 text-white text-center text-[10px] font-black uppercase tracking-[0.2em]">
            <div className="text-left text-gray-500">Dịch vụ</div>
            <div className="text-slate-400">Bạc</div>
            <div className="text-amber-400">Vàng</div>
            <div className="text-cyan-400">Kim cương</div>
          </div>

          {benefits.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-4 p-7 border-b border-gray-50 hover:bg-blue-50/20 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-white transition-colors shadow-sm">
                  {item.icon}
                </div>
                <span className="font-bold text-gray-700 text-sm">
                  {item.title}
                </span>
              </div>
              <div
                className={`flex items-center justify-center text-sm font-medium ${rank === "Bạc" ? "text-blue-600 font-bold scale-110" : "text-gray-400"}`}
              >
                {item.silver}
              </div>
              <div
                className={`flex items-center justify-center text-sm font-bold ${rank === "Vàng" ? "text-amber-600 scale-110" : "text-gray-400"}`}
              >
                {item.gold}
              </div>
              <div
                className={`flex items-center justify-center text-sm font-black ${rank === "Kim cương" ? "text-cyan-600 scale-110" : "text-gray-400"}`}
              >
                {item.diamond}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Privileges;
