import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Loader2, ShieldCheck, Phone, Mail, User, Building2 } from "lucide-react";
import { AdminContext } from "../context/AdminContext";
import imgBaoViet from "../assets/insurance/baovietlife.jpg";
import imgManulife from "../assets/insurance/manulife.jpeg";
import imgDaiIchi from "../assets/insurance/daichilife.png";
import imgPrudential from "../assets/insurance/prudential.png";

ChartJS.register(ArcElement, Tooltip, Legend);

const PARTNER_ORDER = [
  "Bảo Việt Life",
  "Manulife Vietnam",
  "Dai-ichi Life Việt Nam",
  "Prudential Vietnam",
];

const PARTNER_COLORS = ["#059669", "#16a34a", "#e11d48", "#2563eb"];

const LOGOS = [
  { name: "Bảo Việt Life", src: imgBaoViet },
  { name: "Manulife", src: imgManulife },
  { name: "Dai-ichi Life", src: imgDaiIchi },
  { name: "Prudential", src: imgPrudential },
];

const InsurancePartners = () => {
  const { aToken, backendUrl } = useContext(AdminContext);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!aToken) return;
      try {
        setLoading(true);
        const { data } = await axios.get(`${backendUrl}/api/insurance-leads/admin`, {
          headers: { token: aToken },
        });
        if (data.success) {
          setLeads(data.leads || []);
        } else {
          toast.error(data.message || "Không tải được dữ liệu");
        }
      } catch (e) {
        toast.error(e.response?.data?.message || "Lỗi kết nối máy chủ");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [aToken, backendUrl]);

  const pieData = useMemo(() => {
    const values = PARTNER_ORDER.map(
      (p) => leads.filter((l) => l.partner === p).length,
    );
    const knownSum = values.reduce((a, b) => a + b, 0);
    const other = leads.length - knownSum;
    const labels = [...PARTNER_ORDER];
    const data = [...values];
    const colors = [...PARTNER_COLORS];
    if (other > 0) {
      labels.push("Khác");
      data.push(other);
      colors.push("#94a3b8");
    }
    const total = leads.length;
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderColor: "#ffffff",
          borderWidth: 2,
        },
      ],
      total,
      rawValues: data,
    };
  }, [leads]);

  const pieOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { boxWidth: 10, font: { size: 11 } },
        },
        tooltip: {
          callbacks: {
            label(ctx) {
              const v = pieData.rawValues[ctx.dataIndex] ?? 0;
              return ` ${ctx.label}: ${v} yêu cầu`;
            },
          },
        },
      },
    }),
    [pieData],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            <ShieldCheck size={14} />
            Đối tác bảo hiểm
          </div>
          <h1 className="mt-2 text-2xl font-black text-gray-900 md:text-3xl">
            Yêu cầu tư vấn từ khách
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Dữ liệu gửi từ trang About (form tư vấn bảo hiểm).
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm">
          Tổng: <span className="text-blue-600">{leads.length}</span> yêu cầu
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
          Đối tác chiến lược
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {LOGOS.map((item) => (
            <div
              key={item.name}
              className="flex flex-col items-center rounded-xl border border-gray-100 bg-gray-50/80 p-4"
            >
              <div className="flex h-16 w-full max-w-[140px] items-center justify-center rounded-lg bg-white p-2 shadow-sm">
                <img
                  src={item.src}
                  alt={item.name}
                  className="max-h-10 w-auto max-w-full object-contain"
                />
              </div>
              <span className="mt-2 text-center text-[11px] font-semibold text-gray-600">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-gray-900">
            <User size={18} className="text-blue-600" />
            Danh sách thông tin người gửi
          </h2>
          {loading ? (
            <div className="flex justify-center py-16 text-blue-600">
              <Loader2 className="h-10 w-10 animate-spin" />
            </div>
          ) : leads.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">
              Chưa có yêu cầu tư vấn nào.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Họ tên</th>
                    <th className="px-4 py-3">SĐT</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Đối tác</th>
                    <th className="px-4 py-3">Đồng ý</th>
                    <th className="px-4 py-3">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leads.map((row, i) => (
                    <tr key={row._id} className="hover:bg-blue-50/30">
                      <td className="px-4 py-3 font-medium text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{row.fullName}</td>
                      <td className="px-4 py-3 text-gray-700">
                        <span className="inline-flex items-center gap-1">
                          <Phone size={12} className="text-gray-400" />
                          {row.phone}
                        </span>
                      </td>
                      <td className="max-w-[160px] truncate px-4 py-3 text-gray-600">
                        {row.email ? (
                          <span className="inline-flex items-center gap-1">
                            <Mail size={12} className="shrink-0 text-gray-400" />
                            {row.email}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-800">
                          <Building2 size={12} />
                          {row.partner}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.consentShareForInsuranceAdvice ? (
                          <span className="text-emerald-600">✓</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                        {row.createdAt
                          ? new Date(row.createdAt).toLocaleString("vi-VN")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-lg font-black text-gray-900">Phân bổ theo đối tác</h2>
          <p className="mb-4 text-xs text-gray-500">
            {pieData.total === 0
              ? "Khi có yêu cầu tư vấn, biểu đồ hiển thị tỷ lệ theo từng đối tác."
              : "Tỷ lệ yêu cầu tư vấn theo công ty bảo hiểm được chọn."}
          </p>
          {pieData.total === 0 ? (
            <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-sm font-medium text-gray-400">
              Chưa có dữ liệu để vẽ biểu đồ
            </div>
          ) : (
            <div className="relative mx-auto h-[260px] w-full max-w-[280px]">
              <Pie data={pieData} options={pieOptions} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InsurancePartners;
