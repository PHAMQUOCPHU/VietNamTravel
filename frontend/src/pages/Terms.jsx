import {
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import { Link } from "react-router-dom";
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
  ScrollText,
  Cloud,
  ChevronDown,
  Info,
  UserCheck,
  Copyright,
  AlertTriangle,
  CircleX,
} from "lucide-react";
import { AppContext } from "../context/AppContext";
import { resolveSiteLogoSrc } from "../utils/siteLogo";
import { getTerms } from "../services";

const COMPANY_NAME = "VietNam Travel";
/** Navbar h-16 sm:h-20 + khoảng đệm */
const SCROLL_MARGIN_TOP = "7.5rem";

/** Chọn icon theo tiêu đề (fallback theo chỉ số) — palette teal #115e59 */
function SectionIcon({ title, index }) {
  const Icon = useMemo(() => {
    const t = (title || "").toLowerCase();
    if (t.includes("giới thiệu") || t.includes("thông tin chung"))
      return Info;
    if (
      t.includes("điều kiện") ||
      t.includes("sử dụng") ||
      t.includes("đăng ký")
    )
      return UserCheck;
    if (
      t.includes("sở hữu") ||
      t.includes("bản quyền") ||
      t.includes("trí tuệ")
    )
      return Copyright;
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
    if (t.includes("trách nhiệm") || t.includes("giới hạn"))
      return AlertTriangle;
    if (t.includes("chấm dứt") || t.includes("hủy dịch vụ")) return CircleX;
    if (t.includes("thay đổi") || t.includes("sửa đổi")) return RefreshCw;
    if (
      t.includes("thông tin") ||
      t.includes("xác nhận") ||
      t.includes("quyền") ||
      t.includes("nghĩa vụ")
    )
      return Scale;
    if (t.includes("điều khoản") || t.includes("pháp lý") || t.includes("khác"))
      return FileText;
    if (t.includes("cloud") || t.includes("ai")) return Cloud;
    const fallbacks = [FileText, ClipboardList, ScrollText];
    return fallbacks[index % fallbacks.length];
  }, [title, index]);

  return (
    <Icon
      size={16}
      strokeWidth={2}
      className="shrink-0 text-[#115e59]"
      aria-hidden
    />
  );
}

const proseInCard =
  "prose prose-stone prose-sm max-w-none min-w-0 leading-relaxed " +
  "prose-p:text-stone-600 prose-p:leading-relaxed prose-li:text-stone-600 " +
  "prose-headings:text-stone-900 prose-strong:text-stone-800 " +
  "prose-a:text-teal-800 prose-a:no-underline hover:prose-a:underline " +
  "prose-ul:list-none prose-ul:space-y-2 prose-ul:pl-0 " +
  "[&_p]:break-words [&_li]:break-words [&_*]:max-w-full";

