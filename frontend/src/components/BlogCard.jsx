import React from "react";
import { Calendar, Eye, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BlogCard = ({ blog }) => {
  const navigate = useNavigate();
  const backendUrl = "http://localhost:5001";
  const imageUrl =
    blog?.image && String(blog.image).startsWith("http")
      ? blog.image
      : "https://via.placeholder.com/800x500?text=Blog";

  // Hàm chuyển đổi category sang tiếng Việt
  const getCategoryName = (cat) => {
    const categories = {
      destination: "Điểm đến",
      food: "Ẩm thực",
      guide: "Cẩm nang",
      itinerary: "Lịch trình",
      review: "Review",
      saving: "Tiết kiệm",
    };
    return categories[cat] || cat;
  };

  return (
    <div
      onClick={() => navigate(`/blog/${blog._id}`)}
      className="group bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 cursor-pointer"
    >
      <div className="relative h-64 overflow-hidden">
        <img
          src={imageUrl}
          alt={blog.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />

        <div className="absolute top-5 left-5">
          <span className="px-4 py-1.5 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg border border-white/20">
            {getCategoryName(blog.category)}
          </span>
        </div>
      </div>

      <div className="p-7">
        <div className="flex items-center gap-4 text-gray-400 text-[11px] mb-4 font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-lg">
            <Calendar size={14} className="text-blue-500" />
            {new Date(blog.date).toLocaleDateString("vi-VN")}
          </span>
          <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-lg text-slate-600">
            {blog.author || "Admin"}
          </span>
        </div>

        <h3 className="text-xl font-black text-gray-800 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
          {blog.title}
        </h3>

        <p className="text-gray-500 text-sm line-clamp-2 mb-6 font-medium leading-relaxed">
          {blog.excerpt ||
            "Khám phá những trải nghiệm thú vị cùng Vietnam Travel..."}
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
            <span className="inline-flex items-center gap-1">
              <Eye size={14} /> {blog.views || 0}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle size={14} /> {blog.comments?.length || 0}
            </span>
          </div>
          <span className="text-blue-600 font-black text-sm flex items-center gap-1 group-hover:gap-3 transition-all">
            Đọc tiếp <span className="text-lg">→</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default BlogCard;
