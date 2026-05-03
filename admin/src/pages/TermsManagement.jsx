import { useCallback, useContext, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import axios from "axios";
import { toast } from "react-toastify";
import {
  ChevronDown,
  FileText,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { AdminContext } from "../context/AdminContext";
import { adminHeaders } from "../lib/adminHeaders";

/** Đồng bộ với backend (bản khởi tạo 6 mục mẫu) */
const DEFAULT_SECTION_TITLES = [
  "Thông tin chung & Xác nhận",
  "Quy định Thanh toán (MoMo)",
  "Chính sách Hủy tour & Hoàn tiền",
  "Bảo mật & Dữ liệu (Cloudinary/AI)",
  "Trách nhiệm khách hàng",
  "Thay đổi điều khoản",
];

const MIN_SECTIONS = 1;
const MAX_SECTIONS = 40;

function buildLocalDefaultSections() {
  return DEFAULT_SECTION_TITLES.map((title, order) => ({
    title,
    content: `<p>Nội dung <strong>${title}</strong>. Vui lòng cập nhật chi tiết phù hợp trong Admin.</p>`,
    order,
  }));
}

/** Map dữ liệu API → state; DB rỗng thì fallback 6 mục mẫu */
function normalizeFromRemote(remote) {
  const src = Array.isArray(remote) ? remote : [];
  if (src.length === 0) return buildLocalDefaultSections();
  return src.map((r, order) => ({
    title:
      typeof r?.title === "string" && r.title.trim()
        ? r.title.trim()
        : `Mục ${order + 1}`,
    content:
      typeof r?.content === "string" && r.content.length > 0
        ? r.content
        : `<p>Nội dung mục ${order + 1}.</p>`,
    order,
  }));
}

/** Gán lại order 0..n-1 */
function reindex(sections) {
  return sections.map((s, order) => ({ ...s, order }));
}

const quillFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "list",
  "bullet",
  "indent",
  "align",
  "color",
  "background",
  "link",
];

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [
      { list: "ordered" },
      { list: "bullet" },
      { indent: "-1" },
      { indent: "+1" },
    ],
    [{ align: [] }],
    [{ color: [] }, { background: [] }],
    ["link"],
    ["clean"],
  ],
};

function formatDate(v) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

