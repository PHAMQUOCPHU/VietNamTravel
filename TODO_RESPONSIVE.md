# TODO - Làm Responsive Toàn Bộ Giao Diện

## Phân tích hiện trạng

- Đã có `viewport` meta tag ✅
- Đã dùng Tailwind responsive prefixes (sm:, md:, lg:) ở nhiều chỗ
- Navbar đã có mobile menu ✅
- Còn nhiều chỗ chưa responsive hoặc bị vỡ layout trên mobile

## Danh sách sửa

### Phase 1: CSS & Layout Foundation

- [ ] Thêm mobile utilities vào `index.css` (hide-scrollbar, safe-area, touch-action)
- [ ] Thêm responsive container queries nếu cần

### Phase 2: Trang chủ (Home)

- [ ] `Header.jsx` - Kiểm tra text size, spacing trên mobile
- [ ] `AdvancedSearch.jsx` - Cần đọc và sửa
- [ ] `AllTours.jsx` - Cần đọc và sửa
- [ ] `Services.jsx` - Cần đọc và sửa
- [ ] `TravelLog.jsx`, `FoodSlide.jsx`, `Experience.jsx`, `NewsLetterBox.jsx` - Cần đọc

### Phase 3: Trang Tour & Tour Details

- [ ] `TourDetails.jsx` - Sửa weather grid `grid-cols-5` → `grid-cols-2 sm:grid-cols-3 md:grid-cols-5`
- [ ] `TourDetails.jsx` - Sửa banner text `text-4xl md:text-6xl` → `text-2xl sm:text-4xl md:text-6xl`
- [ ] `TourDetails.jsx` - Sửa amenities grid trên mobile
- [ ] `TourDetails.jsx` - Review sidebar mobile layout
- [ ] `TourCard.jsx` - Kiểm tra spacing, text overflow
- [ ] `TourCardStackGallery.jsx` - Cần đọc

### Phase 4: Trang Booking & Payment

- [ ] `Booking.jsx` - Kiểm tra form layout trên mobile
- [ ] `MyBooking.jsx` - Sửa table/grid layout trên mobile
- [ ] `Invoice.jsx` - Cần đọc
- [ ] `PaymentReturn.jsx` - OK nhưng kiểm tra

### Phase 5: Auth & User

- [ ] `Login.jsx` - Cần đọc
- [ ] `Profile.jsx` - Cần đọc
- [ ] `ForgotPassword.jsx`, `ResetPassword.jsx`, `VerifyOtp.jsx` - Cần đọc

### Phase 6: Components chung

- [ ] `ChatWidget.jsx` - Giảm width trên mobile (`w-80` → `w-[90vw]`)
- [ ] `Footer.jsx` - Kiểm tra padding, text size
- [ ] Modals/Dialogs - Thêm max-width responsive
- [ ] `TourMap.jsx` - Kiểm tra height trên mobile

### Phase 7: Admin Panel

- [ ] Admin layout - Kiểm tra sidebar trên mobile
- [ ] Admin tables - Horizontal scroll
- [ ] Admin forms - Stack trên mobile