export default function Terms() {
  const { backendUrl, siteConfig } = useContext(AppContext);
  const siteLogoSrc = resolveSiteLogoSrc(siteConfig?.logoUrl);
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
        const data = await getTerms({ backendUrl });
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

  const formatDateHeader = useCallback((v) => {
    if (!v) return "—";
    try {
      return new Date(v).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "";
    }
  }, []);

  const scrollToSection = useCallback((index) => {
    const el = sectionRefs.current[index];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileNavOpen(false);
  }, []);

  useEffect(() => {
    if (sections.length === 0) return undefined;

    const updateActive = () => {
      let next = 0;
      const refY = 140;
      sectionRefs.current.forEach((node, idx) => {
        if (!node) return;
        const rect = node.getBoundingClientRect();
        if (rect.top <= refY) next = idx;
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
    <div className="terms-hero-pattern font-terms w-full min-w-0 overflow-x-hidden text-stone-800 dark:bg-stone-950 dark:text-stone-100">
      {/* Header bar — giống mẫu Canva (sticky dưới Navbar cố định) */}
      <header className="sticky top-16 z-40 w-full border-b border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-950 sm:top-20">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img
              src={siteLogoSrc}
              alt={COMPANY_NAME}
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-sky-100 border border-sky-100/80 dark:border-slate-700 dark:ring-slate-700"
            />
            <span className="bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-lg font-extrabold tracking-tight text-transparent">
              {COMPANY_NAME}
            </span>
          </div>
          <span className="text-xs text-stone-400">
            Cập nhật: {formatDateHeader(lastUpdated)}
          </span>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center gap-2 py-24 text-stone-500">
          <Loader2 className="animate-spin" size={24} aria-hidden />
          <span className="font-medium">Đang tải điều khoản…</span>
        </div>
      ) : sections.length === 0 ? (
        <p className="py-20 text-center text-stone-500">
          Chưa có nội dung điều khoản. Vui lòng quay lại sau.
        </p>
      ) : (
        <>
          {/* Hero */}
          <section className="mx-auto w-full max-w-5xl px-6 pb-10 pt-16 md:pt-20">
            <h1 className="font-terms-display text-4xl font-bold leading-tight text-stone-900 dark:text-white md:text-5xl">
              Điều khoản Dịch vụ
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-stone-500 dark:text-stone-400">
              Vui lòng đọc kỹ các điều khoản dưới đây trước khi sử dụng dịch vụ
              của chúng tôi. Bằng việc truy cập và sử dụng, bạn đồng ý tuân thủ
              các điều khoản này.
            </p>
          </section>

          {/* Mobile TOC */}
          <div className="sticky top-[7.25rem] z-30 border-b border-stone-200 bg-white/95 px-4 py-2.5 backdrop-blur-md dark:border-stone-700 dark:bg-stone-950/95 sm:top-[8.25rem] lg:hidden">
            <div className="relative mx-auto max-w-5xl">
              <button
                type="button"
                aria-expanded={mobileNavOpen}
                onClick={() => setMobileNavOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 text-left text-sm font-semibold text-stone-800 shadow-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
              >
                <span className="line-clamp-2 min-w-0">
                  <span className="text-xs font-semibold uppercase tracking-wide text-teal-800 dark:text-teal-300">
                    Mục {activeIndex + 1}
                  </span>
                  <br />
                  <span>{sections[activeIndex]?.title}</span>
                </span>
                <ChevronDown
                  size={22}
                  className={`shrink-0 text-stone-500 transition-transform ${mobileNavOpen ? "rotate-180" : ""}`}
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
                    className="absolute left-0 right-0 mt-2 max-h-[min(52vh,320px)] overflow-y-auto rounded-xl border border-stone-200 bg-white p-2 shadow-xl dark:border-stone-600 dark:bg-stone-900"
                    role="listbox"
                  >
                    {sections.map((s, i) => (
                      <li key={`m-${s.order}-${i}`}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={activeIndex === i}
                          onClick={() => scrollToSection(i)}
                          className={`flex w-full gap-3 rounded-lg px-3 py-3 text-left text-sm transition-colors ${
                            activeIndex === i
                              ? "bg-teal-50 font-semibold text-teal-900 dark:bg-teal-950/50 dark:text-teal-100"
                              : "text-stone-700 hover:bg-stone-50 dark:text-stone-200 dark:hover:bg-stone-800"
                          }`}
                        >
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-800/10 text-[12px] font-bold text-teal-800 dark:bg-teal-500/20 dark:text-teal-200">
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

          <div className="mx-auto w-full max-w-5xl px-6 pb-20">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
              {/* Desktop TOC */}
              <aside className="hidden lg:block">
                <nav
                  className="sticky top-36"
                  aria-label="Mục lục điều khoản"
                >
                  <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-stone-400">
                    Mục lục
                  </p>
                  <ul className="space-y-2 text-sm">
                    {sections.map((s, i) => (
                      <li key={`toc-${s.order}-${i}`}>
                        <a
                          href={`#terms-section-${i}`}
                          onClick={(e) => {
                            e.preventDefault();
                            scrollToSection(i);
                          }}
                          className={`terms-toc-link block border-l-2 py-1 pl-3 ${
                            activeIndex === i
                              ? "border-teal-800 font-medium text-teal-800 dark:border-teal-400 dark:text-teal-300"
                              : "border-transparent text-stone-600 hover:border-teal-800 hover:text-teal-800 dark:text-stone-400 dark:hover:text-teal-300"
                          }`}
                        >
                          {i + 1}. {s.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </aside>

              <main className="space-y-6">
                {sections.map((section, i) => (
                  <article
                    key={`${section.order}-${i}`}
                    id={`terms-section-${i}`}
                    ref={(el) => {
                      sectionRefs.current[i] = el;
                    }}
                    style={{ scrollMarginTop: SCROLL_MARGIN_TOP }}
                    className="terms-section-card rounded-2xl border border-stone-100 bg-white p-8 dark:border-stone-700 dark:bg-stone-900"
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950/40">
                        <SectionIcon title={section.title} index={i} />
                      </div>
                      <h2 className="text-lg font-bold text-stone-900 dark:text-white">
                        {i + 1}. {section.title}
                      </h2>
                    </div>
                    <div
                      className={`${proseInCard} dark:prose-invert`}
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(section.content || "", {
                          USE_PROFILES: { html: true },
                        }),
                      }}
                    />
                  </article>
                ))}
              </main>
            </div>
          </div>

          {/* Footer trong trang */}
          <footer className="w-full border-t border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-950">
            <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 py-6 sm:flex-row">
              <p className="flex items-center gap-2 text-xs text-stone-400">
                <img
                  src={siteLogoSrc}
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-6 shrink-0 rounded-md object-cover opacity-90 ring-1 ring-stone-200 dark:ring-stone-700"
                />
                <span>
                  © {new Date().getFullYear()} {COMPANY_NAME}. Tất cả quyền được bảo
                  lưu.
                </span>
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-stone-400">
                <Link
                  to="/about"
                  className="transition-colors hover:text-teal-800 dark:hover:text-teal-400"
                >
                  Liên hệ
                </Link>
                <span className="hidden sm:inline text-stone-300">·</span>
                <Link
                  to="/blogs"
                  className="transition-colors hover:text-teal-800 dark:hover:text-teal-400"
                >
                  Blog
                </Link>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
