import {
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Briefcase,
  XCircle,
  MapPin,
  Calendar,
  X,
  DollarSign,
  Users,
  FileText,
  SlidersHorizontal,
  Clock,
  Globe,
  ChevronDown,
  Gift,
  HelpCircle,
  UserCheck,
  Ban,
} from "lucide-react";
import { toast } from "react-toastify";
import { AdminContext } from "../context/AdminContext.jsx";
import {
  formatSalaryInputThousands,
  normalizeSalaryForApi,
  salaryFromDbToInput,
  formatSalaryDisplay,
} from "../utils/salaryFormat.js";

const SALARY_FIELD_HINT =
  "Gõ số: tự nhóm 3 chữ số (ví dụ 10000000 → 10.000.000). Có thể nhập mô tả như 5 - 15 triệu/tháng.";

const JOB_STATUS = ["Active", "Closed"];

const REQUIRED_LANGUAGES = [
  { value: "none", label: "Không yêu cầu ngôn ngữ" },
  { value: "english", label: "Tiếng Anh" },
  { value: "chinese", label: "Tiếng Trung" },
  { value: "japanese", label: "Tiếng Nhật" },
  { value: "other", label: "Khác" },
];

const toDateInputValue = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const inputIconClass =
  "h-11 w-full rounded-none border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0";

function IconInput({ icon, className = "", title, ...props }) {
  return (
    <div className="relative" title={title}>
      {createElement(icon, {
        className:
          "pointer-events-none absolute left-3 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-gray-400",
        strokeWidth: 2,
        "aria-hidden": true,
      })}
      <input {...props} className={`${inputIconClass} ${className}`.trim()} />
    </div>
  );
}

function IconSelect({ icon, children, className = "", ...props }) {
  return (
    <div className="relative">
      {createElement(icon, {
        className:
          "pointer-events-none absolute left-3 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-gray-400",
        strokeWidth: 2,
        "aria-hidden": true,
      })}
      <select
        {...props}
        className={`h-11 w-full cursor-pointer appearance-none rounded-none border border-gray-200 bg-white pl-10 pr-10 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 ${className}`.trim()}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        aria-hidden
      />
    </div>
  );
}

