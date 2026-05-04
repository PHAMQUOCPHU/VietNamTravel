import React from "react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

const NewsLetterBox = () => {
  const onSubmitHandler = (event) => {
    event.preventDefault();
    event.target.reset();
    // Chuyển thông báo thành tiếng Việt
    toast.success("Cảm ơn bạn đã đăng ký nhận tin!");
  };

  return (
    <motion.div
      className="text-center py-12"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: "easeInOut" }}
      viewport={{ once: true }}
    >
      <motion.h1
        className="text-3xl sm:text-4xl font-semibold mb-6 text-gray-800"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        Đăng ký ngay để nhận <span className="text-blue-500">Thông báo!</span>
      </motion.h1>
      <motion.p
        className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      >
        Luôn dẫn đầu xu hướng với những ưu đãi du lịch độc quyền từ chúng tôi!
      </motion.p>
      <form
        onSubmit={onSubmitHandler}
        className="mx-auto flex w-full max-w-lg flex-col items-stretch gap-3 px-4 sm:max-w-2xl sm:flex-row sm:items-center sm:gap-4"
      >
        <motion.input
          type="email"
          placeholder="Nhập email của bạn"
          className="min-w-0 w-full rounded-lg border-2 border-gray-400 bg-inherit px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          required
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        />
        <motion.button
          type="submit"
          className="w-full shrink-0 rounded-lg bg-gradient-to-b from-sky-500 to-blue-500 px-6 py-3 text-white transition duration-200 ease-in-out hover:from-sky-600 hover:to-blue-600 sm:w-auto sm:px-8"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          Đăng ký
        </motion.button>
      </form>
    </motion.div>
  );
};

export default NewsLetterBox;
