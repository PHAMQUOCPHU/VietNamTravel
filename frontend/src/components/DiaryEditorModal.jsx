import React, { useState, useContext, useRef } from "react";
import { motion } from "framer-motion";
import { X, UploadCloud, MapPin, Star, Loader2, Image as ImageIcon } from "lucide-react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";

const DiaryEditorModal = ({ booking, onClose, onSuccess }) => {
  const { backendUrl, user } = useContext(AppContext);
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [emotion, setEmotion] = useState("Tuyệt vời");
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const emotions = ["Tuyệt vời", "Vui vẻ", "Ấn tượng", "Bình thường", "Thất vọng"];

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      toast.warning("Chỉ được tải lên tối đa 5 ảnh.");
      return;
    }

    const newImages = [...images, ...files].slice(0, 5);
    setImages(newImages);

    const newPreviews = newImages.map(file => URL.createObjectURL(file));
    setImagePreviews(newPreviews);
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);

    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Vui lòng nhập tiêu đề và nội dung.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("userId", user._id);
      formData.append("bookingId", booking._id);
      formData.append("tourId", booking.tourId);
      formData.append("tourTitle", booking.tourTitle);
      formData.append("title", title);
      formData.append("content", content);
      formData.append("rating", rating);
      formData.append("emotion", emotion);
      
      // Lấy địa điểm ngẫu nhiên từ title (hoặc bạn có thể thêm field cho khách tự nhập)
      const location = booking.tourTitle.split('-')[0] || "Việt Nam";
      formData.append("location", location);
      formData.append("travelDate", booking.bookAt);

      images.forEach((img) => {
        formData.append("images", img);
      });

      const { data } = await axios.post(`${backendUrl}/api/diaries/create`, formData, {
        headers: {
          token: localStorage.getItem("token"),
          "Content-Type": "multipart/form-data",
        },
      });

      if (data.success) {
        toast.success(data.message);
        onSuccess();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Lỗi khi lưu nhật ký.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10 custom-scrollbar"
      >
        <div className="sticky top-0 bg-white/90 backdrop-blur-md px-6 py-4 border-b border-gray-100 flex justify-between items-center z-20">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Viết Nhật Ký</h2>
            <p className="text-xs text-blue-600 font-semibold mt-1 line-clamp-1">{booking.tourTitle}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Cảm xúc & Đánh giá */}
          <div className="flex flex-wrap gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Đánh giá chung</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    size={28} 
                    onClick={() => setRating(star)}
                    className={`cursor-pointer transition-colors ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-yellow-200'}`} 
                  />
                ))}
              </div>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Cảm xúc</label>
              <div className="flex flex-wrap gap-2">
                {emotions.map(emo => (
                  <button
                    type="button"
                    key={emo}
                    onClick={() => setEmotion(emo)}
                    className={`px-3 py-1.5 text-sm font-semibold rounded-full border transition-all ${emotion === emo ? 'bg-blue-100 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                  >
                    {emo}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tiêu đề */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Tiêu đề kỷ niệm</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Chuyến đi chữa lành tại Đà Lạt mộng mơ..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-serif text-lg text-gray-800"
            />
          </div>

          {/* Nội dung */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Tâm sự chuyến đi</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Kể lại những câu chuyện thú vị, những món ăn ngon, những người bạn mới..."
              rows={6}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-serif leading-relaxed text-gray-700 resize-none custom-scrollbar"
            ></textarea>
          </div>

          {/* Upload ảnh */}
          <div>
            <label className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              <span>Hình ảnh kỷ niệm ({images.length}/5)</span>
            </label>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-200 shadow-sm">
                  <img src={preview} alt="preview" className="w-full h-full object-cover" />
                  <button 
                    type="button" 
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              
              {images.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-blue-400 hover:text-blue-500 transition-colors"
                >
                  <UploadCloud size={24} className="mb-1" />
                  <span className="text-xs font-semibold">Tải ảnh lên</span>
                </button>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              multiple 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          {/* Nút Submit */}
          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg hover:shadow-xl transition-all active:scale-95 flex justify-center items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <BookImage size={20} />}
              {loading ? "Đang lưu nhật ký..." : "Lưu vào kho kỷ niệm"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default DiaryEditorModal;
