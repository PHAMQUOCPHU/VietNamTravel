import React, { useState, useContext, useEffect } from "react";
import { X, Upload, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";
import { submitJobApplication } from "../services";

const JobApplicationModal = ({ isOpen, job, onClose, onSuccess }) => {
  const { backendUrl } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });
  const [cvFile, setCvFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (!isOpen || !job?._id) return;
    setSubmitted(false);
    setCvFile(null);
    setFormData({ fullName: "", email: "", phone: "" });
  }, [isOpen, job?._id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDragActive = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File phải nhỏ hơn 5MB");
      return;
    }

    // Check file type
    if (file.type !== "application/pdf") {
      toast.error("Chỉ chấp nhận file PDF");
      return;
    }

    setCvFile(file);
    toast.success(`Đã chọn file: ${file.name}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    if (!formData.fullName.trim()) {
      toast.error("Vui lòng nhập họ tên");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Email không hợp lệ");
      return;
    }

    if (!/^0\d{9,10}$/.test(formData.phone.trim())) {
      toast.error("Số điện thoại không hợp lệ (10-11 số, bắt đầu bằng 0)");
      return;
    }

    if (!cvFile) {
      toast.error("Vui lòng tải lên file CV");
      return;
    }

    if (!job?._id) {
      toast.error("Thiếu thông tin vị trí ứng tuyển");
      return;
    }

    setLoading(true);
    try {
      const data = await submitJobApplication({
        backendUrl,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        jobId: job._id,
        cvFile,
      });

      if (data.success) {
        setSubmitted(true);
        setTimeout(() => {
          toast.success("Nộp hồ sơ thành công!");
          onSuccess();
          handleClose();
        }, 2000);
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(error.response?.data?.message || "Lỗi khi nộp hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      fullName: "",
      email: "",
      phone: "",
    });
    setCvFile(null);
    setSubmitted(false);
    onClose();
  };

  if (!isOpen) return null;

  if (!job?._id) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-white">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              Ứng tuyển vị trí
            </h2>
            <p className="mt-1 text-sm font-medium text-sky-700">
              {job.title}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {submitted ? (
            // Success Screen
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={32} className="text-green-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Nộp hồ sơ thành công!
              </h3>
              <p className="text-gray-600 mb-2">
                Cảm ơn bạn đã ứng tuyển vị trí:{" "}
                <span className="font-semibold text-gray-800">{job.title}</span>
              </p>
              <p className="text-sm text-gray-500">
                Chúng tôi sẽ xem xét hồ sơ của bạn và liên hệ trong thời gian
                sớm nhất
              </p>
            </div>
          ) : (
            // Form
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Họ tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Nhập họ tên đầy đủ"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Nhập email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Nhập số điện thoại (10-11 số, bắt đầu bằng 0)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
                />
              </div>

              {/* CV Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Upload CV <span className="text-red-500">*</span>
                </label>
                <div
                  onDragEnter={handleDragActive}
                  onDragLeave={handleDragActive}
                  onDragOver={handleDragActive}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    dragActive
                      ? "border-sky-500 bg-sky-50"
                      : "border-gray-300 hover:border-sky-400"
                  }`}
                >
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileInputChange}
                    className="hidden"
                    id="cvInput"
                  />
                  <label
                    htmlFor="cvInput"
                    className="flex flex-col items-center gap-2 cursor-pointer"
                  >
                    <Upload
                      size={32}
                      className={dragActive ? "text-sky-500" : "text-gray-400"}
                    />
                    <p className="text-sm font-medium text-gray-700">
                      Kéo thả file hoặc{" "}
                      <span className="text-sky-600 underline">
                        click để chọn
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Chỉ PDF, tối đa 5MB
                    </p>
                    {cvFile && (
                      <p className="text-sm text-green-600 font-semibold mt-2">
                        ✓ {cvFile.name}
                      </p>
                    )}
                  </label>
                </div>
              </div>

              {/* Info Note */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
                <AlertCircle
                  size={20}
                  className="text-blue-600 flex-shrink-0"
                />
                <p className="text-sm text-blue-800">
                  Hồ sơ của bạn sẽ được kiểm tra và xác nhận trong vòng 24-48
                  giờ. Chúng tôi sẽ liên hệ bạn qua email hoặc số điện thoại
                  được cung cấp.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    "Ứng tuyển ngay"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobApplicationModal;
