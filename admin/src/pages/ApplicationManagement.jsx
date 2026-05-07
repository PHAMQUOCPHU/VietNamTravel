import {
  Fragment,
  memo,
  useCallback,
  useContext,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Loader2,
  ArrowUpRight,
  Clock,
  Mail,
  Phone,
  Download,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Filter,
  StickyNote,
  Check,
  Copy,
  Search,
} from "lucide-react";
import { toast } from "react-toastify";
import { AdminContext } from "../context/AdminContext.jsx";

const APPLICATION_STATUSES = [
  { key: "submitted", label: "Đã tiếp nhận" },
  { key: "confirmed", label: "Đang xét duyệt" },
  { key: "reviewed", label: "HR đã xem CV" },
  { key: "interview", label: "Phỏng vấn" },
  { key: "hired", label: "Nhận việc" },
  { key: "rejected", label: "Từ chối" },
];

/** 5 bước chính (không gồm từ chối) — thứ tự cố định */
const RECRUITMENT_PIPELINE = [
  { key: "submitted", label: "Tiếp nhận", sub: "Đã nộp CV" },
  { key: "confirmed", label: "Xét duyệt", sub: "HR xử lý" },
  { key: "reviewed", label: "HR xem CV", sub: "Đã xem hồ sơ" },
  { key: "interview", label: "Phỏng vấn", sub: "Lịch PV" },
  { key: "hired", label: "Nhận việc", sub: "Hoàn tất" },
];

function pipelineStepIndex(status) {
  return RECRUITMENT_PIPELINE.findIndex((s) => s.key === status);
}

/** Badge trạng thái — hired success, rejected danger, interview warning */
const STATUS_BADGE_CLASS = {
  submitted:
    "bg-slate-100 text-slate-800 ring-1 ring-inset ring-slate-200/90",
  confirmed:
    "bg-amber-50 text-amber-950 ring-1 ring-inset ring-amber-200/90",
  reviewed:
    "bg-orange-50 text-orange-950 ring-1 ring-inset ring-orange-200/90",
  interview:
    "bg-amber-100 text-amber-950 ring-1 ring-inset ring-amber-300 shadow-sm",
  hired:
    "bg-emerald-50 text-emerald-900 ring-1 ring-inset ring-emerald-200/90",
  rejected:
    "bg-red-50 text-red-900 ring-1 ring-inset ring-red-200/90",
};

function StatusBadge({ status }) {
  const label =
    APPLICATION_STATUSES.find((s) => s.key === status)?.label || status;
  return (
    <span
      className={`inline-flex items-center rounded-none px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${STATUS_BADGE_CLASS[status] || STATUS_BADGE_CLASS.submitted}`}
    >
      {label}
    </span>
  );
}

