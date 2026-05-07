import React, { useState, useEffect, useContext, useCallback } from "react";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import { listDiaries, listEligibleDiariesBookings } from "../services";

import {
  Loader2,
  Plus,
  PenTool,
  Image as ImageIcon,
  MapPin,
  Star,
  Share2,
  Download,
  ChevronLeft,
  ChevronRight,
  BookImage,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DiaryEditorModal from "../components/DiaryEditorModal";
import DiaryDetailsModal from "../components/DiaryDetailsModal";

const Diaries = () => {
  const { backendUrl, user } = useContext(AppContext);
  const [diaries, setDiaries] = useState([]);
  const [eligibleBookings, setEligibleBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedDiary, setSelectedDiary] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const tokenLocal = localStorage.getItem("token");
      if (!tokenLocal) {
        setDiaries([]);
        setEligibleBookings([]);
        return;
      }
      const [diariesData, eligibleData] = await Promise.all([
        listDiaries({ backendUrl, token: tokenLocal }),
        listEligibleDiariesBookings({ backendUrl, token: tokenLocal }),
      ]);

      if (diariesData.success) {
        setDiaries(diariesData.diaries);
      }
      if (eligibleData.success) {
        setEligibleBookings(eligibleData.eligibleBookings);
      }
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải nhật ký hành trình.");
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const openEditor = (booking) => {
    setSelectedBooking(booking);
    setIsEditorOpen(true);
  };

  const closeEditor = (refresh = false) => {
    setIsEditorOpen(false);
    setSelectedBooking(null);
    if (refresh) fetchData();
  };

  const openDetails = (diary) => {
    setSelectedDiary(diary);
    setIsDetailsOpen(true);
  };

  if (!user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-gray-50 px-4 py-16 dark:bg-slate-950">
        <p className="text-center text-sm text-gray-500 dark:text-slate-400 sm:text-base">
          Vui lòng đăng nhập để xem nhật ký.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-3 pb-16 pt-6 dark:bg-slate-950 sm:px-4 sm:pb-20 sm:pt-8 md:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8 sm:space-y-10">
        {/* Header */}
        <div className="space-y-3 text-center sm:space-y-4">
          <h1 className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text font-serif text-3xl font-extrabold italic tracking-wide text-transparent sm:text-4xl md:text-5xl">
            Nhật Ký Hành Trình
          </h1>
          <p className="mx-auto max-w-2xl px-1 text-sm text-gray-500 dark:text-slate-400 md:text-base">
            Lưu giữ những khoảnh khắc tuyệt vời nhất từ những chuyến đi của bạn.
            Khám phá lại những kỷ niệm đẹp đẽ qua từng khung hình và trang viết.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* Eligible Bookings to Write */}
            {eligibleBookings.length > 0 && (
              <div className="rounded-2xl border border-blue-50 bg-white p-4 shadow-sm dark:border-blue-900/40 dark:bg-slate-900 sm:rounded-3xl sm:p-6">
                <div className="mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 text-left">
                    <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-slate-100 sm:text-xl">
                      <PenTool className="text-blue-500" size={24} />
                      Chuyến đi chờ kể chuyện
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Bạn có {eligibleBookings.length} chuyến đi đã hoàn thành
                      chưa viết nhật ký.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {eligibleBookings.map((booking) => (
                    <motion.div
                      key={booking._id}
                      whileHover={{ y: -5 }}
                      className="border border-dashed border-gray-300 rounded-2xl p-5 hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer group"
                      onClick={() => openEditor(booking)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="bg-gray-100 p-2 rounded-lg group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                          <Plus size={20} />
                        </div>
                        <span className="text-[10px] font-bold px-2 py-1 bg-green-100 text-green-700 rounded-full">
                          Đã hoàn thành
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-800 line-clamp-2 mb-1 group-hover:text-blue-700">
                        {booking.tourTitle}
                      </h3>
                      <p className="text-xs text-gray-500 mb-4">
                        {new Date(booking.bookAt).toLocaleDateString("vi-VN")}
                      </p>
                      <button className="w-full py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        Viết nhật ký ngay
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Masonry Grid for Diaries */}
            {diaries.length > 0 ? (
              <div className="columns-1 gap-4 space-y-4 pt-4 sm:columns-2 sm:gap-5 sm:space-y-5 sm:pt-6 lg:columns-3 xl:columns-4">
                {diaries.map((diary) => (
                  <motion.div
                    key={diary._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    className="break-inside-avoid bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer border border-gray-100 relative group"
                    onClick={() => openDetails(diary)}
                  >
                    {/* Image or Placeholder */}
                    <div className="relative w-full overflow-hidden bg-gray-100 min-h-[200px]">
                      {diary.images && diary.images.length > 0 ? (
                        <img
                          src={diary.images[0]}
                          alt={diary.title}
                          className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-48 flex items-center justify-center text-gray-300">
                          <BookImage size={40} />
                        </div>
                      )}

                      {/* Photo Count Badge */}
                      {diary.images && diary.images.length > 0 && (
                        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                          <ImageIcon size={12} /> {diary.images.length}
                        </div>
                      )}

                      {/* Rating Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12">
                        <div className="flex items-center gap-1 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className={
                                i < diary.rating
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-400"
                              }
                            />
                          ))}
                        </div>
                        <h3 className="text-white font-bold text-lg leading-tight line-clamp-2">
                          {diary.title}
                        </h3>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-bold px-2.5 py-1 bg-cyan-50 text-cyan-700 rounded-full border border-cyan-100">
                          {diary.emotion}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <MapPin size={12} />
                          <span className="line-clamp-1">
                            {diary.location || "Việt Nam"}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-3 italic font-serif">
                        "{diary.content}"
                      </p>
                      <p className="text-[10px] text-gray-400 mt-4 uppercase tracking-wider font-semibold">
                        {new Date(diary.createdAt).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              !loading &&
              eligibleBookings.length === 0 && (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                  <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookImage className="text-blue-300 w-12 h-12" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-700 mb-2">
                    Chưa có nhật ký nào
                  </h3>
                  <p className="text-gray-500 text-sm max-w-sm mx-auto">
                    Hãy trải nghiệm các tour du lịch của VietNam Travel và lưu
                    lại những kỷ niệm đẹp của bạn tại đây nhé.
                  </p>
                </div>
              )
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {isEditorOpen && selectedBooking && (
          <DiaryEditorModal
            booking={selectedBooking}
            onClose={() => closeEditor(false)}
            onSuccess={() => closeEditor(true)}
          />
        )}

        {isDetailsOpen && selectedDiary && (
          <DiaryDetailsModal
            diary={selectedDiary}
            onClose={() => {
              setIsDetailsOpen(false);
              setSelectedDiary(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Diaries;
