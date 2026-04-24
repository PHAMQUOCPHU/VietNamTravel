import React from "react";
import { Search, TrendingUp } from "lucide-react";

const BlogSidebar = () => {
  const popularPosts = [
    { id: "1", title: "Kinh nghiệm du lịch Phú Quốc từ A-Z", views: "2.5k" },
    { id: "2", title: "Top 5 quán cà phê view đẹp tại Sapa", views: "1.8k" },
    { id: "3", title: "Ăn gì ở Hội An? Checklist 10 món ngon", views: "1.2k" },
  ];

  return (
    <aside className="space-y-10 sticky top-28">
      {/* Ô tìm kiếm */}
      <div className="relative">
        <input
          type="text"
          placeholder="Tìm bài viết..."
          className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
        />
        <Search className="absolute left-4 top-4 text-gray-400" size={20} />
      </div>

      {/* Bài viết phổ biến */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <TrendingUp className="text-orange-500" size={20} /> Phổ biến nhất
        </h3>
        <div className="space-y-5">
          {popularPosts.map((post, index) => (
            <div key={post.id} className="flex gap-4 group cursor-pointer">
              <span className="text-2xl font-black text-gray-100 group-hover:text-blue-200 transition-colors">
                0{index + 1}
              </span>
              <div>
                <h4 className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                  {post.title}
                </h4>
                <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-widest">
                  {post.views} lượt xem
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Banner quảng cáo/CTA */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white relative overflow-hidden group">
        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-2">
            Lên kế hoạch cho chuyến đi của bạn?
          </h3>
          <p className="text-blue-100 text-xs mb-6">
            Hàng ngàn tour hấp dẫn đang chờ bạn khám phá.
          </p>
          <button className="bg-white text-blue-600 px-6 py-2.5 rounded-xl text-xs font-bold hover:shadow-lg transition-all active:scale-95">
            Xem Tour ngay
          </button>
        </div>
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
      </div>
    </aside>
  );
};

export default BlogSidebar;
