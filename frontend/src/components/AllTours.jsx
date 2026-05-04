import React from "react";
import { motion } from "framer-motion";
import TourList from "./TourList";

const AllTours = () => {
  return (
    <motion.div
      className="my-16 flex flex-col items-center justify-center px-4 py-8 sm:my-20 sm:px-6 md:my-24 md:px-8 lg:px-16 xl:px-24"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: "easeInOut" }}
      viewport={{ once: true }}
    >
      <motion.h1
        className="text-3xl sm:text-4xl font-semibold mb-4 text-center text-gray-800 dark:text-slate-100"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        Những Tour <span className="text-blue-500">Nổi Bật</span>
      </motion.h1>
      <motion.p
        className="text-lg text-gray-600 mb-12 text-center max-w-2xl dark:text-slate-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      >
        Những hành trình khó quên được thiết kế riêng cho sở thích của bạn. 
        Khám phá thế giới theo cách tuyệt vời và sang trọng nhất có thể.
      </motion.p>
      <TourList />
    </motion.div>
  );
};

export default AllTours;
