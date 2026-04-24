import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { foodServices } from "../constants/homeData";

const FoodSlide = () => {
  const [selectedFood, setSelectedFood] = useState(foodServices[0]);

  return (
    <div className="py-24 bg-white min-h-screen flex flex-col items-center font-sans">
      <div className="container mx-auto px-4 md:px-20">
        {/* TIÊU ĐỀ ĐỒNG BỘ MÀU BLUE VIETNAM TRAVEL */}
        <div className="text-center mb-16 relative">
          <h2 className="text-4xl font-black text-[#1e3a8a] uppercase tracking-tight flex flex-col items-center">
            DI SẢN <span className="text-[#f97316]">VỊ GIÁC</span>
            <div className="w-16 h-1 bg-[#2563eb] mt-3 rounded-full shadow-sm"></div>
          </h2>
          <p className="text-slate-400 mt-5 font-medium text-xs uppercase tracking-[0.3em]">
            Hành trình tìm về cội nguồn ẩm thực Việt
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* PHẦN HIỂN THỊ CHÍNH */}
          <div className="lg:col-span-8 relative h-[550px] w-full group">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedFood.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 rounded-[2.5rem] overflow-hidden shadow-2xl border-[10px] border-white"
              >
                <img
                  src={selectedFood.img}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />

                {/* LỚP PHỦ GRADIENT & TEXT NHỎ TINH TẾ */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1e3a8a]/90 via-transparent p-12 flex flex-col justify-end">
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[#f97316] font-bold text-[10px] uppercase tracking-[0.4em] mb-3"
                  >
                    {selectedFood.tag}
                  </motion.span>
                  <motion.h3
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-4xl font-black text-white uppercase leading-none drop-shadow-md mb-4"
                  >
                    {selectedFood.name}
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-white/70 text-sm italic max-w-sm line-clamp-2"
                  >
                    {selectedFood.desc}
                  </motion.p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* DÃY THUMBNAIL BÊN PHẢI */}
          <div className="lg:col-span-4 flex flex-row lg:flex-col gap-5 overflow-x-auto py-2 scrollbar-hide">
            {foodServices.map((item) => (
              <motion.div
                key={item.id}
                onClick={() => setSelectedFood(item)}
                whileHover={{ x: 5 }}
                className={`relative cursor-pointer shrink-0 w-32 h-24 lg:w-full lg:h-32 rounded-[1.5rem] overflow-hidden border-4 transition-all duration-500 ${
                  selectedFood.id === item.id
                    ? "border-[#2563eb] ring-4 ring-[#2563eb]/10"
                    : "border-white opacity-40 grayscale hover:opacity-100 hover:grayscale-0"
                }`}
              >
                <img src={item.img} className="w-full h-full object-cover" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodSlide;
