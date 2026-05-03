import React, { memo, useCallback } from "react";
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Heart,
  Share2,
  ArrowRight,
  Sparkles,
  Check,
  CalendarDays,
  Users,
  Globe,
} from "lucide-react";
import { toast } from "react-toastify";
import { formatSalaryDisplay } from "../utils/salaryFormat.js";

const LANGUAGE_LABELS = {
  english: "Tiếng Anh",
  chinese: "Tiếng Trung",
  japanese: "Tiếng Nhật",
  other: "Khác",
  none: "Không yêu cầu ngôn ngữ",
};

function JobCardComponent({ job, onApply, onSaveJob, isSaved: isSavedProp }) {
  const {
    title = "Hướng dẫn viên du lịch",
    description = [
      "Hướng dẫn khách du lịch tham quan các địa điểm du lịch nội địa",
      "Giới thiệu văn hóa, lịch sử và đặc sản địa phương",
      "Đảm bảo an toàn và chất lượng trải nghiệm cho du khách",
      "Phối hợp với đội ngũ điều hành và lái xe",
    ],
    benefits = [
      "Lương cạnh tranh + thưởng theo hiệu suất",
      "Du lịch miễn phí cùng gia đình",
      "Đào tạo chuyên nghiệp và chứng chỉ hướng dẫn viên",
      "Môi trường làm việc năng động, thân thiện",
      "Cơ hội thăng tiến và phát triển sự nghiệp",
    ],
    workSchedule = "Linh hoạt theo lịch tour",
    salary = "5 - 15 triệu/tháng",
    location = "Toàn quốc",
    isSaved: isSavedFromJob = false,
    applicationDeadline,
    headcount,
    requiredLanguage = "none",
  } = job;

  const isSaved =
    isSavedProp !== undefined ? Boolean(isSavedProp) : isSavedFromJob;

  const salaryLabel = formatSalaryDisplay(salary) || salary;

  const deadlineLabel =
    applicationDeadline &&
    !Number.isNaN(new Date(applicationDeadline).getTime())
      ? new Date(applicationDeadline).toLocaleDateString("vi-VN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : null;

  const handleApplyClick = useCallback(() => {
    onApply?.(job);
  }, [onApply, job]);

  const handleSaveClickCb = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (job?._id != null) onSaveJob?.(job._id);
    },
    [onSaveJob, job],
  );

  const shareCareers = async () => {
    const url = `${window.location.origin}/careers`;
    const payload = { title, text: `${title} — VietNam Travel`, url };
    try {
      if (navigator.share) {
        await navigator.share(payload);
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Đã sao chép link trang tuyển dụng");
      }
    } catch (e) {
      if (e?.name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(url);
          toast.success("Đã sao chép link");
        } catch {
          toast.error("Không thể chia sẻ");
        }
      }
    }
  };

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/[0.04] transition-all duration-300 hover:border-sky-200/80 hover:shadow-[0_20px_50px_-12px_rgba(14,165,233,0.18)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 opacity-90" />

      <div className="p-6 sm:p-8 pt-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 gap-4 sm:gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/25">
              <Briefcase size={26} strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl sm:font-semibold group-hover:text-sky-700">
                {title}
              </h3>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                <MapPin size={15} className="shrink-0 text-sky-500" />
                <span className="truncate">{location}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSaveClickCb}
            aria-label={isSaved ? "Bỏ lưu vị trí" : "Lưu vị trí"}
            aria-pressed={isSaved}
            className={`shrink-0 rounded-2xl p-2.5 transition-all ${
              isSaved
                ? "bg-red-50 text-red-600 ring-1 ring-red-200 hover:bg-red-100"
                : "bg-slate-50 text-slate-400 ring-1 ring-slate-100 hover:bg-slate-100 hover:text-slate-600"
            }`}
          >
            <Heart
              size={20}
              strokeWidth={2}
              className={isSaved ? "text-red-600" : undefined}
              fill={isSaved ? "currentColor" : "none"}
            />
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="flex gap-3 rounded-2xl border border-amber-100/80 bg-gradient-to-br from-amber-50/90 to-orange-50/40 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/80 text-amber-600 shadow-sm">
              <DollarSign size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-800/70">
                Lương & đãi ngộ
              </p>
              <p className="mt-1 text-sm font-semibold leading-snug text-slate-900 sm:text-base">
                {salaryLabel}
              </p>
            </div>
          </div>
          <div className="flex gap-3 rounded-2xl border border-violet-100/80 bg-gradient-to-br from-violet-50/90 to-fuchsia-50/30 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/80 text-violet-600 shadow-sm">
              <Clock size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-800/70">
                Thời gian làm việc
              </p>
              <p className="mt-1 text-sm font-semibold leading-snug text-slate-900 sm:text-base">
                {workSchedule}
              </p>
            </div>
          </div>
        </div>

        {(deadlineLabel ||
          (headcount != null && headcount !== "") ||
          (requiredLanguage && requiredLanguage !== "none")) ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {deadlineLabel ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-100 bg-rose-50/90 px-3 py-1 text-xs font-semibold text-rose-900">
                <CalendarDays size={14} className="text-rose-600" />
                Hạn nộp: {deadlineLabel}
              </span>
            ) : null}
            {headcount != null && headcount !== "" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-100 bg-sky-50/90 px-3 py-1 text-xs font-semibold text-sky-900">
                <Users size={14} className="text-sky-600" />
                Tuyển {headcount} người
              </span>
            ) : null}
            {requiredLanguage && requiredLanguage !== "none" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/90 px-3 py-1 text-xs font-semibold text-indigo-900">
                <Globe size={14} className="text-indigo-600" />
                {LANGUAGE_LABELS[requiredLanguage] || requiredLanguage}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 space-y-5">
          {description.length > 0 ? (
            <section className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5 sm:p-6">
              <h4 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500 text-white">
                  <Sparkles size={14} />
                </span>
                Mô tả công việc
              </h4>
              <ul className="space-y-3">
                {description.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex gap-3 text-sm leading-relaxed text-slate-700 sm:text-[15px]"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {benefits.length > 0 ? (
            <section className="rounded-2xl border border-emerald-100/80 bg-gradient-to-b from-emerald-50/50 to-white p-5 sm:p-6">
              <h4 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-800/80">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500 text-white">
                  <Check size={14} strokeWidth={3} />
                </span>
                Quyền lợi
              </h4>
              <ul className="space-y-3">
                {benefits.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex gap-3 text-sm leading-relaxed text-slate-700 sm:text-[15px]"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <div className="mt-8 space-y-3 border-t border-slate-100 pt-6">
          {deadlineLabel ? (
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-800">
                Hạn chót nộp hồ sơ:
              </span>{" "}
              <span className="text-slate-900">{deadlineLabel}</span>
            </p>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleApplyClick}
              className="group/btn flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:from-sky-500 hover:to-blue-500 hover:shadow-xl hover:shadow-sky-500/25 active:scale-[0.99]"
            >
              Ứng tuyển ngay
              <ArrowRight
                size={18}
                className="transition-transform group-hover/btn:translate-x-0.5"
              />
            </button>
            <button
              type="button"
              onClick={shareCareers}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto sm:min-w-[52px] sm:px-4"
              aria-label="Chia sẻ"
            >
              <Share2 size={18} />
              <span className="sm:hidden">Chia sẻ</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

const JobCard = memo(JobCardComponent);
export default JobCard;
