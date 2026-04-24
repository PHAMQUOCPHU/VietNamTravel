import React, { useRef } from "react";
import { Star, X, ImagePlus, XCircle } from "lucide-react";
import { surveyOptions, surveyQuestions } from "./bookingHelpers";

const ReviewModal = ({
  selectedBooking,
  reviewForm,
  setReviewForm,
  setShowReviewModal,
  handleSubmitReview,
  submittingReview,
}) => {
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const currentImages = reviewForm.images || [];
    if (currentImages.length + files.length > 5) {
      alert("Bạn chỉ có thể tải lên tối đa 5 ảnh.");
      return;
    }
    setReviewForm((prev) => ({
      ...prev,
      images: [...currentImages, ...files],
    }));
  };

  const removeImage = (index) => {
    setReviewForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  return (
  <div className="fixed inset-0 bg-black/45 z-[9999] flex items-center justify-center p-4">
    <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-extrabold text-slate-800">Đánh giá chuyến đi</h3>
          <p className="text-sm text-slate-500">{selectedBooking.tourTitle}</p>
        </div>
        <button onClick={() => setShowReviewModal(false)} className="p-2 rounded-lg hover:bg-slate-100">
          <X size={18} />
        </button>
      </div>
      <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
        <div>
          <p className="text-sm font-bold text-slate-700 mb-2">Đánh giá sao</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button key={value} onClick={() => setReviewForm((prev) => ({ ...prev, rating: value }))} className="p-1">
                <Star
                  size={24}
                  className={value <= reviewForm.rating ? "text-amber-400 fill-amber-400" : "text-slate-300"}
                />
              </button>
            ))}
          </div>
        </div>

        {surveyQuestions.map((q) => (
          <div key={q.key}>
            <p className="text-sm font-bold text-slate-700 mb-2">{q.label}</p>
            <div className="flex flex-wrap gap-2">
              {surveyOptions.map((opt) => (
                <label
                  key={opt}
                  className={`px-3 py-2 rounded-xl border text-sm cursor-pointer ${
                    reviewForm.survey[q.key] === opt
                      ? "bg-blue-50 border-blue-300 text-blue-700 font-bold"
                      : "bg-white border-slate-200 text-slate-600"
                  }`}
                >
                  <input
                    type="radio"
                    name={q.key}
                    value={opt}
                    checked={reviewForm.survey[q.key] === opt}
                    onChange={(e) =>
                      setReviewForm((prev) => ({
                        ...prev,
                        survey: { ...prev.survey, [q.key]: e.target.value },
                      }))
                    }
                    className="hidden"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        ))}

        <div>
          <p className="text-sm font-bold text-slate-700 mb-2">Cảm nhận của bạn</p>
          <textarea
            rows={4}
            value={reviewForm.comment}
            onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
            placeholder="Hãy chia sẻ trải nghiệm chuyến đi của bạn..."
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-700">Hình ảnh đính kèm (Tối đa 5 ảnh)</p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg"
              >
                <ImagePlus size={16} /> Thêm ảnh
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                multiple 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageChange}
              />
            </div>
            
            {(reviewForm.images?.length > 0) && (
              <div className="flex gap-3 flex-wrap">
                {reviewForm.images.map((file, index) => (
                  <div key={index} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-sm group">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={`preview-${index}`} 
                      className="w-full h-full object-cover"
                    />
                    <button 
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-white/80 rounded-full text-red-500 hover:bg-white transition-colors"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
        <button
          onClick={() => setShowReviewModal(false)}
          className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
        >
          Hủy
        </button>
        <button
          onClick={handleSubmitReview}
          disabled={submittingReview}
          className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50"
        >
          {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
        </button>
      </div>
    </div>
  </div>
);
};

export default ReviewModal;
