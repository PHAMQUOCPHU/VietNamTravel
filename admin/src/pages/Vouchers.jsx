import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
  memo,
} from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  Ticket,
  Percent,
  Clock,
  AlertCircle,
  X,
  Download,
  Search,
  TrendingUp,
} from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { AdminContext } from "../context/AdminContext";

const formatVndInput = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("vi-VN");
};

const parseVndInput = (raw) => {
  const digits = String(raw || "").replace(/[^\d]/g, "");
  if (!digits) return 0;
  const n = Number(digits);
  return Number.isFinite(n) ? n : 0;
};

function resolveDisplayStatus(voucher) {
  let currentStatus = voucher.status || "active";
  if (currentStatus === "active") {
    if (new Date(voucher.expiryDate) < new Date()) currentStatus = "expired";
    else if (
      voucher.usageLimit &&
      voucher.usedCount >= voucher.usageLimit
    ) {
      currentStatus = "exhausted";
    }
  }
  if (!voucher.isActive) currentStatus = "disabled";

  let statusColor = "";
  let statusText = "";
  switch (currentStatus) {
    case "active":
      statusColor = "bg-emerald-50 text-emerald-600 border-emerald-200";
      statusText = "Hoạt động";
      break;
    case "exhausted":
      statusColor = "bg-gray-100 text-gray-500 border-gray-300";
      statusText = "Hết lượt";
      break;
    case "expired":
      statusColor = "bg-red-50 text-red-600 border-red-200";
      statusText = "Hết hạn";
      break;
    default:
      statusColor = "bg-red-50 text-red-600 border-red-200";
      statusText = "Đã tắt";
      break;
  }
  return { statusColor, statusText };
}

