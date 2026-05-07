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

const toLocalDateInputValue = (d) => {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const endOfDay = (d) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

const startOfWeekMonday = (d) => {
  const x = startOfDay(d);
  const day = x.getDay(); // 0=Sun ... 6=Sat
  const diff = (day + 6) % 7; // Mon=0 ... Sun=6
  x.setDate(x.getDate() - diff);
  return x;
};

const startOfMonth = (d) => {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
};

const addMonths = (d, months) => {
  const x = new Date(d);
  x.setMonth(x.getMonth() + months);
  return x;
};

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
  const [partnerFilter, setPartnerFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [quickRange, setQuickRange] = useState(null); // thisWeek | thisMonth | lastMonth | custom | null

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

  const partnerOptions = useMemo(() => {
    const set = new Set();
    (leads || []).forEach((l) => {
      const p = typeof l?.partner === "string" ? l.partner.trim() : "";
      if (p) set.add(p);
    });
    const base = Array.from(set);
    base.sort((a, b) => a.localeCompare(b, "vi"));
    return ["all", ...base];
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const from = dateFrom ? startOfDay(new Date(dateFrom)) : null;
    const to = dateTo ? endOfDay(new Date(dateTo)) : null;
    const hasFrom = from && !Number.isNaN(from.getTime());
    const hasTo = to && !Number.isNaN(to.getTime());

    return (leads || []).filter((l) => {
      if (partnerFilter !== "all" && l?.partner !== partnerFilter) return false;
      if (!hasFrom && !hasTo) return true;
      const t = l?.createdAt ? new Date(l.createdAt) : null;
      if (!t || Number.isNaN(t.getTime())) return false;
      if (hasFrom && t < from) return false;
      if (hasTo && t > to) return false;
      return true;
    });
  }, [leads, partnerFilter, dateFrom, dateTo]);

  const applyQuickRange = (mode) => {
    const now = new Date();
    if (mode === "thisWeek") {
      setQuickRange("thisWeek");
      setDateFrom(toLocalDateInputValue(startOfWeekMonday(now)));
      setDateTo(toLocalDateInputValue(now));
      return;
    }
    if (mode === "thisMonth") {
      setQuickRange("thisMonth");
      setDateFrom(toLocalDateInputValue(startOfMonth(now)));
      setDateTo(toLocalDateInputValue(now));
      return;
    }
    if (mode === "lastMonth") {
      setQuickRange("lastMonth");
      const startThis = startOfMonth(now);
      const startLast = startOfMonth(addMonths(startThis, -1));
      const endLast = endOfDay(new Date(startThis.getTime() - 1));
      setDateFrom(toLocalDateInputValue(startLast));
      setDateTo(toLocalDateInputValue(endLast));
    }
  };

  const clearFilters = () => {
    setPartnerFilter("all");
    setDateFrom("");
    setDateTo("");
    setQuickRange(null);
  };

  const exportCsv = () => {
    const rows = Array.isArray(filteredLeads) ? filteredLeads : [];
    if (!rows.length) {
      toast.info("Không có dữ liệu để xuất CSV (theo bộ lọc hiện tại).");
      return;
    }

    const escapeCell = (value) => {
      const raw = value == null ? "" : String(value);
      const needsQuote =
        raw.includes(",") || raw.includes("\n") || raw.includes("\r") || raw.includes('"');
      const safe = raw.replace(/"/g, '""');
      return needsQuote ? `"${safe}"` : safe;
    };

    const headers = [
      "Họ tên",
      "Số điện thoại",
      "Email",
      "Đối tác quan tâm",
      "Thời gian gửi",
      "Trạng thái đồng ý",
    ];

    const lines = [headers.map(escapeCell).join(",")];
    rows.forEach((l) => {
      const created = l?.createdAt ? new Date(l.createdAt) : null;
      const timeText =
        created && !Number.isNaN(created.getTime())
          ? created.toLocaleString("vi-VN")
          : "";
      lines.push(
        [
          l?.fullName || "",
          l?.phone || "",
          l?.email || "",
          l?.partner || "",
          timeText,
          l?.consentShareForInsuranceAdvice ? "Đồng ý" : "Không",
        ]
          .map(escapeCell)
          .join(","),
      );
    });

    const bom = "\uFEFF"; // Excel-friendly UTF-8
    const csv = bom + lines.join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate(),
    ).padStart(2, "0")}`;
    const namePart =
      partnerFilter === "all" ? "tat-ca-doi-tac" : String(partnerFilter).toLowerCase().replace(/\s+/g, "-");
    const rangePart =
      dateFrom || dateTo ? `_${dateFrom || "na"}_${dateTo || "na"}` : "";
    const filename = `insurance-leads_${namePart}${rangePart}_${stamp}.csv`;

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const pieData = useMemo(() => {
    const values = PARTNER_ORDER.map(
      (p) => filteredLeads.filter((l) => l.partner === p).length,
    );
    const knownSum = values.reduce((a, b) => a + b, 0);
    const other = filteredLeads.length - knownSum;
    const labels = [...PARTNER_ORDER];
    const data = [...values];
    const colors = [...PARTNER_COLORS];
    if (other > 0) {
      labels.push("Khác");
      data.push(other);
      colors.push("#94a3b8");
    }
    const total = filteredLeads.length;
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
  }, [filteredLeads]);

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
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={exportCsv}
            disabled={loading || filteredLeads.length === 0}
            className="inline-flex items-center gap-2 rounded-none bg-emerald-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            title="Xuất danh sách theo bộ lọc"
          >
            Xuất CSV
          </button>
          <div className="rounded-none border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm">
            Tổng: <span className="text-blue-600">{filteredLeads.length}</span> yêu cầu
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Bộ lọc
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-700">
              Lọc theo thời gian và đối tác để xem đúng nhóm khách.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => applyQuickRange("thisWeek")}
              className={`rounded-none border px-3 py-2 text-xs font-extrabold transition ${
                quickRange === "thisWeek"
                  ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-100"
                  : "border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
            >
              Tuần này
            </button>
            <button
              type="button"
              onClick={() => applyQuickRange("thisMonth")}
              className={`rounded-none border px-3 py-2 text-xs font-extrabold transition ${
                quickRange === "thisMonth"
                  ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-100"
                  : "border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
            >
              Tháng này
            </button>
            <button
              type="button"
              onClick={() => applyQuickRange("lastMonth")}
              className={`rounded-none border px-3 py-2 text-xs font-extrabold transition ${
                quickRange === "lastMonth"
                  ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-100"
                  : "border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
            >
              Tháng trước
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-none border border-gray-200 bg-white px-3 py-2 text-xs font-extrabold text-gray-700 hover:bg-gray-50"
              title="Xóa bộ lọc"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-4">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Đối tác
            </label>
            <select
              value={partnerFilter}
              onChange={(e) => setPartnerFilter(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
            >
              {partnerOptions.map((p) => (
                <option key={p} value={p}>
                  {p === "all" ? "Tất cả đối tác" : p}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-4">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Từ ngày
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setQuickRange("custom");
              }}
              className="mt-1 w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-4">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Đến ngày
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setQuickRange("custom");
              }}
              className="mt-1 w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
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
          ) : filteredLeads.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">
              Không có dữ liệu phù hợp bộ lọc.
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
                  {filteredLeads.map((row, i) => (
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
