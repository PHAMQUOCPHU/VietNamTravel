# TODO - Refactor axios imports (frontend)

## Mục tiêu

- Các file còn import `axios` sẽ được refactor dần để dùng client/http wrapper chung (nhằm giảm code lặp & “chuyên nghiệp” hơn).

## Thứ tự ưu tiên đã chốt

**Tầng 1 (backend nội bộ) →** `Diaries.jsx` → `Careers.jsx` → `PaymentReturn.jsx` → `Tour.jsx` → `ChatWidget.jsx`

**Tầng 2 (chat/AI + OpenWeather) →** `TourAdvisorChat.jsx` → `TourDetails.jsx`

---

## Tiến độ

- Diaries.jsx (GET diaries/list, diaries/eligible)
- Careers.jsx (GET jobs, GET job-applications/search)
- PaymentReturn.jsx (GET bookings, POST payment/vnpay-verify)
- Tour.jsx (GET vouchers/public)
- ChatWidget.jsx (messages CRUD + upload image)
- TourAdvisorChat.jsx (POST /api/tour-advisor)
- TourDetails.jsx (OpenWeather geo + forecast)