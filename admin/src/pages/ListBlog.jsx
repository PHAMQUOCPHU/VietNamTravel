import React, {
  useEffect,
  useState,
  useContext,
  useCallback,
} from "react";
import axios from "axios";
import { AdminContext } from "../context/AdminContext";
import { toast } from "react-toastify";
import { Trash2, Edit, Eye, Search, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getBlogPublicUrl } from "../config/publicSiteUrl";

const ListBlog = () => {
  const [blogs, setBlogs] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { backendUrl, aToken } = useContext(AdminContext);

  const normalizeImageUrl = (imageValue) => {
    if (!imageValue) return "https://placehold.co/600x400?text=No+Image";
    return String(imageValue).startsWith("http")
      ? imageValue
      : "https://placehold.co/600x400?text=No+Image";
  };

  const fetchBlogs = useCallback(
    async (signal) => {
      try {
        setLoading(true);
        const { data } = await axios.get(
          backendUrl + "/api/blog/admin/list-blogs",
          {
            headers: { aToken },
            params: {
              search: searchTerm.trim() || undefined,
              limit: 5000,
              page: 1,
            },
            signal,
          },
        );
        if (signal?.aborted) return;
        if (data.success) {
          const blogList = data.blogs || [];
          setBlogs(blogList);
          const fromRoot =
            typeof data.totalItems === "number" ? data.totalItems : null;
          const fromPag =
            typeof data.pagination?.totalItems === "number"
              ? data.pagination.totalItems
              : null;
          setTotalItems(fromRoot ?? fromPag ?? blogList.length);
        } else {
          toast.error(data.message);
        }
      } catch (err) {
        if (
          err.code === "ERR_CANCELED" ||
          err.name === "CanceledError" ||
          axios.isCancel?.(err)
        ) {
          return;
        }
        toast.error("Lỗi kết nối server");
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [backendUrl, aToken, searchTerm],
  );

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
    const ac = new AbortController();
    fetchBlogs(ac.signal);
    return () => ac.abort();
  }, [fetchBlogs]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="relative mb-6 max-w-md">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          type="text"
          placeholder="Tìm theo tiêu đề..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
          }}
          className="w-full rounded-2xl border border-gray-100 bg-white py-3 pl-12 pr-4 shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <p className="mb-4 text-sm font-medium text-gray-500">
        Tổng {totalItems} bài
      </p>

      <div className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold uppercase tracking-widest text-gray-500">
              <tr>
                <th className="px-8 py-5">Ảnh</th>
                <th className="px-6 py-5">Nội dung bài viết</th>
                <th className="px-6 py-5">Ngày tạo</th>
                <th className="px-8 py-5 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-16 text-center">
                    <Loader2 className="mx-auto mb-2 animate-spin text-blue-600" size={32} />
                    <span className="text-sm text-gray-400">Đang tải...</span>
                  </td>
                </tr>
              ) : blogs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-16 text-center text-gray-400">
                    Không có bài viết.
                  </td>
                </tr>
              ) : (
                blogs.map((item) => (
                  <tr
                    key={item._id}
                    className="group transition-colors hover:bg-blue-50/30"
                  >
                    <td className="px-8 py-4">
                      <div className="h-16 w-24 overflow-hidden rounded-xl border border-gray-100 bg-gray-100 shadow-sm">
                        <img
                          src={normalizeImageUrl(item.image)}
                          className="h-full w-full object-cover"
                          alt=""
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="mb-1 line-clamp-1 font-bold text-gray-800">
                        {item.title}
                      </p>
                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-blue-600">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-500">
                      {new Date(item.date).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-8 py-4">
                      <div className="relative z-50 flex justify-center gap-2">
                        <a
                          href={getBlogPublicUrl(item._id)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 text-gray-400 hover:text-blue-600"
                        >
                          <Eye size={19} />
                        </a>
                        <div
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              navigate(`/admin/edit-blog/${item._id}`);
                          }}
                          onClick={() => {
                            navigate(`/admin/edit-blog/${item._id}`);
                          }}
                          className="cursor-pointer rounded-xl bg-transparent p-2.5 text-gray-400 transition-colors hover:bg-orange-50 hover:text-orange-500"
                        >
                          <Edit size={19} />
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteBlog(item._id)}
                          className="p-2.5 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 size={19} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ListBlog;
