import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

const STEPS = [
  {
    step: 1,
    title: "Đã tiếp nhận",
    description: "Hệ thống đã nhận hồ sơ của bạn.",
  },
  {
    step: 2,
    title: "Đang xét duyệt",
    description: "HR đang kiểm tra sự phù hợp của CV.",
  },
  {
    step: 3,
    title: "Phỏng vấn",
    description: "Lịch phỏng vấn sẽ được gửi qua Email.",
  },
  {
    step: 4,
    title: "Đề nghị & Nhận việc",
    description: "Chào mừng bạn gia nhập VietNam Travel.",
  },
];

const itemVariants = {
  hidden: { opacity: 0, y: -12 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

/**
 * @param {Object} props
 * @param {number} props.currentStep — 1–4 (bước hiện tại; các bước ≤ currentStep dùng blue-500)
 * @param {string|null} [props.interviewDate]
 */
const JobApplicationStepper = ({ currentStep, interviewDate }) => {
  const active = Math.min(Math.max(Number(currentStep) || 1, 1), 4);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-700">
        Tiến trình hồ sơ
      </h3>

      <ol className="space-y-0">
        {STEPS.map((s, index) => {
          const reached = s.step <= active;
          const isCurrent = s.step === active;
          const isLast = index === STEPS.length - 1;

          return (
            <motion.li
              key={s.step}
              custom={index}
              variants={itemVariants}
              initial="hidden"
              animate="show"
              className="relative flex gap-3"
            >
              <div className="relative flex w-8 shrink-0 flex-col items-center">
                {!isLast ? (
                  <div
                    className={`absolute left-1/2 top-8 z-0 h-[calc(100%+1.25rem)] w-0.5 -translate-x-1/2 rounded-full ${
                      active > s.step ? "bg-blue-500" : "bg-gray-200"
                    }`}
                    aria-hidden
                  />
                ) : null}
                <div
                  className={`relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                    reached
                      ? "border-blue-500 bg-blue-500 text-white"
                      : "border-gray-200 bg-white text-gray-300"
                  } ${isCurrent && reached ? "ring-2 ring-blue-500/25 ring-offset-2 ring-offset-white" : ""}`}
                >
                  {reached ? <Check size={16} strokeWidth={3} /> : s.step}
                </div>
              </div>

              <div className={`min-w-0 flex-1 ${isLast ? "" : "pb-6"}`}>
                <p
                  className={`text-sm font-semibold ${
                    reached ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  {s.title}
                </p>
                <p
                  className={`mt-1 text-xs leading-relaxed ${
                    reached ? "text-slate-600" : "text-gray-400"
                  }`}
                >
                  {s.description}
                </p>
              </div>
            </motion.li>
          );
        })}
      </ol>

      {interviewDate && active >= 3 ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 rounded-lg border border-blue-100 bg-blue-50/90 p-3 text-xs text-blue-900"
        >
          <p className="font-semibold">Lịch phỏng vấn</p>
          <p className="mt-1 font-medium text-blue-800">
            {new Date(interviewDate).toLocaleString("vi-VN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </motion.div>
      ) : null}
    </div>
  );
};

export default JobApplicationStepper;