/** Thanh 5 bước: bấm ô nào đặt trạng thái về bước đó (admin). */
const RecruitmentPipelineBar = memo(function RecruitmentPipelineBar({
  status,
  applicationId,
  busy,
  onAdvance,
  onReject,
}) {
  const isRejected = status === "rejected";
  const idx = pipelineStepIndex(status);
  const canReject = status !== "rejected";

  const goToStep = (targetKey) => {
    if (busy || targetKey === status) return;
    onAdvance(applicationId, targetKey);
  };

  const currentKey =
    !isRejected && idx >= 0 ? RECRUITMENT_PIPELINE[idx]?.key : null;

  return (
    <div className="rounded-none border border-slate-200 bg-gradient-to-b from-slate-50/90 to-white p-4 ring-1 ring-slate-900/[0.03]">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        Quy trình: Tiếp nhận → Xét duyệt → HR xem CV → Phỏng vấn → Nhận việc
      </p>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch">
        {RECRUITMENT_PIPELINE.map((step, i) => {
          let mode = "upcoming";
          if (isRejected) {
            mode = "restore";
          } else if (idx < 0) {
            mode = "upcoming";
          } else if (i < idx) {
            mode = "done";
          } else if (i === idx) {
            mode = "current";
          } else {
            mode = "upcoming";
          }

          const isCurrent = currentKey === step.key;

          const base =
            "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-none border px-2 py-2.5 text-center transition sm:min-w-[88px] sm:flex-none sm:px-3";
          const cls =
            mode === "done"
              ? `${base} border-emerald-200/90 bg-emerald-50/90 text-emerald-900`
              : mode === "current"
                ? `${base} border-blue-400 bg-blue-600 text-white shadow-md ring-2 ring-blue-500/20`
                : mode === "restore"
                  ? `${base} border-slate-200 bg-white text-slate-800 hover:border-sky-300 hover:bg-sky-50/80`
                  : `${base} border-slate-200/90 bg-slate-50/90 text-slate-700 hover:border-blue-300 hover:bg-blue-50/90`;

          const interactiveCls =
            !isCurrent && !busy
              ? " cursor-pointer hover:ring-2 hover:ring-sky-400/25 active:scale-[0.99]"
              : isCurrent
                ? " cursor-default"
                : " cursor-wait opacity-60";

          const title = isRejected
            ? `Đặt trạng thái: ${step.label}`
            : isCurrent
              ? "Trạng thái hiện tại"
              : mode === "done"
                ? `Đặt lại về: ${step.label}`
                : `Chuyển tới: ${step.label}`;

          const inner = (
            <>
              <span className="flex items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-wide">
                {mode === "done" && (
                  <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={3} />
                )}
                {mode === "current" ? (
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                ) : null}
                {step.label}
              </span>
              <span
                className={`hidden text-[10px] leading-tight sm:block ${
                  mode === "current" ? "text-blue-100" : "text-current opacity-80"
                }`}
              >
                {step.sub}
              </span>
            </>
          );

          return (
            <Fragment key={step.key}>
              {i > 0 ? (
                <ChevronRight
                  className="hidden h-4 w-4 shrink-0 self-center text-slate-300 sm:block"
                  aria-hidden
                />
              ) : null}
              {isCurrent ? (
                <div title={title} className={`${cls} ${interactiveCls}`}>
                  {inner}
                </div>
              ) : (
                <button
                  type="button"
                  title={title}
                  disabled={busy}
                  onClick={() => goToStep(step.key)}
                  className={`${cls} ${interactiveCls} disabled:pointer-events-none disabled:opacity-50`}
                >
                  {inner}
                </button>
              )}
            </Fragment>
          );
        })}
      </div>

      {canReject ? (
        <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (
                window.confirm(
                  "Xác nhận từ chối hồ sơ này? Ứng viên sẽ thấy trạng thái từ chối trên trang Careers.",
                )
              ) {
                onReject(applicationId);
              }
            }}
            className="rounded-none border-2 border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:border-red-400 hover:bg-red-50 disabled:opacity-50"
          >
            Từ chối hồ sơ
          </button>
        </div>
      ) : null}
    </div>
  );
});

function QuickNotePanel({ application, backendUrl, aToken, onSaved, busy }) {
  const [text, setText] = useState(application.adminNotes || "");

  useEffect(() => {
    // tránh warning "setState in effect" của eslint rule dự án
    const t = setTimeout(() => {
      setText(application.adminNotes || "");
    }, 0);
    return () => clearTimeout(t);
  }, [application._id, application.adminNotes]);

  const save = async () => {
    try {
      const { data } = await axios.put(
        `${backendUrl}/api/job-applications/${application._id}/status`,
        { status: application.status, adminNotes: text },
        { headers: { token: aToken } },
      );
      if (data.success) {
        toast.success("Đã lưu ghi chú");
        onSaved();
      }
    } catch (e) {
      console.error(e);
      toast.error("Không lưu được ghi chú");
    }
  };

  return (
    <div className="flex h-full min-h-[140px] flex-col rounded-2xl border border-amber-100/90 bg-gradient-to-b from-amber-50/80 to-amber-50/30 p-4 ring-1 ring-amber-900/5">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-900/80">
        <StickyNote className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Ghi chú nhanh
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder="Ghi chú nội bộ (HR)…"
        disabled={busy}
        className="min-h-0 flex-1 resize-none rounded-xl border border-amber-200/80 bg-white/90 px-3 py-2 text-sm text-slate-800 shadow-inner outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/25 disabled:opacity-50"
      />
      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="mt-3 w-full rounded-xl bg-amber-600 px-3 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-amber-500 disabled:opacity-50"
      >
        Lưu ghi chú
      </button>
    </div>
  );
}