/** Chỉ mount khi mục đang mở */
function ActiveSectionEditor({ index, section, onUpdateTitle, onUpdateContent }) {
  return (
    <div className="space-y-4 px-5 pb-5 sm:px-6 sm:pb-6 pt-1 border-t border-gray-100">
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          Tiêu đề
        </label>
        <input
          type="text"
          value={section.title}
          onChange={(e) => onUpdateTitle(index, e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-800"
        />
      </div>
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          Nội dung
        </label>
        <div className="terms-quill rounded-xl border border-gray-100 overflow-hidden bg-white">
          <ReactQuill
            theme="snow"
            value={section.content || ""}
            onChange={(html) => onUpdateContent(index, html)}
            modules={quillModules}
            formats={quillFormats}
          />
        </div>
      </div>
    </div>
  );
}

const TermsManagement = () => {
  const { backendUrl, aToken } = useContext(AdminContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState(() => normalizeFromRemote([]));
  const [lastUpdated, setLastUpdated] = useState(null);
  const [apiOk, setApiOk] = useState(true);
  const [activeSection, setActiveSection] = useState(null);

  const fetchTerms = useCallback(async () => {
    setLoading(true);
    setApiOk(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/terms`, {
        timeout: 20000,
      });
      if (data?.success && data?.terms) {
        setSections(normalizeFromRemote(data.terms.sections));
        setLastUpdated(data.terms.lastUpdated || data.terms.updatedAt);
      } else {
        setSections(normalizeFromRemote([]));
        setApiOk(false);
        toast.warning(
          data?.message ||
            "Không tải được điều khoản từ máy chủ — hiển thị bản mẫu.",
        );
      }
    } catch (e) {
      setSections(normalizeFromRemote([]));
      setApiOk(false);
      toast.warning(
        e.response?.data?.message ||
          e.message ||
          "Lỗi kết nối — đang dùng dữ liệu mẫu. Hãy bật backend và làm mới.",
      );
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    fetchTerms();
  }, [fetchTerms]);

  const updateSectionTitle = useCallback((index, value) => {
    setSections((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], title: value };
      return next;
    });
  }, []);

  const updateSectionContent = useCallback((index, html) => {
    setSections((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], content: html };
      return next;
    });
  }, []);

  const handleAddSection = () => {
    if (sections.length >= MAX_SECTIONS) {
      toast.error(`Tối đa ${MAX_SECTIONS} mục.`);
      return;
    }
    setSections((prev) =>
      reindex([
        ...prev,
        {
          title: `Mục ${prev.length + 1}`,
          content: `<p>Nhập nội dung mục ${prev.length + 1}…</p>`,
          order: prev.length,
        },
      ]),
    );
    toast.info("Đã thêm mục mới — nhớ nhấn Lưu để ghi vào máy chủ.");
    setActiveSection(null);
  };

  const handleDeleteSection = (index) => {
    if (sections.length <= MIN_SECTIONS) {
      toast.error("Phải giữ ít nhất một mục điều khoản.");
      return;
    }
    const title = sections[index]?.title || `Mục ${index + 1}`;
    if (
      !window.confirm(
        `Xóa mục «${title.length > 60 ? `${title.slice(0, 60)}…` : title}»?`,
      )
    )
      return;

    setSections((prev) => reindex(prev.filter((_, i) => i !== index)));
    setActiveSection((prev) => {
      if (prev === null) return null;
      if (prev === index) return null;
      if (prev > index) return prev - 1;
      return prev;
    });
    toast.info("Đã xóa mục trong bản nháp — nhấn Lưu để đồng bộ máy chủ.");
  };

  const handleCardActivate = (index) => {
    setActiveSection((prev) => (prev === index ? null : index));
  };

  const handleSaveAll = async () => {
    if (saving) return;
    if (sections.length < MIN_SECTIONS || sections.length > MAX_SECTIONS) {
      toast.error(
        `Cần từ ${MIN_SECTIONS} đến ${MAX_SECTIONS} mục trước khi lưu.`,
      );
      return;
    }
    const payload = reindex(sections).map((s, order) => ({
      title: typeof s.title === "string" ? s.title.trim() : "",
      content: typeof s.content === "string" ? s.content : "",
      order,
    }));
    const emptyTitle = payload.findIndex((s) => !s.title);
    if (emptyTitle !== -1) {
      toast.error(`Mục ${emptyTitle + 1} đang thiếu tiêu đề.`);
      return;
    }

    setSaving(true);
    try {
      const { data } = await axios.put(
        `${backendUrl}/api/terms`,
        { sections: payload },
        { headers: adminHeaders(aToken), timeout: 45000 },
      );
      if (data.success) {
        toast.success("Đã cập nhật điều khoản thành công!");
        setSections(normalizeFromRemote(data.terms?.sections ?? []));
        setLastUpdated(data.terms?.lastUpdated || data.terms?.updatedAt);
        setApiOk(true);
      } else {
        toast.error(data.message || "Lưu thất bại");
      }
    } catch (e) {
      toast.error(
        e.response?.data?.message ||
          e.message ||
          "Lỗi khi lưu điều khoản (token hết hạn hoặc máy chủ lỗi).",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500 gap-2">
        <Loader2 className="animate-spin" size={22} />
        <span className="font-medium">Đang tải điều khoản…</span>
      </div>
    );
  }

  const canSave =
    sections.length >= MIN_SECTIONS &&
    sections.length <= MAX_SECTIONS &&
    !saving;
  const canAddMore = sections.length < MAX_SECTIONS;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl pb-10"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="text-blue-600 shrink-0" size={26} />
            Quản lý Điều khoản dịch vụ
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            {sections.length} mục · Cập nhật lần cuối:{" "}
            <span className="text-gray-700">{formatDate(lastUpdated)}</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Chạm vào một mục để chỉnh sửa; chỉ một mục mở tại một thời điểm.
          </p>
          {!apiOk ? (
            <p className="text-xs font-semibold text-amber-700 mt-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 inline-block">
              Backend chưa kết nối — có thể thêm/xóa mục và chỉnh sửa cục bộ;
              nhấn Lưu khi máy chủ hoạt động và đã đăng nhập admin.
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleAddSection}
          disabled={!canAddMore}
          className={`
            inline-flex shrink-0 items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border shadow-sm transition-colors
            ${
              canAddMore
                ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
                : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
            }
          `}
        >
          <Plus size={17} strokeWidth={2.5} aria-hidden />
          Thêm mục mới
        </button>
      </div>

      <div className="space-y-3">
        {sections.map((section, index) => {
          const open = activeSection === index;
          const canDelete = sections.length > MIN_SECTIONS;
          return (
            <div
              key={`section-${index}`}
              className={`
                rounded-2xl border bg-white shadow-md shadow-gray-100/70 overflow-hidden transition-shadow duration-200
                ${open ? "border-blue-200 ring-1 ring-blue-100 shadow-blue-50/80" : "border-gray-100 hover:border-blue-100/80 hover:shadow-lg"}
              `}
            >
              <div className="flex items-stretch gap-0">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => handleCardActivate(index)}
                  className="min-w-0 flex-1 flex items-center gap-3 sm:gap-4 px-4 py-4 sm:px-5 sm:py-4 text-left transition-colors hover:bg-blue-50/40"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-[13px] font-black text-white shadow-sm">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 font-bold text-[15px] text-gray-800 leading-snug line-clamp-2">
                    {index + 1}. {section.title || `Mục ${index + 1}`}
                  </span>
                  <motion.span
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                    className="text-blue-600 shrink-0"
                  >
                    <ChevronDown size={22} strokeWidth={2.25} />
                  </motion.span>
                </button>

                <div className="flex items-center pr-3 sm:pr-4 border-l border-gray-100 bg-gray-50/30">
                  <button
                    type="button"
                    aria-label={`Xóa mục ${index + 1}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteSection(index);
                    }}
                    disabled={!canDelete}
                    title={
                      canDelete
                        ? "Xóa mục"
                        : "Phải giữ ít nhất một mục"
                    }
                    className={`
                      p-2.5 rounded-xl transition-colors
                      ${
                        canDelete
                          ? "text-gray-400 hover:text-red-600 hover:bg-red-50"
                          : "text-gray-200 cursor-not-allowed"
                      }
                    `}
                  >
                    <Trash2 size={19} strokeWidth={2} />
                  </button>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {open ? (
                  <motion.div
                    key="panel"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{
                      duration: 0.3,
                      ease: [0.4, 0, 0.2, 1],
                      opacity: { duration: 0.2 },
                    }}
                    className="overflow-hidden border-t border-gray-50"
                  >
                    <ActiveSectionEditor
                      index={index}
                      section={section}
                      onUpdateTitle={updateSectionTitle}
                      onUpdateContent={updateSectionContent}
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-end">
        <p className="text-xs text-gray-400 font-medium order-2 w-full text-center sm:order-1 sm:mr-auto sm:w-auto sm:text-left">
          Lưu toàn bộ các mục hiện có ({sections.length}/{MAX_SECTIONS})
        </p>
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={!canSave}
          className={`
            order-1 sm:order-2 inline-flex shrink-0 items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold
            shadow-sm border transition-colors active:scale-[0.98]
            ${
              !canSave
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700"
            }
          `}
        >
          {saving ? (
            <>
              <Loader2 className="animate-spin" size={17} aria-hidden />
              Đang lưu…
            </>
          ) : (
            <>
              <Save size={17} strokeWidth={2.25} aria-hidden />
              Lưu tất cả thay đổi
            </>
          )}
        </button>
      </div>

      <style>{`
        .terms-quill .ql-toolbar.ql-snow {
          border-color: rgb(243 244 246);
          border-radius: 0.75rem 0.75rem 0 0;
          background: rgb(249 250 251);
        }
        .terms-quill .ql-container.ql-snow {
          border-color: rgb(243 244 246);
          border-radius: 0 0 0.75rem 0.75rem;
        }
        .terms-quill .ql-container {
          min-height: 220px;
          font-size: 15px;
        }
        .terms-quill .ql-editor {
          min-height: 220px;
        }
      `}</style>
    </motion.div>
  );
};

export default TermsManagement;
