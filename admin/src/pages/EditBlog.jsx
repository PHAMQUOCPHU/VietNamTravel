import React, { useEffect, useState, useContext, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { AdminContext } from "../context/AdminContext";
import {
  Save,
  ArrowLeft,
  Loader2,
  Image as ImageIcon,
  FileText,
  Star,
  CalendarDays,
  EyeOff,
} from "lucide-react";

const EditBlog = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { backendUrl, aToken } = useContext(AdminContext);
  const normalizeImageUrl = (imageValue) => {
    if (!imageValue) return "";
    return String(imageValue).startsWith("http") ? imageValue : "";
  };

  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("Điểm đến");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [oldImage, setOldImage] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [publishDate, setPublishDate] = useState("");

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

  const fetchBlogData = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/blog/list-blogs`);
      if (data.success) {
        const blog = data.blogs.find((item) => item._id === id);
        if (blog) {
          setTitle(blog.title || "");
          setExcerpt(blog.excerpt || "");

          const catMap = {
            destination: "Điểm đến",
            food: "Ẩm thực",
            guide: "Cẩm nang",
            itinerary: "Lịch trình",
            saving: "Tiết kiệm",
            review: "Review",
          };
          setCategory(catMap[blog.category] || blog.category);

          setContent(blog.content || "");
          setOldImage(blog.image || "");
          setIsFeatured(blog.isFeatured || false);
          setIsHidden(blog.isHidden || false);
          setPublishDate(new Date(blog.date).toISOString().split("T")[0]);
        }
      }
    } catch {
      toast.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [id, backendUrl]);

  useEffect(() => {
    if (id) fetchBlogData();
  }, [id, fetchBlogData]);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("excerpt", excerpt);

      const catMapRev = {
        "Điểm đến": "destination",
        "Ẩm thực": "food",
        "Cẩm nang": "guide",
        "Lịch trình": "itinerary",
        "Tiết kiệm": "saving",
        Review: "review",
      };
      formData.append("category", catMapRev[category] || category);

      formData.append("content", content);
      formData.append("isFeatured", isFeatured);
      formData.append("isHidden", isHidden);
      formData.append("publishDate", publishDate);

      if (image) formData.append("image", image);

      const { data } = await axios.post(
        `${backendUrl}/api/blog/update-blog/${id}`,
        formData,
        { headers: { aToken } },
      );

      if (data.success) {
        toast.success("Cập nhật bài viết thành công!");
        navigate("/admin/posts");
      }
    } catch {
      toast.error("Lỗi khi lưu bài viết");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 hover:text-blue-600 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Chỉnh sửa bài viết
            </h2>
            <p className="text-sm text-gray-500 font-medium">ID: {id}</p>
          </div>
        </div>
        <button
          onClick={onSubmitHandler}
          className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
        >
          <Save size={20} /> Lưu thay đổi
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
              className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-lg font-bold text-gray-800"
            />
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Mô tả ngắn
            </label>
            <textarea
              rows="3"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-600 resize-none"
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
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <label className="block text-sm font-bold text-gray-700 mb-4">
              Ảnh đại diện
            </label>
            <label htmlFor="blog-image" className="cursor-pointer block">
              <div className="border-2 border-dashed border-gray-200 rounded-3xl h-52 flex flex-col items-center justify-center hover:bg-gray-50 transition-all overflow-hidden bg-gray-50/50">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="New"
                    className="w-full h-full object-cover"
                  />
                ) : oldImage ? (
                  <img
                    src={normalizeImageUrl(oldImage)}
                    alt="Current"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon size={32} className="text-gray-300" />
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
              <div className="relative inline-block w-12 h-6">
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
              <div className="relative inline-block w-12 h-6">
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

export default EditBlog;
