import React, { useState } from "react";
import { useBlogs } from "../hooks/useBlogs";
import BlogCard from "../components/BlogCard";
import {
  Loader2,
  Search,
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

  const { blogs, loading, totalItems } = useBlogs({
    category: selectedCat,
    date: selectedDate,
    search: searchTerm,
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="rounded-b-[3rem] bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-600 px-4 pb-24 pt-32 text-center">
        <h1 className="mb-4 text-4xl font-black tracking-tight text-white md:text-5xl">
          Blog Du Lich VietNam Travel
        </h1>
        <p className="mx-auto max-w-3xl text-base font-medium text-blue-100 opacity-95 md:text-lg">
          Kham pha diem den moi, kinh nghiem du lich theo mua, va nhat ky hanh
          trinh tu cong dong.
        </p>
      </div>

      <div className="mx-auto max-w-7xl space-y-8 px-4 -mt-12">
        <div className="space-y-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-blue-900/5">
          <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
            <div className="relative">
              <Search
                className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Tim kiem bai viet..."
                className="w-full rounded-2xl border-none bg-gray-50 py-4 pl-14 pr-6 font-bold text-gray-700 outline-none transition-all focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
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
                  }}
                  className="w-full rounded-2xl border border-gray-200 bg-white py-4 pl-11 pr-3 font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {selectedDate ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate("");
                  }}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-slate-500 hover:text-red-500"
                  title="Xoa loc ngay"
                >
                  <X size={18} />
                </button>
              ) : null}
            </div>
          </div>

          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCat(cat.id);
                }}
                className={`flex items-center whitespace-nowrap rounded-2xl px-6 py-3 text-sm font-bold transition-all ${
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
              <Loader2 className="mb-4 animate-spin text-blue-600" size={48} />
              <p className="text-lg font-bold text-gray-400">
                Đang tải bài viết...
              </p>
            </div>
          ) : (
            <>
              <p className="mb-6 text-center text-sm font-semibold text-slate-500 md:text-left">
                Tổng {totalItems} bài
              </p>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {blogs.length > 0 ? (
                  blogs.map((blog) => (
                    <BlogCard key={blog._id} blog={blog} />
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center rounded-[3rem] border border-dashed border-gray-200 bg-white py-32 text-center">
                    <Inbox className="mb-4 text-gray-300" size={60} />
                    <p className="text-xl font-bold text-gray-400">
                      Không tìm thấy bài viết nào!
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Blogs;
