import { useContext, useEffect, useMemo, useState, useRef, useCallback } from "react";
import axios from "axios";
import DOMPurify from "dompurify";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  FileText,
  CreditCard,
  Shield,
  Scale,
  RefreshCw,
  ClipboardList,
  Sparkles,
  ChevronDown,
  ScrollText,
  CheckCircle2,
  Cloud,
} from "lucide-react";
import { AppContext } from "../context/AppContext";

const SCROLL_OFFSET = 112;

/** Chọn icon theo tiêu đề (fallback theo chỉ số) */
function SectionIcon({ title, index }) {
  const Icon = useMemo(() => {
    const t = (title || "").toLowerCase();
    if (t.includes("thanh toán") || t.includes("payment") || t.includes("momo"))
      return CreditCard;
    if (
      t.includes("bảo mật") ||
      t.includes("dữ liệu") ||
      t.includes("cloudinary") ||
      t.includes("(ai)")
    )
      return Shield;
    if (t.includes("hủy") || t.includes("hoàn") || t.includes("refund"))
      return Scale;
    if (t.includes("trách nhiệm") || t.includes("khách hàng")) return ClipboardList;
    if (t.includes("thay đổi") || t.includes("sửa đổi")) return RefreshCw;
    if (
      t.includes("thông tin") ||
      t.includes("xác nhận") ||
      t.includes("chung")
    )
      return CheckCircle2;
    if (t.includes("điều khoản") || t.includes("pháp lý")) return ScrollText;
    if (t.includes("cloud") || t.includes("ai")) return Cloud;
    const fallbacks = [FileText, Sparkles, ClipboardList];
    return fallbacks[index % fallbacks.length];
  }, [title, index]);

  return <Icon size={22} strokeWidth={2} className="shrink-0" aria-hidden />;
}

const proseTerms =
  "terms-html prose prose-slate dark:prose-invert max-w-none min-w-0 prose-lg " +
  "leading-relaxed prose-p:leading-[1.75] prose-li:leading-relaxed prose-headings:text-slate-900 " +
  "dark:prose-headings:text-slate-50 prose-headings:font-semibold prose-a:text-blue-600 " +
  "prose-strong:text-slate-900 dark:prose-strong:text-white prose-p:break-words prose-li:break-words " +
  "[&_*]:max-w-full [&_p]:overflow-wrap-anywhere [&_li]:overflow-wrap-anywhere " +
  "[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_svg]:max-w-full " +
  "[&_video]:max-w-full [&_iframe]:max-w-full [&_pre]:max-w-full [&_pre]:overflow-x-auto " +
  "[&_pre]:whitespace-pre-wrap [&_table]:block [&_table]:w-full [&_table]:max-w-full [&_table]:overflow-x-auto";

