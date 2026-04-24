import { motion } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  Loader2,
  Search,
  FileText,
  EyeOff,
  MessageCircle,
  CalendarDays,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState, useContext, useCallback } from "react";
import axios from "axios";
import { AdminContext } from "../context/AdminContext";
import { toast } from "react-toastify";

const PostManagement = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const { backendUrl, aToken } = useContext(AdminContext);
  const normalizeImageUrl = (imageValue) => {
    if (!imageValue) return "https://placehold.co/600x400?text=No+Image";
    return String(imageValue).startsWith("http")
      ? imageValue
      : "https://placehold.co/600x400?text=No+Image";
  };

  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(backendUrl + "/api/blog/list-blogs", {
        params: { includeHidden: true, date: selectedDate || undefined },
      });
      if (data.success) {
        setBlogs(data.blogs);
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách bài viết");
    } finally {
      setLoading(false);
    }
  }, [backendUrl, selectedDate]);

  const toggleVisibility = async (post) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/blog/toggle-visibility",
        { id: post._id, isHidden: !post.isHidden },
        { headers: { aToken } },
      );
      if (data.success) {
        toast.success(data.message);
        fetchBlogs();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Khong the doi trang thai");
    }
  };

  const deleteBlog = async (id) => {
    if (window.confirm("Phú có chắc muốn xóa bài viết này không?")) {
      try {
        const { data } = await axios.post(
          backendUrl + "/api/blog/delete-blog",
          { id },
          { headers: { aToken } },
        );
        if (data.success) {
          toast.success("Đã xóa bài viết thành công");
          fetchBlogs();
        }
      } catch {
        toast.error("Lỗi khi xóa bài viết");
      }
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const filteredBlogs = blogs.filter((blog) =>
    blog.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getCategoryName = (category) => {
    if (category === "destination" || category === "Điểm đến") return "Điểm đến";
    if (category === "food" || category === "Ẩm thực") return "Ẩm thực";
    if (category === "guide" || category === "Cẩm nang" || category === "GUIDE") {
      return "Cẩm nang";
    }
    if (category === "itinerary" || category === "Lịch trình") return "Lịch trình";
    if (category === "saving" || category === "Tiết kiệm") return "Tiết kiệm";
    if (category === "review" || category === "Review") return "Review";
    return category;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <FileText className="text-blue-600" /> Quản lý Bài viết
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Tổng cộng:{" "}
            <span className="text-blue-600 font-bold">{blogs.length}</span> bài
            viết trên hệ thống
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/add-blog")}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-100 flex items-center gap-2 hover:bg-blue-700 transition-all active:scale-95 whitespace-nowrap"
        >
          <Plus size={20} /> Viết bài mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Tìm tiêu đề bài viết..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm transition-all"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <CalendarDays
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm transition-all font-semibold text-slate-600"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-100/50 border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Hình ảnh
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Nội dung bài viết
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Chuyên mục
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Chỉ số
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2
                        className="animate-spin text-blue-600"
                        size={40}
                      />
                      <p className="text-sm font-bold text-gray-400">
                        Đang tải dữ liệu...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredBlogs.length > 0 ? (
                filteredBlogs.map((post) => (
                  <tr
                    key={post._id}
                    className={`transition-colors group ${post.isHidden ? "bg-rose-50/70 hover:bg-rose-100/70" : "hover:bg-blue-50/30"}`}
                  >
                    <td className="px-8 py-4">
                      <div className="relative w-20 h-12 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                        <img
                          src={normalizeImageUrl(post.image)}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          alt=""
                        />
                        {post.isHidden && (
                          <span className="absolute inset-0 bg-slate-900/55 text-white text-[10px] font-black flex items-center justify-center tracking-wide">
                            DANG AN
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="max-w-md">
                        <div className="font-bold text-gray-800 leading-snug mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {post.title}
                        </div>
                        <div className="text-[11px] text-gray-400 flex items-center gap-3">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock size={12} />{" "}
                            {new Date(post.date).toLocaleDateString("vi-VN")}
                          </span>
                          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                          <span className="text-blue-500 font-bold uppercase tracking-tighter">
                            Admin Phú
                          </span>
                        </div>

                        {post.isHidden && (
                          <span className="inline-flex mt-2 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-wider">
                            BAI DANG AN
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className="inline-flex px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap">
                        {getCategoryName(post.category)}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                        <span className="inline-flex items-center gap-2">
                          <Eye size={13} className="text-emerald-500" />
                          {post.views || 0} lượt xem
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <MessageCircle size={13} className="text-indigo-500" />
                          {post.comments?.length || 0} bình luận
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <a
                          href={`http://localhost:5174/blog/${post._id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          title="Xem bài viết"
                        >
                          <Eye size={18} />
                        </a>

                        <button
                          onClick={() =>
                            navigate(`/admin/edit-blog/${post._id}`)
                          }
                          className="p-2.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                          title="Chỉnh sửa"
                        >
                          <Edit size={18} />
                        </button>

                        <button
                          onClick={() => deleteBlog(post._id)}
                          className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Xóa bài viết"
                        >
                          <Trash2 size={18} />
                        </button>

                        <button
                          onClick={() => toggleVisibility(post)}
                          className="p-2.5 text-gray-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                          title={post.isHidden ? "Hiện bài viết" : "Ẩn bài viết"}
                        >
                          <EyeOff size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="py-20 text-center text-gray-400 font-medium"
                  >
                    Không tìm thấy bài viết nào khớp với từ khóa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default PostManagement;