const VoucherAdminRow = memo(function VoucherAdminRow({
  voucher,
  onEdit,
  onDelete,
}) {
  const limit = Math.max(1, Number(voucher.usageLimit) || 1);
  const used = Number(voucher.usedCount) || 0;
  const pct = Math.min((used / limit) * 100, 100);
  const expired = new Date(voucher.expiryDate) < new Date();
  const { statusColor, statusText } = resolveDisplayStatus(voucher);

  return (
    <tr className="border-b border-gray-50 transition-colors hover:bg-gray-50/50">
      <td className="p-5">
        <span className="inline-block rounded-lg border border-blue-100 bg-blue-50 px-3 py-1 font-black tracking-wider text-blue-700">
          {voucher.code}
        </span>
      </td>
      <td className="p-5 font-bold text-orange-500">
        {voucher.discountValue.toLocaleString()}đ
      </td>
      <td className="p-5 font-semibold text-gray-600">
        {voucher.minOrderValue.toLocaleString()}đ
      </td>
      <td className="p-5">
        <div className="flex items-center gap-2">
          <div className="h-2 w-24 flex-1 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-blue-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-bold text-gray-500">
            {used}/{limit}
          </span>
        </div>
      </td>
      <td className="p-5">
        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
          <Clock
            size={14}
            className={expired ? "text-red-500" : "text-emerald-500"}
          />
          <span className={expired ? "text-red-500" : ""}>
            {new Date(voucher.expiryDate).toLocaleDateString("vi-VN")}
          </span>
        </div>
      </td>
      <td className="p-5">
        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${statusColor}`}
        >
          {statusText}
        </span>
      </td>
      <td className="p-5 text-right">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onEdit(voucher)}
            className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
          >
            <Edit2 size={18} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(voucher._id)}
            className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
});

const Vouchers = () => {
  const { aToken, backendUrl } = useContext(AdminContext);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [query, setQuery] = useState("");

  const [formData, setFormData] = useState({
    _id: null,
    code: "",
    discountValue: 0,
    minOrderValue: 0,
    usageLimit: 100,
    expiryDate: "",
    isActive: true,
  });

  const minOrderDisplay = useMemo(() => {
    return formatVndInput(formData.minOrderValue);
  }, [formData.minOrderValue]);

  const refreshVouchers = useCallback(async () => {
    if (!backendUrl || !aToken) return;
    try {
      const { data } = await axios.get(`${backendUrl}/api/vouchers/admin`, {
        headers: { aToken },
      });
      if (data.success) {
        setVouchers(data.vouchers);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  }, [backendUrl, aToken]);

  useEffect(() => {
    if (!aToken || !backendUrl) return undefined;
    setLoading(true);
    const ac = new AbortController();
    (async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/vouchers/admin`, {
          headers: { aToken },
          signal: ac.signal,
        });
        if (!ac.signal.aborted && data.success) {
          setVouchers(data.vouchers);
        } else if (!ac.signal.aborted && !data.success) {
          toast.error(data.message);
        }
      } catch (error) {
        if (
          error.code === "ERR_CANCELED" ||
          error.name === "CanceledError"
        ) {
          return;
        }
        toast.error(error.message);
      } finally {
        if (!ac.signal.aborted) {
          setLoading(false);
        }
      }
    })();
    return () => ac.abort();
  }, [aToken, backendUrl]);

  const openModal = useCallback((voucher = null) => {
    if (voucher) {
      setFormData({
        _id: voucher._id,
        code: voucher.code,
        discountValue: voucher.discountValue,
        minOrderValue: voucher.minOrderValue,
        usageLimit: voucher.usageLimit,
        expiryDate: new Date(voucher.expiryDate).toISOString().slice(0, 10),
        isActive: voucher.isActive,
      });
    } else {
      setFormData({
        _id: null,
        code: "",
        discountValue: 0,
        minOrderValue: 0,
        usageLimit: 100,
        expiryDate: "",
        isActive: true,
      });
    }
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "number") {
      const n = value === "" ? "" : Number(value);
      setFormData((prev) => ({ ...prev, [name]: n === "" ? "" : n }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const normalizePayload = () => ({
    code: String(formData.code || "").trim().toUpperCase(),
    discountValue: Number(formData.discountValue),
    minOrderValue:
      formData.minOrderValue === "" ? 0 : Number(formData.minOrderValue),
    usageLimit: Number(formData.usageLimit),
    expiryDate: formData.expiryDate,
    isActive: Boolean(formData.isActive),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = normalizePayload();
    if (!Number.isFinite(body.discountValue) || body.discountValue < 0) {
      toast.error("Giá trị giảm không hợp lệ");
      return;
    }
    if (!Number.isFinite(body.usageLimit) || body.usageLimit < 1) {
      toast.error("Giới hạn sử dụng phải ≥ 1");
      return;
    }
    setIsSubmitting(true);

    try {
      if (formData._id) {
        const { data } = await axios.put(
          `${backendUrl}/api/vouchers/admin/${formData._id}`,
          body,
          { headers: { aToken } },
        );
        if (data.success) {
          toast.success(data.message);
          await refreshVouchers();
          closeModal();
        } else {
          toast.error(data.message);
        }
      } else {
        const { data } = await axios.post(
          `${backendUrl}/api/vouchers/admin`,
          body,
          { headers: { aToken } },
        );
        if (data.success) {
          toast.success(data.message);
          await refreshVouchers();
          closeModal();
        } else {
          toast.error(data.message);
        }
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = useCallback(
    async (id) => {
      if (!window.confirm("Bạn có chắc chắn muốn xóa Voucher này?")) return;
      try {
        const { data } = await axios.delete(
          `${backendUrl}/api/vouchers/admin/${id}`,
          { headers: { aToken } },
        );
        if (data.success) {
          toast.success(data.message);
          refreshVouchers();
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error(error.message);
      }
    },
    [backendUrl, aToken, refreshVouchers],
  );

  const filteredVouchers = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return vouchers;
    return vouchers.filter((v) => {
      const code = String(v?.code || "").toLowerCase();
      return code.includes(q);
    });
  }, [vouchers, query]);

  const stats = useMemo(() => {
    const total = vouchers.length;
    let active = 0;
    let exhausted = 0;
    let expired = 0;
    vouchers.forEach((v) => {
      const s = resolveDisplayStatus(v)?.statusText;
      if (s === "Hoạt động") active += 1;
      else if (s === "Hết lượt") exhausted += 1;
      else if (s === "Hết hạn") expired += 1;
    });
    return { total, active, exhausted, expired };
  }, [vouchers]);

  const exportCsv = useCallback(() => {
    const rows = [
      [
        "code",
        "discountValue",
        "minOrderValue",
        "usageLimit",
        "usedCount",
        "expiryDate",
        "status",
        "isActive",
      ],
      ...filteredVouchers.map((v) => [
        String(v?.code ?? ""),
        String(v?.discountValue ?? ""),
        String(v?.minOrderValue ?? ""),
        String(v?.usageLimit ?? ""),
        String(v?.usedCount ?? ""),
        v?.expiryDate ? new Date(v.expiryDate).toISOString() : "",
        String(v?.status ?? ""),
        String(Boolean(v?.isActive)),
      ]),
    ];

    const csv = rows
      .map((cols) =>
        cols
          .map((c) => {
            const s = String(c ?? "");
            if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
            return s;
          })
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vouchers-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [filteredVouchers]);

  const modalTitle = formData._id ? "Cập nhật Voucher" : "Thêm Voucher";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl space-y-6"
    >
      <div className="overflow-hidden bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 px-8 py-7 shadow-xl shadow-blue-100/60">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Quản lý Voucher
            </h1>
            <p className="mt-1 text-sm font-semibold text-blue-100/90">
              Quản lý tất cả voucher khuyến mãi
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center bg-white/15 ring-1 ring-white/20">
            <Ticket className="text-white" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-gray-600">Tổng Voucher</p>
              <p className="mt-2 text-3xl font-extrabold text-gray-900">
                {stats.total}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center bg-blue-50 text-blue-700 ring-1 ring-blue-100">
              <Ticket size={18} />
            </div>
          </div>
        </div>
        <div className="border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-gray-600">Đang Hoạt Động</p>
              <p className="mt-2 text-3xl font-extrabold text-emerald-600">
                {stats.active}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <TrendingUp size={18} />
            </div>
          </div>
        </div>
        <div className="border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-gray-600">Đã Sử Dụng</p>
              <p className="mt-2 text-3xl font-extrabold text-orange-500">
                {stats.exhausted}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center bg-orange-50 text-orange-700 ring-1 ring-orange-100">
              <Percent size={18} />
            </div>
          </div>
        </div>
        <div className="border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-gray-600">Hết Hạn</p>
              <p className="mt-2 text-3xl font-extrabold text-red-600">
                {stats.expired}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center bg-red-50 text-red-700 ring-1 ring-red-100">
              <AlertCircle size={18} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 bg-blue-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 active:scale-[0.98]"
          >
            <Plus size={18} /> Thêm Voucher
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 bg-emerald-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-700 active:scale-[0.98]"
          >
            <Download size={18} /> Xuất CSV
          </button>
        </div>

        <div className="relative w-full sm:w-[360px]">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm voucher..."
            className="w-full border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="overflow-hidden border border-gray-100 bg-white shadow-xl shadow-gray-100/50">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="p-5 text-xs font-bold uppercase tracking-wider text-gray-400">
                  Mã Voucher
                </th>
                <th className="p-5 text-xs font-bold uppercase tracking-wider text-gray-400">
                  Giá trị giảm
                </th>
                <th className="p-5 text-xs font-bold uppercase tracking-wider text-gray-400">
                  Đơn tối thiểu
                </th>
                <th className="p-5 text-xs font-bold uppercase tracking-wider text-gray-400">
                  Đã dùng / Tổng
                </th>
                <th className="p-5 text-xs font-bold uppercase tracking-wider text-gray-400">
                  Hạn dùng
                </th>
                <th className="p-5 text-xs font-bold uppercase tracking-wider text-gray-400">
                  Trạng thái
                </th>
                <th className="p-5 text-right text-xs font-bold uppercase tracking-wider text-gray-400">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center font-medium text-gray-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center font-medium text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle size={32} className="text-gray-300" />
                      Không có voucher phù hợp
                    </div>
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((voucher) => (
                  <VoucherAdminRow
                    key={String(voucher._id)}
                    voucher={voucher}
                    onEdit={openModal}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl overflow-hidden bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-8 py-6">
              <h2 className="text-xl font-extrabold text-gray-900">
                {modalTitle}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 text-gray-400 transition-colors hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 p-8">
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-gray-500">
                  Mã Voucher *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="VCH2024001"
                  className="w-full border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-gray-500">
                    Giảm (VNĐ) *
                  </label>
                  <input
                    type="number"
                    name="discountValue"
                    min={0}
                    value={formData.discountValue}
                    onChange={handleChange}
                    placeholder="150000"
                    className="w-full border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-gray-500">
                    Lượt sử dụng tối đa *
                  </label>
                  <input
                    type="number"
                    name="usageLimit"
                    min={1}
                    value={formData.usageLimit}
                    onChange={handleChange}
                    placeholder="100"
                    className="w-full border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-gray-500">
                    Ngày hết hạn *
                  </label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    className="w-full border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-gray-500">
                    Trạng thái *
                  </label>
                  <select
                    name="isActive"
                    value={formData.isActive ? "active" : "disabled"}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isActive: e.target.value === "active",
                      }))
                    }
                    className="w-full border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Hoạt động</option>
                    <option value="disabled">Tạm tắt</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-extrabold text-gray-500">
                  Đơn tối thiểu (VNĐ) *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  name="minOrderValue"
                  value={minOrderDisplay}
                  onChange={(e) => {
                    const next = parseVndInput(e.target.value);
                    setFormData((prev) => ({ ...prev, minOrderValue: next }));
                  }}
                  placeholder="2.000.000"
                  className="w-full border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-32 border border-gray-200 bg-white px-6 py-3 text-sm font-extrabold text-gray-700 transition hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-32 bg-blue-600 px-8 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-100 transition active:scale-[0.98] hover:bg-blue-700 disabled:opacity-70"
                >
                  {isSubmitting
                    ? "Đang xử lý..."
                    : formData._id
                      ? "Lưu"
                      : "Thêm"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Vouchers;
