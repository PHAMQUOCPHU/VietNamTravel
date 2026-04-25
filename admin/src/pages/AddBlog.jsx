import React, { useState, useContext, useEffect } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import {
  Save,
  Image as ImageIcon,
  FileText,
  Star,
  EyeOff,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import { AdminContext } from "../context/AdminContext";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AddBlog = () => {
  const { backendUrl, aToken } = useContext(AdminContext);
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("destination");
  const [image, setImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [content, setContent] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [publishDate, setPublishDate] = useState("");
  const [aiTopic, setAiTopic] = useState("");
  const [aiTone, setAiTone] = useState("thân thiện");
  const [aiKeywords, setAiKeywords] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOfflineMode, setAiOfflineMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("aiOfflineMode") === "true";
  });

  // Cleanup image preview URL to prevent memory leak
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ color: [] }, { background: [] }],
      ["link", "image"],
      ["clean"],
    ],
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!image) {
        return toast.error("Vui lòng tải lên ảnh đại diện!");
      }

      const formData = new FormData();
      formData.append("title", title);
      formData.append("excerpt", excerpt);
      formData.append("content", content);
      formData.append("category", category);
      formData.append("isFeatured", isFeatured);
      formData.append("isHidden", isHidden);
      formData.append("publishDate", publishDate);
      formData.append("image", image);

      const { data } = await axios.post(
        backendUrl + "/api/blog/add-blog",
        formData,
        { headers: { atoken: aToken } },
      );

      if (data.success) {
        toast.success(data.message);

        setTimeout(() => {
          navigate("/admin/posts");
        }, 1500);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  const handleGenerateAI = async () => {
    if (!aiTopic.trim()) {
      return toast.error("Vui long nhap chu de cho AI");
    }
    try {
      setAiLoading(true);
      const { data } = await axios.post(
        backendUrl + "/api/blog/generate-ai",
        {
          topic: aiTopic,
          category,
          tone: aiTone,
          keywords: aiKeywords,
          length: "vua",
          offlineMode: aiOfflineMode,
        },
        { headers: { atoken: aToken } },
      );

      if (data.success) {
        setTitle(data.data.title || "");
        setExcerpt(data.data.excerpt || "");
        setContent(data.data.contentHtml || "");
        toast.success(
          data.source === "offline-demo"
            ? "Offline demo mode: da tao ban nhap local"
            : "AI da tao noi dung nhap",
        );
      } else {
        toast.error(data.message || "Khong tao duoc noi dung AI");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Loi ket noi AI");
    } finally {
      setAiLoading(false);
    }
  };

  const handleToggleOfflineMode = (checked) => {
    setAiOfflineMode(checked);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("aiOfflineMode", String(checked));
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Viết bài mới</h2>
          <p className="text-sm text-gray-500 font-medium">
            Sáng tạo nội dung cho cẩm nang du lịch
          </p>
        </div>
        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
        >
          <Save size={20} /> Lưu bài viết
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-blue-100 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="text-blue-600" size={18} />
          <h3 className="font-black text-slate-800">AI Viết bài giúp</h3>
        </div>
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
          <div>
            <p className="text-sm font-bold text-slate-800">
              Offline demo mode
            </p>
            <p className="text-xs text-slate-600">Offline</p>
          </div>
          <label className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
            <input
              type="checkbox"
              checked={aiOfflineMode}
              onChange={(e) => handleToggleOfflineMode(e.target.checked)}
              className="opacity-0 w-0 h-0"
            />
            <span
              className={`absolute cursor-pointer inset-0 rounded-full transition-all duration-300 ${aiOfflineMode ? "bg-blue-600" : "bg-gray-300"}`}
            >
              <span
                className={`absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${aiOfflineMode ? "translate-x-6" : ""}`}
              ></span>
            </span>
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            value={aiTopic}
            onChange={(e) => setAiTopic(e.target.value)}
            placeholder="Chủ đề bài viết..."
            className="md:col-span-2 px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={aiKeywords}
            onChange={(e) => setAiKeywords(e.target.value)}
            placeholder="Từ khóa: biển, ẩm thực..."
            className="px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={aiTone}
            onChange={(e) => setAiTone(e.target.value)}
            className="px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="thân thiện">Thân thiện</option>
            <option value="chuyên nghiệp">Chuyên nghiệp</option>
            <option value="trẻ trung">Trẻ trung</option>
          </select>
        </div>
        <button
          type="button"
          onClick={handleGenerateAI}
          disabled={aiLoading}
          className="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-60 inline-flex items-center gap-2"
        >
          <Sparkles size={16} />
          {aiLoading ? "AI dang viet..." : "Tao noi dung voi AI"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
              <FileText size={16} className="text-blue-500" /> Tiêu đề bài viết
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: 10 món ngon không thể bỏ qua tại Hội An..."
              className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-lg font-bold text-gray-800"
            />
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Mô tả ngắn (Hiển thị ở trang danh sách)
            </label>
            <textarea
              rows="3"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Tóm tắt ngắn gọn nội dung bài viết trong khoảng 2 câu..."
              className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm text-gray-600 resize-none"
            />
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Nội dung chi tiết
            </label>
            <div className="mb-14">
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={modules}
                style={{ height: "350px" }}
                placeholder="Bắt đầu kể câu chuyện du lịch của bạn..."
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <label className="block text-sm font-bold text-gray-700 mb-4">
              Ảnh đại diện bài viết
            </label>
            <label htmlFor="blog-image" className="cursor-pointer block">
              <div className="border-2 border-dashed border-gray-200 rounded-3xl h-52 flex flex-col items-center justify-center hover:bg-gray-50 transition-all overflow-hidden bg-gray-50/50">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <div className="p-4 bg-white rounded-2xl shadow-sm mb-3 text-blue-500">
                      <ImageIcon size={32} />
                    </div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                      Tải ảnh lên
                    </p>
                  </>
                )}
              </div>
              <input
                type="file"
                id="blog-image"
                hidden
                onChange={(e) => {
                  const file = e.target.files[0];
                  setImage(file);
                  if (imagePreview) URL.revokeObjectURL(imagePreview);
                  setImagePreview(file ? URL.createObjectURL(file) : null);
                }}
              />
            </label>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Chuyên mục
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700 appearance-none"
            >
              <option value="Điểm đến">Điểm đến</option>
              <option value="Ẩm thực">Ẩm thực</option>
              <option value="Cẩm nang">Cẩm nang</option>
              <option value="Lịch trình">Lịch trình</option>
              <option value="Tiết kiệm">Tiết kiệm</option>
              <option value="Review">Review</option>
            </select>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
              <CalendarDays size={16} className="text-blue-500" /> Ngày đăng
            </label>
            <input
              type="date"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
            />
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg transition-colors ${isFeatured ? "bg-yellow-100 text-yellow-600" : "bg-gray-100 text-gray-400"}`}
                >
                  <Star size={18} fill={isFeatured ? "currentColor" : "none"} />
                </div>
                <span className="text-sm font-bold text-gray-700">
                  Bài viết nổi bật
                </span>
              </div>
              <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="opacity-0 w-0 h-0"
                />
                <span
                  className={`absolute cursor-pointer inset-0 rounded-full transition-all duration-300 ${isFeatured ? "bg-blue-600" : "bg-gray-200"}`}
                >
                  <span
                    className={`absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${isFeatured ? "translate-x-6" : ""}`}
                  ></span>
                </span>
              </div>
            </label>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg transition-colors ${isHidden ? "bg-slate-200 text-slate-700" : "bg-gray-100 text-gray-400"}`}
                >
                  <EyeOff size={18} />
                </div>
                <span className="text-sm font-bold text-gray-700">
                  Ẩn bài viết
                </span>
              </div>
              <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                <input
                  type="checkbox"
                  checked={isHidden}
                  onChange={(e) => setIsHidden(e.target.checked)}
                  className="opacity-0 w-0 h-0"
                />
                <span
                  className={`absolute cursor-pointer inset-0 rounded-full transition-all duration-300 ${isHidden ? "bg-slate-700" : "bg-gray-200"}`}
                >
                  <span
                    className={`absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${isHidden ? "translate-x-6" : ""}`}
                  ></span>
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddBlog;