const ApplicationManagement = () => {
  const { backendUrl, aToken } = useContext(AdminContext);
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedJob, setSelectedJob] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const deferredSearchEmail = useDeferredValue(searchEmail);
  const deferredSearchPhone = useDeferredValue(searchPhone);

  const fetchApplications = useCallback(
    async (opts) => {
      const signal = opts?.signal;
      setLoading(true);
      try {
        const { data } = await axios.get(`${backendUrl}/api/job-applications`, {
          headers: { token: aToken },
          signal,
        });
        if (data.success) {
          setApplications(data.applications || []);
        } else {
          toast.error(data.message || "Không thể tải danh sách hồ sơ");
          setApplications([]);
        }
      } catch (error) {
        if (
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError"
        ) {
          return;
        }
        console.error(error);
        toast.error(
          error.response?.data?.message || "Không thể tải danh sách hồ sơ",
        );
      } finally {
        setLoading(false);
      }
    },
    [aToken, backendUrl],
  );

  const fetchJobs = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/jobs`);
      if (data.success) {
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error(error);
    }
  }, [backendUrl]);

  useEffect(() => {
    if (!aToken) return;
    const ac = new AbortController();
    fetchApplications({ signal: ac.signal });
    fetchJobs();
    return () => ac.abort();
  }, [aToken, fetchApplications, fetchJobs]);

  const applicationsByJob = useMemo(() => {
    if (!selectedJob) return applications;
    return applications.filter(
      (app) =>
        app.jobId && app.jobId._id && app.jobId._id.toString() === selectedJob,
    );
  }, [applications, selectedJob]);

  const filteredApplications = useMemo(() => {
    const emailQ = deferredSearchEmail.trim().toLowerCase();
    const phoneQ = deferredSearchPhone.replace(/\s/g, "");
    return applicationsByJob.filter((app) => {
      const email = (app.email || "").toLowerCase();
      const phone = String(app.phone || "").replace(/\s/g, "");
      if (emailQ && !email.includes(emailQ)) return false;
      if (phoneQ && !phone.includes(phoneQ)) return false;
      return true;
    });
  }, [applicationsByJob, deferredSearchEmail, deferredSearchPhone]);

  const statusCounts = useMemo(() => {
    const out = {
      total: filteredApplications.length,
      submitted: 0,
      reviewed: 0,
      interview: 0,
      confirmed: 0,
      hired: 0,
      rejected: 0,
    };
    for (const item of filteredApplications) {
      switch (item.status) {
        case "submitted":
          out.submitted++;
          break;
        case "reviewed":
          out.reviewed++;
          break;
        case "interview":
          out.interview++;
          break;
        case "confirmed":
          out.confirmed++;
          break;
        case "hired":
          out.hired++;
          break;
        case "rejected":
          out.rejected++;
          break;
        default:
          break;
      }
    }
    return out;
  }, [filteredApplications]);

  const updateStatus = useCallback(
    async (applicationId, status) => {
      setUpdatingId(applicationId);
      try {
        const { data } = await axios.put(
          `${backendUrl}/api/job-applications/${applicationId}/status`,
          { status },
          { headers: { token: aToken } },
        );
        if (data.success) {
          toast.success("Cập nhật trạng thái hồ sơ thành công");
          fetchApplications();
        }
      } catch (error) {
        console.error(error);
        toast.error("Cập nhật trạng thái không thành công");
      } finally {
        setUpdatingId(null);
      }
    },
    [aToken, backendUrl, fetchApplications],
  );

  const handleRejectApplication = useCallback(
    (applicationId) => {
      updateStatus(applicationId, "rejected");
    },
    [updateStatus],
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="relative mb-6 overflow-hidden rounded-none border border-sky-500/25 bg-gradient-to-br from-slate-950 via-blue-950 to-sky-800 p-8 shadow-[0_30px_90px_rgba(30,58,138,0.28)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_100%_0%,rgba(56,189,248,0.22),transparent)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-sky-400/35 bg-sky-500/15 px-4 py-2 text-sm font-medium text-sky-100">
              <FileText className="h-4 w-4 text-sky-300" /> Hồ sơ ứng tuyển
            </p>
            <h1 className="mt-5 text-3xl sm:text-4xl font-semibold tracking-tight text-white">
              Quản lý hồ sơ ứng viên
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-sky-100/90">
              Xem nhanh trạng thái hồ sơ, hồ sơ đã nộp và cập nhật tiến trình
              phỏng vấn.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchApplications}
            className="inline-flex items-center gap-2 rounded-none border border-white/25 bg-white px-6 py-3 text-sm font-semibold text-blue-950 shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-sky-50"
          >
            <ArrowUpRight size={18} /> Tải lại hồ sơ
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {[
          {
            label: "Tổng hồ sơ",
            value: statusCounts.total,
            color: "bg-slate-50",
          },
          {
            label: "Đã tiếp nhận",
            value: statusCounts.submitted,
            color: "bg-slate-50",
          },
          {
            label: "Đang xét duyệt",
            value: statusCounts.confirmed,
            color: "bg-amber-50",
          },
          {
            label: "HR đã xem",
            value: statusCounts.reviewed,
            color: "bg-orange-50",
          },
          {
            label: "Phỏng vấn",
            value: statusCounts.interview,
            color: "bg-sky-50",
          },
          {
            label: "Nhận việc",
            value: statusCounts.hired,
            color: "bg-violet-50",
          },
          {
            label: "Từ chối",
            value: statusCounts.rejected,
            color: "bg-red-50",
          },
        ].map((item) => (
          <div
            key={item.label}
            className={`rounded-none border border-slate-200 p-5 shadow-sm ${item.color}`}
          >
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filter + tìm email / SĐT */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        {jobs.length > 0 ? (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setFilterOpen(!filterOpen)}
              className={`inline-flex items-center gap-2 rounded-none border px-4 py-2.5 text-sm font-semibold transition ${
                selectedJob
                  ? "border-sky-400 bg-sky-50 text-sky-900"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Filter size={16} />
              {selectedJob
                ? jobs.find((j) => j._id === selectedJob)?.title ||
                  "Lọc theo bài đăng"
                : "Lọc theo bài đăng"}
              <ChevronDown
                size={16}
                className={`transition-transform ${filterOpen ? "rotate-180" : ""}`}
              />
            </button>
            <AnimatePresence>
              {filterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 top-full z-20 mt-2 w-72 max-w-[85vw] rounded-none border border-slate-200 bg-white p-2 shadow-lg"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedJob("");
                      setFilterOpen(false);
                    }}
                    className={`w-full rounded-none px-4 py-2.5 text-left text-sm font-medium transition ${
                      !selectedJob
                        ? "bg-sky-50 text-sky-900"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Tất cả bài đăng
                  </button>
                  {jobs.map((job) => (
                    <button
                      type="button"
                      key={job._id}
                      onClick={() => {
                        setSelectedJob(job._id);
                        setFilterOpen(false);
                      }}
                      className={`w-full rounded-none px-4 py-2.5 text-left text-sm font-medium transition ${
                        selectedJob === job._id
                          ? "bg-sky-50 text-sky-900"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {job.title}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <label className="relative flex min-w-[200px] flex-1 items-center">
            <Search
              className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400"
              aria-hidden
            />
            <input
              type="search"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="Tìm theo email…"
              autoComplete="off"
              className="w-full rounded-none border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-200/70"
            />
          </label>
          <label className="relative flex min-w-[180px] flex-1 items-center">
            <Phone
              className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400"
              aria-hidden
            />
            <input
              type="search"
              inputMode="tel"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              placeholder="Tìm theo SĐT…"
              autoComplete="off"
              className="w-full rounded-none border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-200/70"
            />
          </label>
        </div>

        {(selectedJob || searchEmail.trim() || searchPhone.trim()) && (
          <button
            type="button"
            onClick={() => {
              setSelectedJob("");
              setSearchEmail("");
              setSearchPhone("");
              setFilterOpen(false);
            }}
            className="shrink-0 text-sm font-medium text-slate-500 underline hover:text-sky-700"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="rounded-none bg-white p-10 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-slate-400" />
            <p className="mt-4 text-sm text-slate-500">
              Đang tải hồ sơ ứng tuyển...
            </p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="rounded-none bg-white p-10 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <p className="text-lg font-semibold text-slate-900">
              {applications.length === 0
                ? "Chưa có hồ sơ nào."
                : searchEmail.trim() || searchPhone.trim()
                  ? "Không có hồ sơ khớp email hoặc SĐT."
                  : selectedJob
                    ? "Không có hồ sơ nào cho bài đăng này."
                    : "Không có hồ sơ hiển thị."}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {applications.length === 0
                ? "Ứng viên sẽ nộp CV tại trang Careers."
                : "Thử xóa bộ lọc hoặc đổi từ khóa tìm kiếm."}
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
            {filteredApplications.map((application) => {
              const busy = updatingId === application._id;

              return (
                <motion.div
                  key={application._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                  className="group relative overflow-hidden rounded-[28px] border border-slate-200/90 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/[0.03] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_20px_50px_-12px_rgba(15,23,42,0.12)] hover:ring-slate-900/[0.06] sm:p-6"
                >
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-sky-500/0 via-sky-400/60 to-indigo-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  <div className="flex flex-col gap-5 xl:flex-row xl:items-stretch">
                    <div className="min-w-0 flex-1 space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          {application.jobId && application.jobId.title ? (
                            <span className="inline-flex max-w-full items-center gap-2 truncate rounded-xl bg-sky-50 px-3 py-1.5 text-sm font-semibold text-sky-800 ring-1 ring-sky-100">
                              <Briefcase
                                size={15}
                                className="shrink-0 text-sky-600"
                              />
                              <span className="truncate">
                                {application.jobId.title}
                              </span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-800 ring-1 ring-slate-200/80">
                              <FileText size={15} />
                              {application.position || "Vị trí"}
                            </span>
                          )}
                          <StatusBadge status={application.status} />
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                          <a
                            href={application.cvFileUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800"
                          >
                            <Download size={14} /> CV (PDF)
                          </a>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-slate-50/90 p-4 ring-1 ring-slate-100">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            Ứng viên
                          </p>
                          <p className="mt-1.5 text-sm font-semibold text-slate-900">
                            {application.fullName}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50/90 p-4 ring-1 ring-slate-100">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            Điện thoại
                          </p>
                          <div className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <Phone size={14} className="shrink-0 text-slate-400" />
                            {application.phone}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-slate-50/90 p-4 ring-1 ring-slate-100 sm:col-span-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                              Email
                            </p>
                            <button
                              type="button"
                              title="Sao chép email"
                              disabled={busy || !application.email}
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(
                                    application.email || "",
                                  );
                                  toast.success("Đã sao chép email");
                                } catch {
                                  toast.error("Không sao chép được");
                                }
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 disabled:opacity-40"
                            >
                              <Copy size={12} aria-hidden />
                              Sao chép
                            </button>
                          </div>
                          <div className="mt-1.5 flex gap-2 text-sm font-semibold text-slate-900">
                            <Mail
                              size={14}
                              className="mt-0.5 shrink-0 text-slate-400"
                              aria-hidden
                            />
                            <span className="min-w-0 break-all leading-snug">
                              {application.email}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <Clock size={14} className="text-slate-400" />
                        <span>
                          Nộp:{" "}
                          <span className="font-semibold text-slate-700">
                            {new Date(application.createdAt).toLocaleString(
                              "vi-VN",
                            )}
                          </span>
                        </span>
                      </div>

                      {application.interviewDate ? (
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 text-sm text-emerald-900">
                          <p className="font-semibold">Ngày phỏng vấn</p>
                          <p className="mt-1 font-medium">
                            {new Date(
                              application.interviewDate,
                            ).toLocaleString("vi-VN")}
                          </p>
                        </div>
                      ) : null}

                      <RecruitmentPipelineBar
                        status={application.status}
                        applicationId={application._id}
                        busy={busy}
                        onAdvance={updateStatus}
                        onReject={handleRejectApplication}
                      />
                    </div>

                    <div className="w-full shrink-0 xl:max-w-[280px] xl:border-l xl:border-slate-100 xl:pl-5">
                      <QuickNotePanel
                        application={application}
                        backendUrl={backendUrl}
                        aToken={aToken}
                        onSaved={fetchApplications}
                        busy={busy}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationManagement;
