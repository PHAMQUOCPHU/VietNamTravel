import React, { useState, useMemo } from "react";
import { useBlogs } from "../hooks/useBlogs";
import BlogCard from "../components/BlogCard";
import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Inbox,
  CalendarDays,
  X,
} from "lucide-react";

const categories = [
  { id: "all", name: "Tất cả" },
  { id: "destination", name: "Điểm đến" },
  { id: "food", name: "Ẩm thực" },
  { id: "guide", name: "Cẩm nang" },
  { id: "itinerary", name: "Lịch trình" },
  { id: "review", name: "Review" },
  { id: "saving", name: "Tiết kiệm" },
];

const Blogs = () => {
  const [selectedCat, setSelectedCat] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6;

  const { blogs, loading } = useBlogs({
    category: selectedCat,
    date: selectedDate,
  });

  const filteredBlogs = useMemo(() => {
    return blogs.filter((blog) =>
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [blogs, searchTerm]);

  // Tính toán phân trang
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredBlogs.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredBlogs.length / postsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    const element = document.getElementById("blog-list-start");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-600 pt-32 pb-24 px-4 text-center rounded-b-[3rem]">
        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
          Blog Du Lich VietNam Travel
        </h1>
        <p className="text-blue-100 max-w-3xl mx-auto text-base md:text-lg font-medium opacity-95">
          Kham pha diem den moi, kinh nghiem du lich theo mua, va nhat ky hanh
          trinh tu cong dong.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-12 space-y-8">
        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 space-y-6">
          <div className="grid lg:grid-cols-[2fr,1fr] gap-4">
            <div className="relative">
              <Search
                className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Tim kiem bai viet..."
                className="w-full pl-14 pr-6 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-700"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <CalendarDays
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-11 pr-3 py-4 rounded-2xl border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-600"
                />
              </div>
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate("")}
                  className="px-4 py-3 rounded-2xl border border-slate-200 text-slate-500 hover:text-red-500"
                  title="Xoa loc ngay"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCat(cat.id);
                  setCurrentPage(1);
                }}
                className={`flex items-center px-6 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${
                  selectedCat === cat.id
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div id="blog-list-start" className="pt-12">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
              <p className="font-bold text-gray-400 text-lg">
                Đang tải bài viết...
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {currentPosts.length > 0 ? (
                  currentPosts.map((blog) => (
                    <BlogCard key={blog._id} blog={blog} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-32 bg-white rounded-[3rem] border border-dashed border-gray-200 flex flex-col items-center">
                    <Inbox className="text-gray-300 mb-4" size={60} />
                    <p className="text-gray-400 font-bold text-xl">
                      Không tìm thấy bài viết nào!
                    </p>
                  </div>
                )}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-16">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-4 rounded-2xl bg-white border border-gray-100 text-gray-400 hover:text-blue-600 disabled:opacity-20 transition-all shadow-sm"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => paginate(i + 1)}
                      className={`w-12 h-12 rounded-2xl font-black text-sm transition-all ${
                        currentPage === i + 1
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-100 scale-110"
                          : "bg-white text-gray-400 hover:bg-blue-50 border border-gray-100"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-4 rounded-2xl bg-white border border-gray-100 text-gray-400 hover:text-blue-600 disabled:opacity-20 transition-all shadow-sm"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Blogs;