export default function Terms() {
  const { backendUrl } = useContext(AppContext);
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const sectionRefs = useRef([]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${backendUrl}/api/terms`);
        if (!cancelled && data.success && data.terms?.sections) {
          const sorted = [...data.terms.sections].sort(
            (a, b) => (a.order ?? 0) - (b.order ?? 0),
          );
          setSections(sorted);
          setLastUpdated(data.terms.lastUpdated || data.terms.updatedAt);
        }
      } catch {
        if (!cancelled) setSections([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [backendUrl]);

  const formatDateBadge = useCallback((v) => {
    if (!v) return "";
    try {
      return new Date(v).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  }, []);

  const scrollToSection = useCallback((index) => {
    const el = sectionRefs.current[index];
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    setMobileNavOpen(false);
  }, []);

  /** Scrollspy: gắn mục khớp với vị trí cuộn */
  useEffect(() => {
    if (sections.length === 0) return undefined;

    const updateActive = () => {
      let next = 0;
      sectionRefs.current.forEach((node, idx) => {
        if (!node) return;
        const rect = node.getBoundingClientRect();
        const ref = SCROLL_OFFSET + 24;
        if (rect.top <= ref) next = idx;
      });
      setActiveIndex((prev) => (prev === next ? prev : next));
    };

    window.addEventListener("scroll", updateActive, { passive: true });
    updateActive();
    return () => window.removeEventListener("scroll", updateActive);
  }, [sections]);

  useEffect(() => {
    sectionRefs.current = sectionRefs.current.slice(0, sections.length);
  }, [sections.length]);

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden bg-gradient-to-b from-slate-50 via-blue-50/40 to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-950">
      {/* ========== Hero (glass + gradient glow) ========== */}
      <div className="relative isolate overflow-hidden border-b border-blue-100/70 dark:border-slate-800">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-90 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(37,99,235,0.22),transparent_52%),linear-gradient(105deg,rgba(59,130,246,0.08),transparent_40%),linear-gradient(-25deg,rgba(99,102,241,0.12),transparent_45%)] dark:opacity-60 dark:bg-[radial-gradient(ellipse_100%_80%_at_50%_-25%,rgba(59,130,246,0.35),transparent_55%)]"
        />
        <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-14 sm:px-6 md:pb-20 md:pt-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
            className="mx-auto flex max-w-3xl flex-col items-center text-center"
          >
            <span className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/35 ring-4 ring-blue-500/15">
              <ScrollText size={28} strokeWidth={2} />
            </span>
            <div className="w-full rounded-3xl border border-white/70 bg-white/65 px-6 py-8 shadow-xl shadow-blue-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/55 md:px-10 md:py-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-blue-700/85 dark:text-blue-300">
                VietNam Travel
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0b2d5c] dark:text-white sm:text-4xl md:text-[2.65rem] md:leading-tight">
                Điều khoản dịch vụ
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
                Vui lòng đọc kỹ các điều khoản áp dụng khi sử dụng nền tảng đặt
                tour và dịch vụ của chúng tôi.
              </p>
              {lastUpdated ? (
                <div className="mt-7 flex justify-center">
                  <span className="inline-flex items-center gap-2 rounded-full border border-blue-200/90 bg-blue-50/90 px-4 py-1.5 text-xs font-semibold text-blue-900 shadow-sm dark:border-blue-500/30 dark:bg-blue-950/60 dark:text-blue-100">
                    <Sparkles size={13} className="text-blue-600 dark:text-blue-300" />
                    Cập nhật {formatDateBadge(lastUpdated)}
                  </span>
                </div>
              ) : null}
            </div>
          </motion.div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center gap-2 py-24 text-slate-500">
          <Loader2 className="animate-spin" size={24} aria-hidden />
          <span className="font-medium">Đang tải điều khoản…</span>
        </div>
      ) : sections.length === 0 ? (
        <p className="py-20 text-center text-slate-500">
          Chưa có nội dung điều khoản. Vui lòng quay lại sau.
        </p>
      ) : (
        <>
          {/* ========== Mobile: dropdown điều hướng cố định ========== */}
          <div className="sticky top-[4rem] z-40 lg:hidden border-b border-slate-200/90 bg-white/90 px-4 py-2.5 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90">
            <div className="relative mx-auto max-w-5xl">
              <button
                type="button"
                aria-expanded={mobileNavOpen}
                onClick={() => setMobileNavOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-bold text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <span className="line-clamp-2 min-w-0">
                  <span className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                    Mục {activeIndex + 1}
                  </span>
                  <br />
                  <span className="text-[15px] font-bold">
                    {sections[activeIndex]?.title}
                  </span>
                </span>
                <ChevronDown
                  size={22}
                  className={`shrink-0 text-slate-500 transition-transform ${mobileNavOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              <AnimatePresence initial={false}>
                {mobileNavOpen && (
                  <motion.ul
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-0 right-0 mt-2 max-h-[min(52vh,320px)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900"
                    role="listbox"
                  >
                    {sections.map((s, i) => (
                      <li key={`m-${s.order}-${i}`}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={activeIndex === i}
                          onClick={() => scrollToSection(i)}
                          className={`flex w-full gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors ${
                            activeIndex === i
                              ? "bg-blue-50 font-bold text-blue-900 dark:bg-blue-950/70 dark:text-blue-100"
                              : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                          }`}
                        >
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-[12px] font-black text-blue-700 dark:bg-blue-900/50 dark:text-blue-200">
                            {i + 1}
                          </span>
                          <span className="min-w-0 leading-snug">{s.title}</span>
                        </button>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pb-24 sm:pt-10 lg:pb-28">
            <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] lg:gap-12 xl:gap-14">
              {/* ========== Desktop sticky sidebar ========== */}
              <aside className="hidden lg:block">
                <nav
                  className="sticky top-28 rounded-3xl border border-slate-200/90 bg-white/90 p-4 shadow-lg shadow-slate-200/50 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/85 dark:shadow-black/40"
                  aria-label="Điều khoản — điều hướng nhanh"
                >
                  <p className="mb-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Nội dung
                  </p>
                  <ul className="space-y-1">
                    {sections.map((s, i) => (
                      <li key={`d-${s.order}-${i}`}>
                        <button
                          type="button"
                          onClick={() => scrollToSection(i)}
                          className={`group flex w-full items-start gap-3 rounded-2xl px-3 py-2.5 text-left text-[13px] font-semibold leading-snug transition-all ${
                            activeIndex === i
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25"
                              : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                          }`}
                        >
                          <span
                            className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-black ${
                              activeIndex === i
                                ? "bg-white/20 text-white"
                                : "bg-slate-100 text-blue-700 dark:bg-slate-700 dark:text-blue-300"
                            }`}
                          >
                            {i + 1}
                          </span>
                          <span className="min-w-0 pt-0.5">{s.title}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              </aside>

              {/* ========== Sections + cards ========== */}
              <div className="min-w-0 space-y-8 sm:space-y-10">
                {sections.map((section, i) => (
                  <motion.article
                    key={`${section.order}-${i}`}
                    id={`terms-section-${i}`}
                    ref={(el) => {
                      sectionRefs.current[i] = el;
                    }}
                    initial={{ opacity: 0, y: 36 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{
                      duration: 0.5,
                      delay: Math.min(i * 0.05, 0.35),
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                    className="scroll-mt-[7rem] lg:scroll-mt-[7.25rem]"
                  >
                    <div className="overflow-hidden rounded-3xl border border-slate-200/95 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
                      <div className="flex items-start gap-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/90 via-white to-indigo-50/40 px-5 py-5 sm:px-7 sm:py-6 dark:border-slate-800 dark:from-blue-950/40 dark:via-slate-900 dark:to-indigo-950/30">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-inner ring-1 ring-blue-100 dark:bg-slate-800 dark:text-blue-300 dark:ring-slate-600">
                          <SectionIcon title={section.title} index={i} />
                        </span>
                        <div className="min-w-0 pt-0.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700/85 dark:text-blue-300">
                            Mục {i + 1}
                          </span>
                          <h2 className="mt-1 break-words text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                            {section.title}
                          </h2>
                        </div>
                      </div>
                      <div className="px-5 pb-7 pt-5 sm:px-8 sm:pb-10 sm:pt-7">
                        <div
                          className={`${proseTerms} text-[15px] text-slate-700 dark:text-slate-300`}
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(section.content || "", {
                              USE_PROFILES: { html: true },
                            }),
                          }}
                        />
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
