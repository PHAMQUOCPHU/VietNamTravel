import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AdminContext } from "../context/AdminContext";
import StatCard from "../components/StatCard";
import {
  Users,
  Map,
  DollarSign,
  TrendingUp,
  Wallet,
  Landmark,
  CreditCard,
} from "lucide-react";
import { Line, Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const Dashboard = () => {
  const { aToken, backendUrl } = useContext(AdminContext);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTours: 0,
    totalRevenue: 0,
    monthlyLabels: [],
    monthlyData: [0, 0, 0, 0, 0, 0],
    weeklyLabels: [],
    weeklyData: [0, 0, 0, 0, 0, 0, 0],
    paymentBreakdown: { cash: 0, online: 0 },
    regionBreakdown: { bac: 0, trung: 0, nam: 0 },
    rangeRevenue: 0,
    rangeBookingCount: 0,
  });

  useEffect(() => {
    const controller = new AbortController();
    const fetchStats = async () => {
      if (!aToken) return;
      try {
        const res = await axios.get(`${backendUrl}/api/bookings/stats`, {
          params: {
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          },
          headers: { atoken: aToken },
          signal: controller.signal,
        });
        if (res.data.success) {
          setStats(res.data.stats);
        }
      } catch (error) {
        if (axios.isCancel(error)) return;
        console.error("Dashboard Error:", error);
      }
    };
    fetchStats();
    return () => controller.abort();
  }, [aToken, backendUrl, startDate, endDate]);

  const monthlyRevenueData = {
    labels: stats.monthlyLabels?.length
      ? stats.monthlyLabels
      : ["Thang 1", "Thang 2", "Thang 3", "Thang 4", "Thang 5", "Thang 6"],
    datasets: [
      {
        label: "Doanh thu (VNĐ)",
        data: stats.monthlyData || [0, 0, 0, 0, 0, 0],
        fill: true,
        backgroundColor: "rgba(59, 130, 246, 0.15)",
        borderColor: "#3b82f6",
        borderWidth: 3,
        tension: 0.4,
      },
    ],
  };

  const weeklyRevenueData = {
    labels: stats.weeklyLabels?.length ? stats.weeklyLabels : [],
    datasets: [
      {
        label: "Doanh thu theo tuan (VNĐ)",
        data: stats.weeklyData || [],
        borderRadius: 10,
        backgroundColor: "rgba(16, 185, 129, 0.75)",
      },
    ],
  };

  const paymentPieData = {
    labels: ["Tien mat", "Thanh toan online"],
    datasets: [
      {
        data: [
          stats.paymentBreakdown?.cash || 0,
          stats.paymentBreakdown?.online || 0,
        ],
        backgroundColor: ["#f59e0b", "#3b82f6"],
        borderColor: ["#ffffff", "#ffffff"],
        borderWidth: 2,
      },
    ],
  };

  const regionPieData = {
    labels: ["Mien Bac", "Mien Trung", "Mien Nam"],
    datasets: [
      {
        data: [
          stats.regionBreakdown?.bac || 0,
          stats.regionBreakdown?.trung || 0,
          stats.regionBreakdown?.nam || 0,
        ],
        backgroundColor: ["#2563eb", "#14b8a6", "#f97316"],
        borderColor: ["#ffffff", "#ffffff", "#ffffff"],
        borderWidth: 2,
      },
    ],
  };

  const totalPaymentCount =
    (stats.paymentBreakdown?.cash || 0) + (stats.paymentBreakdown?.online || 0);
  const onlinePaymentPercent = totalPaymentCount
    ? Math.round(
        ((stats.paymentBreakdown?.online || 0) / totalPaymentCount) * 100,
      )
    : 0;

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1d4ed8] via-[#2563eb] to-[#3b82f6] p-6 md:p-8 text-white shadow-xl">
        <div className="pointer-events-none absolute -top-14 -right-10 h-44 w-44 rounded-full bg-white/15 blur-2xl"></div>
        <div className="pointer-events-none absolute -bottom-16 left-16 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
        <h2 className="text-2xl md:text-3xl font-black">
          Tong quan kinh doanh
        </h2>
        <p className="text-blue-100 mt-2 font-medium">
          Theo dõi doanh thu, hành vi thanh toán và xu hướng đặt tour theo khu
          vực.
        </p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-[1fr,1fr,auto] gap-3">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-xl bg-white/95 text-slate-700 px-4 py-2.5 font-semibold outline-none"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-xl bg-white/95 text-slate-700 px-4 py-2.5 font-semibold outline-none"
          />
          <button
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            className="rounded-xl border border-white/30 px-4 py-2.5 font-bold hover:bg-white/10"
          >
            Xoá
          </button>
        </div>

        {(startDate || endDate) && (
          <div className="mt-4 rounded-2xl bg-white/10 border border-white/20 px-4 py-3">
            <p className="text-sm font-bold">
              Doanh thu trong khoang chon: {stats.rangeRevenue.toLocaleString()}
              đ
            </p>
            <p className="text-xs text-blue-100 mt-1">
              Tong don da thanh toan: {stats.rangeBookingCount}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng người dùng"
          value={stats.totalUsers.toLocaleString()}
          icon={<Users size={20} />}
          color="bg-blue-500"
        />
        <StatCard
          title="Tour đang hoạt động"
          value={stats.totalTours.toLocaleString()}
          icon={<Map size={20} />}
          color="bg-emerald-500"
        />
        <StatCard
          title="Tổng doanh thu"
          value={`${stats.totalRevenue.toLocaleString()}đ`}
          icon={<DollarSign size={20} />}
          color="bg-orange-500"
        />
        <StatCard
          title="% thanh toán online"
          value={`${onlinePaymentPercent}%`}
          icon={<TrendingUp size={20} />}
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100">
          <h3 className="font-black text-gray-800 text-lg mb-1 flex items-center gap-2">
            <Wallet size={18} className="text-blue-600" />
            Doanh thu 6 tháng gần nhất
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Biểu đồ đường tổng quan doanh thu theo tháng.
          </p>
          <div className="h-64 md:h-72 w-full">
            <Line
              data={monthlyRevenueData}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
          </div>

        <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100">
          <h3 className="font-black text-gray-800 text-lg mb-1 flex items-center gap-2">
            <Landmark size={18} className="text-emerald-600" />
            Doanh thu 7 ngày gần nhất
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Biểu đồ cột doanh thu theo từng ngày trong tuần.
          </p>
          <div className="h-64 md:h-72 w-full">
            <Bar
              data={weeklyRevenueData}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
          </div>

        <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100">
          <h3 className="font-black text-gray-800 text-lg mb-1 flex items-center gap-2">
            <CreditCard size={18} className="text-orange-500" />
            Tiền mặt vs Online
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Tỉ lệ phương thức thanh toán của các đơn đã thanh toán.
          </p>
          <div className="h-64 md:h-72 w-full flex items-center justify-center">
            <Pie
              data={paymentPieData}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
          </div>

        <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100">
          <h3 className="font-black text-gray-800 text-lg mb-1 flex items-center gap-2">
            <Map size={18} className="text-indigo-500" />
            Tour được đặt nhiều nhất theo miền
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Tỷ trọng đặt tour theo 3 miền Bắc - Trung - Nam.
          </p>
          <div className="h-64 md:h-72 w-full flex items-center justify-center">
            <Pie
              data={regionPieData}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
          </div>
      </div>
  );
};

export default Dashboard;
