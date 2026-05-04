import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  Users,
  MapPin,
  Sparkles,
  TrendingUp,
  Award,
  Search,
  Loader2,
  ClipboardList,
  Mail,
  Phone,
  ShieldCheck,
  FileQuestion,
} from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import JobCard from "../components/JobCard";
import JobApplicationModal from "../components/JobApplicationModal";
import JobApplicationStepper from "../components/JobApplicationStepper";
import { AppContext } from "../context/AppContext";
import {
  statusToCurrentStep,
  isRejectedStatus,
} from "../utils/jobApplicationPipeline.js";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const Careers = () => {
  const { backendUrl, user, toggleSavedJob } = useContext(AppContext);
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [applicationJob, setApplicationJob] = useState(null);
  const [application, setApplication] = useState(null);
  const [loadingApplication, setLoadingApplication] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [showSearchEmpty, setShowSearchEmpty] = useState(false);

  const activeJobs = useMemo(
    () => jobs.filter((j) => j.status === "Active"),
    [jobs],
  );

  const savedJobIdSet = useMemo(() => {
    const raw = user?.savedJobs;
    if (!Array.isArray(raw)) return new Set();
    return new Set(
      raw.map((id) =>
        String(id && typeof id === "object" && "_id" in id ? id._id : id),
      ),
    );
  }, [user?.savedJobs]);

  const fetchJobs = useCallback(async () => {
    if (!backendUrl) return;
    try {
      setLoadingJobs(true);
      const response = await axios.get(`${backendUrl}/api/jobs`);
      if (response.data.success) {
        setJobs(response.data.jobs || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách tuyển dụng");
    } finally {
      setLoadingJobs(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const fetchApplicationStatus = useCallback(
    async (
      email,
      { fromManualSearch = false, signal } = {},
    ) => {
      const trimmed = String(email || "").trim();
      if (!trimmed || !backendUrl) return;
      try {
        setLoadingApplication(true);
        if (fromManualSearch) setShowSearchEmpty(false);
        const response = await axios.get(
          `${backendUrl}/api/job-applications/search?email=${encodeURIComponent(trimmed)}`,
          { signal },
        );

        if (response.data.success && response.data.application) {
          setApplication(response.data.application);
          setShowSearchEmpty(false);
        }
      } catch (err) {
        if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") {
          return;
        }
        setApplication(null);
        if (err.response?.status === 404 && fromManualSearch) {
          setShowSearchEmpty(true);
        }
        if (!fromManualSearch) {
          setShowSearchEmpty(false);
        }
      } finally {
        setLoadingApplication(false);
      }
    },
    [backendUrl],
  );

  // Load user email for tracking — hủy request khi đổi user/email để tránh race + lag
  useEffect(() => {
    if (!user?.email) return;
    const ac = new AbortController();
    setSearchEmail(user.email);
    fetchApplicationStatus(user.email, {
      fromManualSearch: false,
      signal: ac.signal,
    });
    return () => ac.abort();
  }, [user?.email, fetchApplicationStatus]);

  const handleApplicationSuccess = useCallback(() => {
    if (user?.email) {
      setTimeout(() => {
        fetchApplicationStatus(user.email, { fromManualSearch: false });
      }, 1000);
    }
  }, [user?.email, fetchApplicationStatus]);

  const handleSearchByEmail = useCallback(
    async (e) => {
      e.preventDefault();
      if (!searchEmail.trim()) {
        toast.error("Vui lòng nhập email");
        return;
      }
      await fetchApplicationStatus(searchEmail, { fromManualSearch: true });
    },
    [searchEmail, fetchApplicationStatus],
  );

  const resetApplicationTracker = useCallback(() => {
    setApplication(null);
    setShowSearchEmpty(false);
  }, []);

  const scrollToJobListings = useCallback(() => {
    document.getElementById("careers-job-listings")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const closeApplicationModal = useCallback(() => {
    setModalOpen(false);
    setApplicationJob(null);
  }, []);

  const openApplicationForJob = useCallback((job) => {
    setApplicationJob(job);
    setModalOpen(true);
  }, []);

  const jobListStagger = useMemo(
    () => ({
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: {
          staggerChildren: activeJobs.length > 8 ? 0.04 : 0.1,
          delayChildren: 0.08,
        },
      },
    }),
    [activeJobs.length],
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Hero Banner */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 overflow-hidden"
      >
        {/* Decorative Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-2000"></div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-sky-100 rounded-full mb-6">
              <Sparkles size={16} className="text-sky-600" />
              <span className="text-sm font-semibold text-sky-700">
                Cơ hội sự nghiệp
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-6 leading-tight">
              Gia nhập đội ngũ{" "}
              <span className="bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
                VietNam Travel
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
              Chúng tôi tìm kiếm những người tâm huyết, yêu du lịch và muốn mang
              lại trải nghiệm tuyệt vời cho mỗi khách hàng.
            </p>

            <div className="flex justify-center">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={scrollToJobListings}
                className="px-8 py-3 border-2 border-sky-600 text-sky-600 font-bold rounded-lg hover:bg-sky-50 transition-all"
              >
                Tìm hiểu thêm
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="py-12 sm:py-16 bg-white"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[
              { icon: Users, label: "Nhân viên", value: "500+" },
              { icon: MapPin, label: "Điểm làm việc", value: "50+" },
              { icon: TrendingUp, label: "Tăng trưởng", value: "30%/năm" },
              { icon: Award, label: "Đạt giải thưởng", value: "15+" },
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={idx}
                  variants={fadeUp}
                  className="p-4 sm:p-6 bg-gradient-to-br from-sky-50 to-blue-50 rounded-lg border border-sky-200 text-center"
                >
                  <Icon size={32} className="text-sky-600 mx-auto mb-3" />
                  <p className="text-xl font-black text-gray-900 sm:text-2xl md:text-3xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-gray-600 sm:text-sm">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 md:py-16 lg:px-8">
        <div className="grid min-w-0 gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Job Listings — dùng animate="show" thay vì whileInView để tránh kẹt opacity:0 khi IO không chạy (reload / Strict Mode) */}
          <motion.div
            variants={jobListStagger}
            initial="hidden"
            animate="show"
            className="min-w-0 space-y-6 lg:col-span-2"
          >
            <div
              id="careers-job-listings"
              className="scroll-mt-28 border-b border-slate-200/80 pb-6"
            >
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Vị trí đang mở
              </h2>
              <p className="mt-2 text-sm text-slate-600 sm:text-base">
                {loadingJobs
                  ? "Đang tải vị trí tuyển dụng..."
                  : `${activeJobs.length} vị trí đang mở ứng tuyển`}
              </p>
            </div>

            <div className="space-y-6">
              {loadingJobs ? (
                <div className="rounded-3xl bg-slate-50 p-8 text-center text-gray-500">
                  <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-slate-400" />
                  Đang tải danh sách tuyển dụng...
                </div>
              ) : jobs.length === 0 ? (
                <div className="rounded-3xl bg-slate-50 p-8 text-center text-gray-500">
                  Chưa có vị trí tuyển dụng.
                </div>
              ) : activeJobs.length === 0 ? (
                <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-600">
                  Hiện không có vị trí đang tuyển (đã đóng hoặc hết hạn nộp hồ
                  sơ).
                </div>
              ) : (
                activeJobs.map((job) => (
                  <motion.div key={job._id} variants={fadeUp}>
                    <JobCard
                      job={job}
                      isSaved={savedJobIdSet.has(String(job._id))}
                      onApply={openApplicationForJob}
                      onSaveJob={toggleSavedJob}
                    />
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="min-w-0 lg:col-span-1"
          >
            <div className="space-y-6 lg:sticky lg:top-24">
              {/* Application Tracker */}
              <div className="rounded-2xl border border-slate-200/90 bg-white/90 p-4 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm ring-1 ring-slate-900/[0.03] sm:p-6">
                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold tracking-tight text-slate-900">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                    <ClipboardList size={18} />
                  </span>
                  Theo dõi hồ sơ
                </h3>

                {application ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/90 p-3.5">
                      <p className="text-xs font-semibold text-emerald-800">
                        Hồ sơ đã được ghi nhận
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold text-emerald-950">
                        {application.email}
                      </p>
                      {application.jobId?.title ? (
                        <p className="mt-2 truncate text-xs font-medium text-emerald-900/90">
                          Vị trí: {application.jobId.title}
                        </p>
                      ) : null}
                    </div>

                    {isRejectedStatus(application.status) ? (
                      <div className="rounded-xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-900">
                        <p className="font-semibold">Hồ sơ chưa phù hợp</p>
                        <p className="mt-2 leading-relaxed text-red-800/90">
                          Cảm ơn bạn đã quan tâm. Bạn có thể theo dõi các vị trí
                          mới và nộp hồ sơ khi phù hợp hơn.
                        </p>
                      </div>
                    ) : (
                      <JobApplicationStepper
                        currentStep={statusToCurrentStep(application.status)}
                        interviewDate={application.interviewDate}
                      />
                    )}

                    {application.cvFileUrl ? (
                      <a
                        href={application.cvFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full rounded-xl border border-sky-200 bg-sky-50/50 px-4 py-2.5 text-center text-sm font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-50"
                      >
                        Xem CV (PDF)
                      </a>
                    ) : null}

                    <button
                      type="button"
                      onClick={resetApplicationTracker}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                      Tra cứu email khác
                    </button>
                  </div>
                ) : showSearchEmpty ? (
                  <div className="space-y-4 text-center">
                    <FileQuestion
                      className="mx-auto h-14 w-14 text-slate-300"
                      strokeWidth={1.25}
                      aria-hidden
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Không tìm thấy hồ sơ
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600">
                        Không có đơn ứng tuyển nào gắn với email{" "}
                        <span className="font-semibold text-slate-900">
                          {searchEmail.trim()}
                        </span>
                        . Vui lòng kiểm tra chính tả hoặc dùng email đã dùng khi
                        nộp CV.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={resetApplicationTracker}
                      className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-500/20 transition hover:from-sky-500 hover:to-blue-500"
                    >
                      Thử lại
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSearchByEmail} className="space-y-3">
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Email
                      </label>
                      <input
                        type="email"
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                        placeholder="Nhập email của bạn"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-500/20"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loadingApplication}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-500/20 transition hover:from-sky-500 hover:to-blue-500 disabled:opacity-50"
                    >
                      {loadingApplication ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Đang tìm...
                        </>
                      ) : (
                        <>
                          <Search size={16} />
                          Tìm hồ sơ
                        </>
                      )}
                    </button>
                  </form>
                )}

                {!application && !showSearchEmpty ? (
                  <p className="mt-4 text-xs leading-relaxed text-slate-500">
                    Nhập email để kiểm tra trạng thái hồ sơ ứng tuyển của bạn
                  </p>
                ) : null}
              </div>

              {/* Benefits Highlight */}
              <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/40 p-4 shadow-sm ring-1 ring-emerald-900/[0.03] sm:p-6">
                <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-emerald-950">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
                    <ShieldCheck size={18} />
                  </span>
                  Tại sao chọn chúng tôi?
                </h4>
                <ul className="space-y-3 text-sm text-emerald-900/90">
                  {[
                    "Lương thưởng cạnh tranh",
                    "Du lịch miễn phí",
                    "Đội ngũ chuyên nghiệp",
                    "Phát triển sự nghiệp",
                    "Môi trường làm việc tích cực",
                  ].map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                        ✓
                      </span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact CTA */}
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-4 text-center ring-1 ring-slate-900/[0.02] sm:p-6">
                <p className="mb-4 text-sm font-medium text-slate-600">
                  Mọi thắc mắc? Liên hệ với Mr.Phú
                </p>
                <div className="space-y-2.5">
                  <a
                    href="mailto:careers@vietnamtravel.com"
                    className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-sky-700 transition hover:text-sky-800"
                  >
                    <Mail size={16} className="shrink-0 opacity-80" />
                    phamquocphu431027@gmail.com
                  </a>
                  <a
                    href="tel:+84123456789"
                    className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-sky-700 transition hover:text-sky-800"
                  >
                    <Phone size={16} className="shrink-0 opacity-80" />
                    0905.713.702
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Application Modal */}
      <JobApplicationModal
        isOpen={modalOpen}
        job={applicationJob}
        onClose={closeApplicationModal}
        onSuccess={handleApplicationSuccess}
      />
    </div>
  );
};

export default Careers;
