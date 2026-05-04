import React from "react";
import { TrendingUp, UserCheck, Award } from "lucide-react";
import { motion } from "framer-motion";

const Experience = () => {
  return (
    <motion.div
      className="px-4 py-12 sm:py-16 dark:bg-slate-950"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: "easeInOut" }}
      viewport={{ once: true }}
    >
      <motion.h1
        className="mb-6 text-center text-3xl font-semibold text-gray-800 dark:text-slate-100 sm:text-4xl"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        Trải nghiệm cùng <span className="text-blue-500">VietNam Travel</span>
      </motion.h1>
      <motion.p
        className="mx-auto mb-10 max-w-2xl px-1 text-center text-base text-gray-600 dark:text-slate-300 sm:mb-12 sm:text-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      >
        Với tất cả kinh nghiệm và tâm huyết, <br />
        chúng tôi cam kết mang đến cho bạn những dịch vụ tốt nhất.
      </motion.p>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10 md:grid-cols-3 md:gap-12">
        {/* Mục 1: Chuyến đi thành công */}
        <motion.div
          className="flex flex-col items-center rounded-lg bg-white/20 p-5 shadow-lg transition-shadow duration-300 hover:shadow-2xl dark:bg-slate-900/40 sm:p-6"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <TrendingUp className="text-blue-500 mb-4 text-4xl" />
          <span className="text-2xl font-semibold text-gray-800 dark:text-slate-100">12k+</span>
          <h6 className="text-lg text-gray-600 dark:text-slate-400">Chuyến đi thành công</h6>
        </motion.div>

        {/* Mục 2: Khách hàng thân thiết */}
        <motion.div
          className="flex flex-col items-center rounded-lg bg-white/20 p-5 shadow-lg transition-shadow duration-300 hover:shadow-2xl dark:bg-slate-900/40 sm:p-6"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <UserCheck className="text-green-500 mb-4 text-4xl" />
          <span className="text-2xl font-semibold text-gray-800 dark:text-slate-100">2k+</span>
          <h6 className="text-lg text-gray-600 dark:text-slate-400">Khách hàng thân thiết</h6>
        </motion.div>

        {/* Mục 3: Năm kinh nghiệm hoặc Lượt đánh giá */}
        <motion.div
          className="flex flex-col items-center rounded-lg bg-white/20 p-5 shadow-lg transition-shadow duration-300 hover:shadow-2xl dark:bg-slate-900/40 sm:p-6"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <Award className="text-yellow-500 mb-4 text-4xl" />
          <span className="text-2xl font-semibold text-gray-800 dark:text-slate-100">10k+</span>
          <h6 className="text-lg text-gray-600 dark:text-slate-400">Đánh giá 5 sao</h6>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Experience;