function StringRowsField({ label, values, onChange, placeholder }) {
  const add = () => onChange([...values, ""]);
  const remove = (index) => {
    const next = values.filter((_, j) => j !== index);
    onChange(next.length ? next : [""]);
  };
  const setRow = (index, text) => {
    const next = [...values];
    next[index] = text;
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
          {label}
        </span>
        <button
          type="button"
          onClick={add}
          className="inline-flex h-9 w-9 items-center justify-center rounded-none border border-gray-200 bg-white text-gray-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          aria-label="Thêm dòng"
        >
          <Plus size={18} />
        </button>
      </div>
      <div className="space-y-2">
        {values.map((row, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={row}
              onChange={(e) => setRow(index, e.target.value)}
              placeholder={placeholder}
              className="min-w-0 flex-1 rounded-none border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
            />
            <button
              type="button"
              onClick={() => remove(index)}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-none border border-gray-200 bg-white text-gray-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              aria-label="Xóa dòng"
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const emptyJob = {
  _id: null,
  title: "",
  description: "",
  benefits: [""],
  location: "",
  status: "Active",
  salary: "",
  workSchedule: "",
  applicationDeadline: "",
  headcount: "",
  requiredLanguage: "none",
};

const JobManagement = () => {
  const { aToken, backendUrl } = useContext(AdminContext);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [formData, setFormData] = useState(emptyJob);

  const fetchJobs = useCallback(async () => {
    if (!backendUrl) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/jobs`);
      if (data.success) {
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách tuyển dụng");
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const resetForm = () => {
    setSelectedJob(null);
    setFormData(emptyJob);
  };

  const closeForm = () => {
    setFormOpen(false);
    resetForm();
  };

  const openCreateForm = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEditForm = (job) => {
    setSelectedJob(job);
    const ben = Array.isArray(job.benefits) ? job.benefits : [];
    setFormData({
      _id: job._id,
      title: job.title || "",
      description: (job.description || []).join("\n"),
      benefits: ben.length ? [...ben] : [""],
      location: job.location || "",
      status: job.status || "Active",
      salary: salaryFromDbToInput(job.salary || ""),
      workSchedule: job.workSchedule || "",
      applicationDeadline: toDateInputValue(job.applicationDeadline),
      headcount:
        job.headcount != null && job.headcount !== ""
          ? String(job.headcount)
          : "",
      requiredLanguage: job.requiredLanguage || "none",
    });
    setFormOpen(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSalaryChange = (event) => {
    setFormData((prev) => ({
      ...prev,
      salary: formatSalaryInputThousands(event.target.value),
    }));
  };

  const normalizeArrayField = (value) =>
    typeof value === "string"
      ? value
          .split(/\r?\n|\|/)
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

  const normalizeRows = (arr) =>
    Array.isArray(arr)
      ? arr.map((item) => String(item).trim()).filter(Boolean)
      : [];

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.title.trim() || !formData.location.trim()) {
      toast.error("Tiêu đề và địa điểm không được để trống");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: normalizeArrayField(formData.description),
        benefits: normalizeRows(formData.benefits),
        location: formData.location.trim(),
        status: formData.status,
        salary: normalizeSalaryForApi(formData.salary),
        workSchedule: formData.workSchedule.trim(),
        applicationDeadline: formData.applicationDeadline || null,
        headcount: (() => {
          if (formData.headcount === "" || formData.headcount == null)
            return null;
          const n = Number(formData.headcount);
          return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
        })(),
        requiredLanguage: formData.requiredLanguage || "none",
      };

      if (selectedJob?._id) {
        const { data } = await axios.put(
          `${backendUrl}/api/jobs/${selectedJob._id}`,
          payload,
          { headers: { token: aToken } },
        );
        if (data.success) {
          toast.success("Cập nhật bài tuyển dụng thành công");
          fetchJobs();
          setFormOpen(false);
        }
      } else {
        const { data } = await axios.post(`${backendUrl}/api/jobs`, payload, {
          headers: { token: aToken },
        });
        if (data.success) {
          toast.success("Thêm bài tuyển dụng thành công");
          fetchJobs();
          setFormOpen(false);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi lưu bài tuyển dụng");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài tuyển dụng này?"))
      return;
    try {
      const { data } = await axios.delete(`${backendUrl}/api/jobs/${jobId}`, {
        headers: { token: aToken },
      });
      if (data.success) {
        toast.success("Xóa bài tuyển dụng thành công");
        fetchJobs();
      }
    } catch (error) {
      console.error(error);
      toast.error("Xóa bài tuyển dụng thất bại");
    }
  };

  const jobStats = useMemo(
    () => ({
      total: jobs.length,
      active: jobs.filter((job) => job.status === "Active").length,
      closed: jobs.filter((job) => job.status === "Closed").length,
    }),
    [jobs],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      <section className="relative overflow-hidden rounded-none border border-white/25 shadow-[0_24px_48px_-12px_rgba(0,53,128,0.45)]">
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#003580] via-[#004494] to-[#0052cc]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/[0.07] via-transparent to-white/[0.04]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='g' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0 50h100M50 0v100M25 25l50 50M75 25l-50 50' fill='none' stroke='%23ffffff' stroke-width='0.6' opacity='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3C/svg%3E")`,
          }}
          aria-hidden
        />
        <div className="relative z-[1] backdrop-blur-[2px]">
          <div className="flex flex-col gap-8 px-6 py-8 sm:px-10 sm:py-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-medium tracking-tight text-white/95 shadow-sm backdrop-blur-sm">
                <Briefcase className="h-4 w-4 text-white" strokeWidth={2} />
                Tuyển dụng
              </p>
              <h1 className="mt-5 font-semibold tracking-tight text-white text-3xl sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
                Quản lý tuyển dụng chuyên nghiệp
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-normal leading-relaxed text-white/80 sm:text-[15px]">
                Tạo, chỉnh sửa và quản lý các bài tuyển dụng hiển thị trên trang
                Careers. Giao diện rõ ràng, trực quan và dễ thao tác.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreateForm}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-none bg-white px-6 py-3.5 text-sm font-semibold text-[#0052cc] shadow-lg shadow-black/20 ring-1 ring-white/60 transition hover:scale-105 hover:bg-white hover:shadow-xl active:scale-[0.99]"
            >
              <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
              Đăng bài tuyển dụng
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="relative overflow-hidden rounded-none border border-sky-100 bg-white p-6 shadow-sm transition hover:shadow-md">
          <Briefcase
            className="pointer-events-none absolute -bottom-3 -right-2 h-28 w-28 rotate-[-6deg] text-sky-500/[0.12]"
            strokeWidth={1.25}
            aria-hidden
          />
          <p className="text-sm font-medium text-slate-600">Tổng số vị trí</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-sky-700">
            {jobStats.total}
          </p>
        </div>
        <div className="relative overflow-hidden rounded-none border border-emerald-100/90 bg-green-50 p-6 shadow-sm transition hover:shadow-md">
          <UserCheck
            className="pointer-events-none absolute -bottom-3 -right-2 h-28 w-28 rotate-[-6deg] text-emerald-600/[0.14]"
            strokeWidth={1.25}
            aria-hidden
          />
          <p className="text-sm font-medium text-emerald-800/80">
            Đang hoạt động
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-green-700">
            {jobStats.active}
          </p>
        </div>
        <div className="relative overflow-hidden rounded-none border border-red-100/90 bg-red-50 p-6 shadow-sm transition hover:shadow-md">
          <Ban
            className="pointer-events-none absolute -bottom-3 -right-2 h-28 w-28 rotate-[-6deg] text-red-600/[0.12]"
            strokeWidth={1.25}
            aria-hidden
          />
          <p className="text-sm font-medium text-red-800/80">Đã đóng</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-red-700">
            {jobStats.closed}
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="rounded-none bg-white p-10 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-slate-400" />
            <p className="mt-4 text-sm text-slate-500">
              Đang tải danh sách tuyển dụng...
            </p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-none bg-white p-10 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <p className="text-lg font-semibold text-slate-900">
              Chưa có bài tuyển dụng nào.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Nhấn nút "Đăng bài tuyển dụng" để tạo vị trí mới.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {jobs.map((job) => {
              const salaryShow =
                formatSalaryDisplay(job.salary || "") || "—";
              const deadlineRaw = job.applicationDeadline;
              const deadlineMs = deadlineRaw
                ? new Date(deadlineRaw).getTime()
                : NaN;
              const deadlineStr = Number.isFinite(deadlineMs)
                ? new Date(deadlineRaw).toLocaleDateString("vi-VN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "—";
              const headNum =
                job.headcount == null || job.headcount === ""
                  ? NaN
                  : Number(job.headcount);
              const headStr = Number.isFinite(headNum)
                ? String(Math.floor(headNum))
                : "—";
              const isActive = job.status === "Active";
              return (
                <motion.div
                  key={job._id}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.22 } },
                  }}
                  className="relative overflow-hidden rounded-none border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/90 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/[0.04] transition hover:border-sky-200/70 hover:shadow-[0_16px_40px_-8px_rgba(14,165,233,0.15)]"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 opacity-80" />
                  <div className="flex items-start justify-between gap-3 pt-1">
                    <div className="flex min-w-0 flex-1 gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-none bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25">
                        <Briefcase size={22} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold leading-snug tracking-tight text-slate-900">
                          {job.title}
                        </h3>
                        <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                          <MapPin
                            size={14}
                            className="shrink-0 text-sky-500"
                          />
                          <span className="truncate">{job.location}</span>
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${isActive ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/80" : "bg-slate-200 text-slate-700 ring-1 ring-slate-300/60"}`}
                    >
                      {job.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    <div className="flex items-center gap-2.5 rounded-none border border-amber-100/90 bg-amber-50/50 px-3 py-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-none bg-white text-amber-600 shadow-sm">
                        <DollarSign size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800/80">
                          Lương
                        </p>
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {salaryShow}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-none border border-sky-100/90 bg-sky-50/40 px-3 py-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-none bg-white text-sky-600 shadow-sm">
                        <Users size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-sky-800/80">
                          Số tuyển
                        </p>
                        <p className="text-sm font-semibold tabular-nums text-slate-900">
                          {headStr}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-none border border-rose-100/90 bg-rose-50/40 px-3 py-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-none bg-white text-rose-600 shadow-sm">
                        <Calendar size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-rose-800/80">
                          Hạn nộp
                        </p>
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {deadlineStr}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end border-t border-slate-100/90 pt-3">
                    <div className="flex items-center gap-0.5 rounded-none border border-slate-200 bg-white/90 p-1 shadow-sm">
                      <button
                        type="button"
                        onClick={() => openEditForm(job)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-none text-slate-600 transition hover:bg-sky-50 hover:text-sky-600"
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(job._id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-none text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {formOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
          onClick={closeForm}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-3xl max-h-[calc(100vh-3rem)] overflow-hidden rounded-none border border-slate-200 bg-white shadow-[0_32px_80px_rgba(15,23,42,0.18)]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-8 py-6">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                  {selectedJob
                    ? "Chỉnh sửa bài tuyển dụng"
                    : "Thêm bài tuyển dụng mới"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Nhập thông tin đầy đủ để hiển thị trên trang Careers.
                </p>
              </div>
              <button
                onClick={closeForm}
                type="button"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                aria-label="Đóng"
              >
                <XCircle size={22} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex max-h-[calc(100vh-9rem)] flex-col gap-y-6 overflow-y-auto p-8"
            >
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <label className="block min-w-0">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    Tiêu đề
                  </span>
                  <IconInput
                    icon={FileText}
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Ví dụ: Hướng dẫn viên du lịch"
                  />
                </label>
                <label className="block min-w-0">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    Địa điểm
                  </span>
                  <IconInput
                    icon={MapPin}
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Ví dụ: TP.HCM / Toàn quốc"
                  />
                </label>

                <label className="block min-w-0">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    Trạng thái
                  </span>
                  <IconSelect
                    icon={SlidersHorizontal}
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    {JOB_STATUS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </IconSelect>
                </label>
                <label className="block min-w-0">
                  <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    Lương
                    <span
                      className="inline-flex cursor-help text-gray-400 transition hover:text-gray-600"
                      title={SALARY_FIELD_HINT}
                      tabIndex={0}
                      role="note"
                    >
                      <HelpCircle
                        className="h-4 w-4 shrink-0"
                        strokeWidth={2}
                        aria-label={SALARY_FIELD_HINT}
                      />
                    </span>
                  </span>
                  <IconInput
                    icon={DollarSign}
                    name="salary"
                    value={formData.salary}
                    onChange={handleSalaryChange}
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="10000000 hoặc 5 - 15 triệu/tháng"
                  />
                </label>

                <label className="block min-w-0">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    Thời gian làm việc
                  </span>
                  <IconInput
                    icon={Clock}
                    name="workSchedule"
                    value={formData.workSchedule}
                    onChange={handleChange}
                    placeholder="Ví dụ: Linh hoạt theo lịch tour"
                  />
                </label>
                <label className="block min-w-0">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    Hạn chót nộp hồ sơ
                  </span>
                  <div className="relative">
                    <Calendar
                      className="pointer-events-none absolute left-3 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-gray-400"
                      strokeWidth={2}
                      aria-hidden
                    />
                    <input
                      type="date"
                      name="applicationDeadline"
                      value={formData.applicationDeadline}
                      onChange={handleChange}
                      className={`${inputIconClass} pr-10 [color-scheme:light]`}
                    />
                  </div>
                </label>

                <label className="block min-w-0">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    Số lượng tuyển
                  </span>
                  <IconInput
                    icon={Users}
                    type="number"
                    name="headcount"
                    value={formData.headcount}
                    onChange={handleChange}
                    min={0}
                    step={1}
                    placeholder="Ví dụ: 2"
                  />
                </label>
                <div className="min-w-0" aria-hidden="true" />

                <div className="col-span-2 min-w-0">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-gray-700">
                      Ngôn ngữ yêu cầu
                    </span>
                    <IconSelect
                      icon={Globe}
                      name="requiredLanguage"
                      value={formData.requiredLanguage}
                      onChange={handleChange}
                    >
                      {REQUIRED_LANGUAGES.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </IconSelect>
                  </label>
                </div>

                <div className="col-span-2 min-w-0">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-gray-700">
                      Mô tả công việc
                    </span>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Mỗi dòng là một nội dung mô tả"
                      className="min-h-[140px] w-full resize-none rounded-none border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                    />
                  </label>
                </div>

                <div className="col-span-2 min-w-0">
                  <StringRowsField
                    label={
                      <>
                        <Gift
                          className="h-4 w-4 shrink-0 text-gray-400"
                          aria-hidden
                        />
                        <span>Quyền lợi</span>
                      </>
                    }
                    values={formData.benefits}
                    onChange={(next) =>
                      setFormData((prev) => ({ ...prev, benefits: next }))
                    }
                    placeholder="Nhập một quyền lợi"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setFormOpen(false);
                    resetForm();
                  }}
                  className="h-11 rounded-none border border-gray-200 px-6 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex h-11 items-center justify-center gap-2 rounded-none bg-blue-600 px-6 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : selectedJob ? (
                    "Lưu thay đổi"
                  ) : (
                    "Tạo bài tuyển dụng"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default JobManagement;
