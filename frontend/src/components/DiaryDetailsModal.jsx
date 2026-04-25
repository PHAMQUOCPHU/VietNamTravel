import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Star, Share2, Download, ChevronLeft, ChevronRight, BookImage } from "lucide-react";
import { toast } from "react-toastify";

const DiaryDetailsModal = ({ diary, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    if (diary.images && diary.images.length > 0) {
      setCurrentImageIndex((prev) => (prev === diary.images.length - 1 ? 0 : prev + 1));
    }
  };

  const prevImage = () => {
    if (diary.images && diary.images.length > 0) {
      setCurrentImageIndex((prev) => (prev === 0 ? diary.images.length - 1 : prev - 1));
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: diary.title,
          text: `Cùng xem nhật ký hành trình "${diary.title}" của tôi tại VietNam Travel nhé!`,
          url: window.location.href, // Có thể update url thực tế nếu có trang chi tiết riêng
        });
      } catch (error) {
        console.log('Error sharing', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Đã copy link để chia sẻ!");
    }
  };

  const handlePrint = () => {
    // Để export PDF, phương án dễ nhất và giao diện đẹp nhất là gọi window.print()
    // CSS `@media print` sẽ xử lý để chỉ in nội dung của phần tử này.
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md print:hidden"
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 custom-scrollbar print:shadow-none print:max-h-full print:overflow-visible print:w-full"
      >
        {/* Nút Đóng & Action (Ẩn khi in) */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-md px-6 py-4 border-b border-gray-100 flex justify-between items-center z-20 print:hidden">
          <div className="flex gap-2">
            <button onClick={handleShare} className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full transition-colors flex items-center gap-2">
              <Share2 size={18} />
              <span className="text-sm font-bold hidden sm:block">Chia sẻ</span>
            </button>
            <button onClick={handlePrint} className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-full transition-colors flex items-center gap-2">
              <Download size={18} />
              <span className="text-sm font-bold hidden sm:block">Tải PDF kỷ niệm</span>
            </button>
          </div>
          <button onClick={onClose} className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* CẤU TRÚC NHẬT KÝ */}
        <div className="print:p-0">
          {/* Header Khu vực ảnh */}
          <div className="relative w-full bg-black flex items-center justify-center" style={{ minHeight: '400px', maxHeight: '600px' }}>
            {diary.images && diary.images.length > 0 ? (
              <>
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentImageIndex}
                    src={diary.images[currentImageIndex]}
                    alt={`Memory ${currentImageIndex}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full h-full object-contain max-h-[600px] print:object-cover print:h-[400px]"
                  />
                </AnimatePresence>

                {diary.images.length > 1 && (
                  <div className="absolute inset-0 flex items-center justify-between px-4 print:hidden">
                    <button onClick={prevImage} className="p-3 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-sm transition-all">
                      <ChevronLeft size={24} />
                    </button>
                    <button onClick={nextImage} className="p-3 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-sm transition-all">
                      <ChevronRight size={24} />
                    </button>
                  </div>
                )}
                
                {/* Dots */}
                {diary.images.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 print:hidden">
                    {diary.images.map((_, i) => (
                      <div key={i} className={`h-2 rounded-full transition-all ${i === currentImageIndex ? 'w-6 bg-white' : 'w-2 bg-white/50'}`} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-[400px] bg-gray-100 flex flex-col items-center justify-center text-gray-400 print:hidden">
                <BookImage size={60} className="mb-4 text-gray-300" />
                <p className="font-medium text-lg">Không có ảnh nào được tải lên</p>
              </div>
            )}
            
            {/* Gradient Overlay cho Print Mode */}
            <div className="hidden print:block absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
          </div>

          {/* Nội dung Nhật ký */}
          <div className="p-8 md:p-12 max-w-3xl mx-auto print:p-8">
            <div className="flex flex-col items-center text-center mb-10">
              <p className="text-sm font-bold tracking-[0.2em] text-gray-400 uppercase mb-4 print:text-black">Nhật ký hành trình</p>
              <h1 className="text-3xl md:text-5xl font-serif italic text-gray-900 mb-6 leading-tight">{diary.title}</h1>
              
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium text-gray-600 print:text-black">
                <div className="flex items-center gap-1.5 bg-gray-50 px-4 py-2 rounded-full print:bg-transparent print:p-0">
                  <MapPin size={16} className="text-blue-500" />
                  {diary.location || "Việt Nam"}
                </div>
                <div className="flex items-center gap-1.5 bg-yellow-50 text-yellow-700 px-4 py-2 rounded-full print:bg-transparent print:p-0">
                  <Star size={16} className="fill-yellow-500 text-yellow-500" />
                  {diary.rating}/5
                </div>
                <div className="flex items-center gap-1.5 bg-cyan-50 text-cyan-700 px-4 py-2 rounded-full print:bg-transparent print:p-0">
                  <span className="italic">{diary.emotion}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 px-4 py-2 rounded-full print:bg-transparent print:p-0">
                  {new Date(diary.travelDate || diary.createdAt).toLocaleDateString('vi-VN')}
                </div>
              </div>
            </div>

            <div className="prose prose-lg mx-auto font-serif text-gray-700 leading-relaxed print:text-black print:prose-p:leading-loose">
              {diary.content.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            
            <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col items-center justify-center text-center hidden print:flex">
              <img src="/logo.png" alt="Logo" className="h-10 mb-2 grayscale opacity-50" />
              <p className="text-xs text-gray-400 font-serif italic">Được tạo bởi VietNam Travel</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DiaryDetailsModal;
