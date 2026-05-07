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

  const FALLBACK_MONTHS = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
  ];
  const FALLBACK_WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  const monthlyLabels =
    stats.monthlyLabels?.length > 0 ? stats.monthlyLabels : FALLBACK_MONTHS;
  const monthlyDataAligned = monthlyLabels.map(
    (_, i) => Number(stats.monthlyData?.[i]) || 0,
  );

  const weeklyLabels =
    stats.weeklyLabels?.length > 0 ? stats.weeklyLabels : FALLBACK_WEEKDAYS;
  const weeklyDataAligned = weeklyLabels.map(
    (_, i) => Number(stats.weeklyData?.[i]) || 0,
  );

  const monthlyRevenueData = {
    labels: monthlyLabels,
    datasets: [
      {
        label: "Doanh thu (VNĐ)",
        data: monthlyDataAligned,
        fill: true,
        backgroundColor: "rgba(59, 130, 246, 0.15)",
        borderColor: "#3b82f6",
        borderWidth: 3,
        tension: 0.4,
      },
    ],
  };

  const weeklyRevenueData = {
    labels: weeklyLabels,
    datasets: [
      {
        label: "Doanh thu theo tuần (VNĐ)",
        data: weeklyDataAligned,
        borderRadius: 10,
        backgroundColor: "rgba(16, 185, 129, 0.75)",
      },
    ],
  };

  const paymentCash = Number(stats.paymentBreakdown?.cash) || 0;
  const paymentOnline = Number(stats.paymentBreakdown?.online) || 0;
  const paymentPieHasData = paymentCash + paymentOnline > 0;

  const paymentPieData = {
    labels: ["Tiền mặt", "Thanh toán online"],
    datasets: [
      {
        data: [paymentCash, paymentOnline],
        backgroundColor: ["#f59e0b", "#3b82f6"],
        borderColor: ["#ffffff", "#ffffff"],
        borderWidth: 2,
      },
    ],
  };

  const regionBac = Number(stats.regionBreakdown?.bac) || 0;
  const regionTrung = Number(stats.regionBreakdown?.trung) || 0;
  const regionNam = Number(stats.regionBreakdown?.nam) || 0;
  const regionPieHasData = regionBac + regionTrung + regionNam > 0;

  const regionPieData = {
    labels: ["Miền Bắc", "Miền Trung", "Miền Nam"],
    datasets: [
      {
        data: [regionBac, regionTrung, regionNam],
        backgroundColor: ["#2563eb", "#14b8a6", "#f97316"],
        borderColor: ["#ffffff", "#ffffff", "#ffffff"],
        borderWidth: 2,
      },
    ],
  };

  const totalPaymentCount = paymentCash + paymentOnline;
  const onlinePaymentPercent = totalPaymentCount
    ? Math.round(
        ((stats.paymentBreakdown?.online || 0) / totalPaymentCount) * 100,
      )
    : 0;

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-none bg-gradient-to-r from-[#1d4ed8] via-[#2563eb] to-[#3b82f6] p-6 md:p-8 text-white shadow-xl">
        <div className="pointer-events-none absolute -top-14 -right-10 h-44 w-44 rounded-full bg-white/15 blur-2xl"></div>
        <div className="pointer-events-none absolute -bottom-16 left-16 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
        <h2 className="text-2xl md:text-3xl font-black">
          Tổng quan kinh doanh
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
            Xóa
          </button>
        </div>

        {(startDate || endDate) && (
          <div className="mt-4 rounded-2xl bg-white/10 border border-white/20 px-4 py-3">
            <p className="text-sm font-bold">
              Doanh thu trong khoảng chọn: {stats.rangeRevenue.toLocaleString()}
              đ
            </p>
            <p className="text-xs text-blue-100 mt-1">
              Tổng đơn đã thanh toán: {stats.rangeBookingCount}
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
            {paymentPieHasData ? (
              <Pie
                data={paymentPieData}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            ) : (
              <p className="text-sm font-medium text-slate-400">
                Chưa có dữ liệu thanh toán trong khoảng thống kê.
              </p>
            )}
          </div>
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
            {regionPieHasData ? (
              <Pie
                data={regionPieData}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            ) : (
              <p className="text-sm font-medium text-slate-400">
                Chưa có dữ liệu đặt tour theo miền.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
