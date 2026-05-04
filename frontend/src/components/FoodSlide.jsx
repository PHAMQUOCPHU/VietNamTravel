import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { foodServices } from "../constants/homeData";

const FoodSlide = () => {
  const [selectedFood, setSelectedFood] = useState(foodServices[0]);

  return (
    <div className="flex min-h-0 flex-col items-center bg-white py-12 font-sans sm:py-16 md:py-24 dark:bg-slate-950">
      <div className="container mx-auto max-w-full px-3 sm:px-6 md:px-12 lg:px-20">
        {/* TIÊU ĐỀ ĐỒNG BỘ MÀU BLUE VIETNAM TRAVEL */}
        <div className="relative mb-10 text-center sm:mb-14 md:mb-16">
          <h2 className="flex flex-col items-center text-2xl font-black uppercase tracking-tight text-[#1e3a8a] sm:text-3xl md:text-4xl dark:text-blue-200">
            DI SẢN <span className="text-[#f97316]">VỊ GIÁC</span>
            <div className="mt-3 h-1 w-12 rounded-full bg-[#2563eb] shadow-sm sm:w-16"></div>
          </h2>
          <p className="text-slate-400 mt-5 font-medium text-xs uppercase tracking-[0.3em]">
            Hành trình tìm về cội nguồn ẩm thực Việt
          </p>
        </div>

        <div className="grid grid-cols-1 items-center gap-6 sm:gap-8 lg:grid-cols-12 lg:gap-10">
          {/* PHẦN HIỂN THỊ CHÍNH */}
          <div className="group relative h-[min(52vh,420px)] w-full min-h-[240px] max-w-full sm:h-[min(56vh,480px)] md:h-[520px] lg:col-span-8 lg:h-[550px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedFood.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 overflow-hidden rounded-2xl border-4 border-white shadow-2xl sm:rounded-3xl sm:border-[6px] md:rounded-[2.5rem] md:border-[10px]"
              >
                <img
                  src={selectedFood.img}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />

                {/* LỚP PHỦ GRADIENT & TEXT NHỎ TINH TẾ */}
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-[#1e3a8a]/90 via-transparent p-4 sm:p-8 md:p-12">
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
                    className="mb-3 text-2xl font-black uppercase leading-tight text-white drop-shadow-md sm:mb-4 sm:text-3xl md:text-4xl"
                  >
                    {selectedFood.name}
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="line-clamp-2 max-w-sm text-xs italic text-white/80 sm:text-sm"
                  >
                    {selectedFood.desc}
                  </motion.p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* DÃY THUMBNAIL BÊN PHẢI */}
          <div className="flex flex-row gap-3 overflow-x-auto py-1 hide-scrollbar sm:gap-4 lg:col-span-4 lg:flex-col lg:gap-5 lg:overflow-x-visible lg:py-2">
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
