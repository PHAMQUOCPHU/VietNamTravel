import React from "react";
import { motion } from "framer-motion";
import { blogs, resorts } from "../constants/homeData";
import { ArrowRight, Calendar, Star } from "lucide-react"; // Thêm icon Star cho xịn

const TravelLog = () => {
  return (
    <div className="py-16 bg-white container mx-auto px-4 md:px-20 animate-fadeIn">
      {/* SECTION 1: NHẬT KÝ HÀNH TRÌNH */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-black text-gray-800 mb-4 uppercase tracking-tighter">
          Nhật ký <span className="text-blue-600">Hành trình</span>
        </h2>
        <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8 mb-24">
        {blogs.map((blog, index) => (
          <motion.div
            key={blog.id}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -10 }}
            className="group cursor-pointer bg-gray-50 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
          >
            <div className="relative h-60 overflow-hidden">
              <img
                src={blog.img}
                alt={blog.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700"
              />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2 text-[10px] font-bold text-gray-600 shadow-sm">
                <Calendar size={12} className="text-blue-600" /> {blog.date}
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors">
                {blog.title}
              </h3>
              <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed mb-4">
                {blog.desc}
              </p>
              <button className="flex items-center gap-2 text-blue-600 font-bold text-sm group-hover:gap-4 transition-all uppercase tracking-widest">
                Đọc thêm <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* SECTION 2: TIÊU ĐỀ RESORT - PHẦN PHÚ YÊU CẦU */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-black text-gray-800 mb-4 uppercase tracking-tighter">
          Những nơi <span className="text-blue-600">nghỉ dưỡng</span> tốt nhất
        </h2>
        <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
        <p className="text-gray-400 mt-4 text-sm font-medium italic">
          Khám phá không gian sang trọng và dịch vụ đẳng cấp 5 sao dành riêng
          cho bạn
        </p>
      </motion.div>

      {/* GALLERY RESORT - HIỆU ỨNG FLEX XỊN SÒ */}
      <div className="flex flex-col md:flex-row gap-4 h-auto md:h-[450px]">
        {/* Tăng chiều cao lên 450px nhìn cho đã mắt trên Mac nha Phú */}
        {resorts.map((res, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.2 }}
            whileHover={{ flex: 3 }}
            className="flex-1 min-h-[220px] md:min-h-0 overflow-hidden rounded-3xl cursor-pointer relative group transition-all duration-700 shadow-lg border-2 border-transparent hover:border-blue-100"
          >
            <img
              src={res}
              className="w-full h-full object-cover filter brightness-90 group-hover:brightness-100 group-hover:scale-105 transition-all duration-1000"
              alt={`Resort ${idx + 1}`}
            />

            {/* Overlay Gradient cho chữ dễ đọc */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>

            <div className="absolute bottom-8 left-8 text-white transition-all duration-500 transform group-hover:translate-x-2">
              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className="fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <p className="font-black text-2xl mb-1 tracking-tight">
                Resort Nghỉ Dưỡng {idx + 1}
              </p>
              <p className="text-xs text-blue-200 uppercase tracking-[0.2em] font-bold">
                Trải nghiệm thượng lưu
              </p>
            </div>

            {/* Hiệu ứng tia sáng khi hover */}
            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TravelLog;
