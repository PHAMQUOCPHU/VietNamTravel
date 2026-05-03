import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
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
} from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { AdminContext } from "../context/AdminContext";

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

  const [formData, setFormData] = useState({
    _id: null,
    code: "",
    discountValue: 0,
    minOrderValue: 0,
    usageLimit: 100,
    expiryDate: "",
    isActive: true,
  });

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl space-y-6"
    >
      <div className="flex items-center justify-between rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
            <Ticket className="text-blue-600" /> Quản lý Voucher
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Quản lý các mã giảm giá và ưu đãi cho khách hàng
          </p>
        </div>
        <button
          type="button"
          onClick={() => openModal()}
          className="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95"
        >
          <Plus size={20} /> Thêm Voucher mới
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl shadow-gray-100/50">
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
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center font-medium text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle size={32} className="text-gray-300" />
                      Chưa có mã giảm giá nào
                    </div>
                  </td>
                </tr>
              ) : (
                vouchers.map((voucher) => (
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
            className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-8 py-6">
              <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800">
                <Ticket className="text-blue-600" />
                {formData._id ? "Cập nhật Voucher" : "Thêm Voucher mới"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Mã Voucher
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="Ví dụ: VNTRAVEL2026"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-bold uppercase text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Giá trị giảm (VNĐ)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="discountValue"
                      min={0}
                      value={formData.discountValue}
                      onChange={handleChange}
                      placeholder="500000"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-bold text-orange-500 outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <Percent
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Đơn tối thiểu (VNĐ)
                  </label>
                  <input
                    type="number"
                    name="minOrderValue"
                    min={0}
                    value={formData.minOrderValue}
                    onChange={handleChange}
                    placeholder="2000000"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Giới hạn sử dụng
                  </label>
                  <input
                    type="number"
                    name="usageLimit"
                    min={1}
                    value={formData.usageLimit}
                    onChange={handleChange}
                    placeholder="100"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Ngày hết hạn
                  </label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex flex-col justify-center space-y-2 pt-6">
                  <label className="flex cursor-pointer items-center gap-3">
                    <div className="relative">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div
                        className={`block h-8 w-14 rounded-full transition-colors ${formData.isActive ? "bg-blue-500" : "bg-gray-300"}`}
                      />
                      <div
                        className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition-transform ${formData.isActive ? "translate-x-6" : ""}`}
                      />
                    </div>
                    <span className="font-bold text-gray-700">Kích hoạt</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl bg-gray-100 px-6 py-3 font-bold text-gray-600 transition-colors hover:bg-gray-200"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-blue-600 px-8 py-3 font-bold text-white shadow-lg shadow-blue-200 transition-all active:scale-95 hover:bg-blue-700 disabled:opacity-70"
                >
                  {isSubmitting
                    ? "Đang xử lý..."
                    : formData._id
                      ? "Cập nhật"
                      : "Tạo Voucher"}
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
