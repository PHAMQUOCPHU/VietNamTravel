import React, { useContext, useState } from "react"; // Thêm useState
import { motion } from "framer-motion";
import { AppContext } from "../context/AppContext";
import TourCard from "../components/TourCard.jsx";

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

const TourList = () => {
  const { tours } = useContext(AppContext);

  // 1. Logic chia trang
  const [currentPage, setCurrentPage] = useState(1);
  const toursPerPage = 8; // Phú muốn hiện tối đa 8 ảnh

  // Tính toán vị trí cắt mảng
  const indexOfLastTour = currentPage * toursPerPage;
  const indexOfFirstTour = indexOfLastTour - toursPerPage;

  // Cắt mảng lấy 8 tour cho trang hiện tại
  const currentTours = tours
    ? tours.slice(indexOfFirstTour, indexOfLastTour)
    : [];

  // Tính tổng số trang
  const totalPages = tours ? Math.ceil(tours.length / toursPerPage) : 0;

  // Hàm chuyển trang và tự cuộn lên đầu danh sách
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 500, behavior: "smooth" }); // Cuộn lên vừa đủ để xem danh sách mới
  };

  return (
    <div className="dark:text-slate-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {currentTours.length > 0 ? (
          currentTours.map((tour, index) => (
            <motion.div
              key={tour._id || index}
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              transition={{ delay: index * 0.05 }}
            >
              <TourCard tour={tour} />
            </motion.div>
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500 py-10 dark:text-slate-400">
            Hiện tại chưa có tour nào được đăng tải.
          </p>
        )}
      </div>

      {/* 2. Thanh điều hướng trang (Pagination) */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-12 mb-10">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-blue-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all font-medium text-gray-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Trước
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => handlePageChange(i + 1)}
              className={`w-10 h-10 rounded-full border transition-all font-bold ${
                currentPage === i + 1
                  ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 dark:hover:border-blue-500 dark:hover:text-blue-400"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-blue-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all font-medium text-gray-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
};

export default TourList;
