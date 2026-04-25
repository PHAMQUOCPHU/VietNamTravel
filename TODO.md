# TODO - Sửa lỗi luồng xử lý

## Danh sách lỗi đã sửa

- [x] 1. `backend/routes/messageRoute.js` - `"ADMIN_ID_FIXED"` → `"ADMIN"`
- [x] 2. `frontend/src/pages/Booking.jsx` - Fix scope biến `price` trong `handleApplyVoucher`
- [x] 3. `backend/routes/voucherRoute.js` - Thêm `adminAuth` cho route `/admin/*`
- [x] 4. `backend/controllers/diaryController.js` - Sửa `getEligibleBookings` tìm `confirmed` + check ngày kết thúc
- [x] 5. `backend/controllers/bookingController.js` - Sửa `getUserCollection` tìm `confirmed` + check ngày
- [x] 6. `admin/src/api/tourApi.js` - Thêm `.trim()` cho `backendUrl`
- [x] 7. `frontend/src/api/reviewApi.js` - Thêm `Content-Type: multipart/form-data` cho FormData
- [x] 8. `admin/src/context/AdminContext.jsx` - `token` → `atoken` trong header
- [x] 9. `backend/controllers/bookingController.js` - Fix `updateBookingStatus`: `voucher.usedBy.includes(updated.userId)` bị sai vì `userId` sau populate là object, dùng `.some()` + `String()` để so sánh đúng, tránh duplicate entry
- [x] 10. `admin/src/api/tourApi.js` - `updateTourApi` thiếu `.trim()` cho `backendUrl`
