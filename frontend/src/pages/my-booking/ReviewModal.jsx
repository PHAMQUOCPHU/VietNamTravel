import React from "react";
import { Star, X } from "lucide-react";
import { surveyOptions, surveyQuestions } from "./bookingHelpers";

const ReviewModal = ({
  selectedBooking,
  reviewForm,
  setReviewForm,
  setShowReviewModal,
  handleSubmitReview,
  submittingReview,
}) => (
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
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
          />
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

export default ReviewModal;
