import React, { useState, useEffect, useContext } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, Ticket, Percent, Clock, AlertCircle, X } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { AdminContext } from "../context/AdminContext";

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
    isActive: true
  });

  const fetchVouchers = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/vouchers/admin`, {
        headers: { aToken }
      });
      if (data.success) {
        setVouchers(data.vouchers);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (aToken) {
      fetchVouchers();
    }
  }, [aToken]);

  const openModal = (voucher = null) => {
    if (voucher) {
      setFormData({
        _id: voucher._id,
        code: voucher.code,
        discountValue: voucher.discountValue,
        minOrderValue: voucher.minOrderValue,
        usageLimit: voucher.usageLimit,
        expiryDate: new Date(voucher.expiryDate).toISOString().slice(0, 10),
        isActive: voucher.isActive
      });
    } else {
      setFormData({
        _id: null,
        code: "",
        discountValue: "",
        minOrderValue: "",
        usageLimit: 100,
        expiryDate: "",
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (formData._id) {
        // Cập nhật
        const { data } = await axios.put(`${backendUrl}/api/vouchers/admin/${formData._id}`, formData, {
          headers: { aToken }
        });
        if (data.success) {
          toast.success(data.message);
          fetchVouchers();
          closeModal();
        } else {
          toast.error(data.message);
        }
      } else {
        // Tạo mới
        const { data } = await axios.post(`${backendUrl}/api/vouchers/admin`, formData, {
          headers: { aToken }
        });
        if (data.success) {
          toast.success(data.message);
          fetchVouchers();
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

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa Voucher này?")) {
      try {
        const { data } = await axios.delete(`${backendUrl}/api/vouchers/admin/${id}`, {
          headers: { aToken }
        });
        if (data.success) {
          toast.success(data.message);
          fetchVouchers();
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl space-y-6"
    >
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Ticket className="text-blue-600" /> Quản lý Voucher
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Quản lý các mã giảm giá và ưu đãi cho khách hàng
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200"
        >
          <Plus size={20} /> Thêm Voucher mới
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Mã Voucher</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Giá trị giảm</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Đơn tối thiểu</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Đã dùng / Tổng</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Hạn dùng</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Trạng thái</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500 font-medium">Đang tải dữ liệu...</td>
                </tr>
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500 font-medium">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle size={32} className="text-gray-300" />
                      Chưa có mã giảm giá nào
                    </div>
                  </td>
                </tr>
              ) : (
                vouchers.map((voucher) => (
                  <tr key={voucher._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="p-5">
                      <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 font-black rounded-lg border border-blue-100 tracking-wider">
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
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden w-24">
                          <div 
                            className="h-full bg-blue-500" 
                            style={{ width: `${Math.min((voucher.usedCount / voucher.usageLimit) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-gray-500">
                          {voucher.usedCount}/{voucher.usageLimit}
                        </span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
                        <Clock size={14} className={new Date(voucher.expiryDate) < new Date() ? "text-red-500" : "text-emerald-500"} />
                        <span className={new Date(voucher.expiryDate) < new Date() ? "text-red-500" : ""}>
                          {new Date(voucher.expiryDate).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    </td>
                    <td className="p-5">
                      {(() => {
                        let statusColor = "";
                        let statusText = "";
                        
                        let currentStatus = voucher.status || "active";
                        if (currentStatus === "active") {
                          if (new Date(voucher.expiryDate) < new Date()) currentStatus = "expired";
                          else if (voucher.usedCount >= voucher.usageLimit) currentStatus = "exhausted";
                        }
                        if (!voucher.isActive) currentStatus = "disabled";

                        switch(currentStatus) {
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
                          case "disabled":
                          default:
                            statusColor = "bg-red-50 text-red-600 border-red-200";
                            statusText = "Đã tắt";
                            break;
                        }

                        return (
                          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border ${statusColor}`}>
                            {statusText}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openModal(voucher)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(voucher._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm/Sửa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
          >
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Ticket className="text-blue-600" /> 
                {formData._id ? "Cập nhật Voucher" : "Thêm Voucher mới"}
              </h2>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Mã Voucher</label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="Ví dụ: VNTRAVEL2026"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-800 uppercase"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Giá trị giảm (VNĐ)</label>
                  <div className="relative">
                    <input
                      type="number"
                      name="discountValue"
                      value={formData.discountValue}
                      onChange={handleChange}
                      placeholder="500000"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-orange-500"
                      required
                    />
                    <Percent className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Đơn tối thiểu (VNĐ)</label>
                  <input
                    type="number"
                    name="minOrderValue"
                    value={formData.minOrderValue}
                    onChange={handleChange}
                    placeholder="2000000"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-700"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Giới hạn sử dụng</label>
                  <input
                    type="number"
                    name="usageLimit"
                    value={formData.usageLimit}
                    onChange={handleChange}
                    placeholder="100"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-700"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Ngày hết hạn</label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-700"
                    required
                  />
                </div>
                <div className="space-y-2 flex flex-col justify-center pt-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleChange}
                        className="sr-only" 
                      />
                      <div className={`block w-14 h-8 rounded-full transition-colors ${formData.isActive ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                      <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${formData.isActive ? 'translate-x-6' : ''}`}></div>
                    </div>
                    <span className="font-bold text-gray-700">Kích hoạt</span>
                  </label>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-70"
                >
                  {isSubmitting ? "Đang xử lý..." : formData._id ? "Cập nhật" : "Tạo Voucher"}
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
