import React, { useEffect, useState, useContext, useCallback } from "react";
import axios from "axios";
import { AdminContext } from "../context/AdminContext";
import { toast } from "react-toastify";
import { Trash2, Edit, Eye, Search, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ListBlog = () => {
  const [blogs, setBlogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
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
      const { data } = await axios.get(backendUrl + "/api/blog/list-blogs");
      if (data.success) {
        setBlogs(data.blogs.reverse());
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  // Xóa bài viết
  const deleteBlog = async (id) => {
    if (window.confirm("Phú có chắc chắn muốn xóa bài viết này không?")) {
      try {
        const { data } = await axios.post(
          backendUrl + "/api/blog/delete-blog",
          { id },
          { headers: { aToken } },
        );

        if (data.success) {
          toast.success(data.message);
          fetchBlogs();
        } else {
          toast.error(data.message);
        }
      } catch {
        toast.error("Lỗi hệ thống khi xóa");
      }
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const filteredBlogs = blogs.filter((blog) =>
    blog.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="relative max-w-md mb-6">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          type="text"
          placeholder="Tìm theo tiêu đề..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
        />
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-gray-500 uppercase text-[11px] font-bold tracking-widest border-b border-gray-100">
              <tr>
                <th className="px-8 py-5">Ảnh</th>
                <th className="px-6 py-5">Nội dung bài viết</th>
                <th className="px-6 py-5">Ngày tạo</th>
                <th className="px-8 py-5 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!loading &&
                filteredBlogs.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-blue-50/30 transition-colors group"
                  >
                    <td className="px-8 py-4">
                      <div className="w-24 h-16 rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-gray-100">
                        <img
                          src={normalizeImageUrl(item.image)}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-800 line-clamp-1 mb-1">
                        {item.title}
                      </p>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-extrabold uppercase">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                      {new Date(item.date).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex justify-center gap-2 relative z-50">
                        {/* Nút Xem */}
                        <a
                          href={`${import.meta.env.VITE_FRONTEND_URL || window.location.origin}/blog/${item._id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 text-gray-400 hover:text-blue-600"
                        >
                          <Eye size={19} />
                        </a>

                        {/* NÚT SỬA: Dùng div bao quanh để tăng diện tích click */}
                        <div
                          onClick={() => {
                            console.log("CLICKED EDIT:", item._id);
                            navigate(`/admin/edit-blog/${item._id}`);
                          }}
                          className="p-2.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all cursor-pointer bg-transparent"
                        >
                          <Edit size={19} />
                        </div>

                        {/* Nút Xóa */}
                        <button
                          onClick={() => deleteBlog(item._id)}
                          className="p-2.5 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 size={19} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ListBlog;
