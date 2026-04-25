# TODO: SỬA LỖI ADMIN FLOW

## P0 - Lỗi nghiêm trọng (Sửa ngay) ✅ ĐÃ HOÀN THÀNH

### 1. Fix sai auth header trong AddBlog.jsx ✅

- **File:** `admin/src/pages/AddBlog.jsx`
- **Lỗi:** Gửi `{ headers: { aToken } }` → key là `"aToken"` (chữ A hoa), backend không nhận diện được
- **Fix:** Đổi thành `{ headers: { atoken: aToken } }` ở 2 chỗ (handleSubmit + handleGenerateAI)

### 2. Fix memory leak URL.createObjectURL trong AddTour.jsx ✅

- **File:** `admin/src/pages/AddTour.jsx`
- **Lỗi:** `URL.createObjectURL(img)` được gọi trực tiếp trong JSX, tạo blob URL mới mỗi lần render
- **Fix:** Lưu preview URL vào state, revoke khi unmount hoặc image thay đổi

### 3. Fix memory leak URL.createObjectURL trong EditTour.jsx ✅

- **File:** `admin/src/pages/EditTour.jsx`
- **Lỗi:** Tương tự AddTour, `URL.createObjectURL(newImages[index])` trong JSX
- **Fix:** Lưu preview URL vào state, revoke khi unmount hoặc image thay đổi

### 4. Fix memory leak URL.createObjectURL trong AddBlog.jsx ✅

- **File:** `admin/src/pages/AddBlog.jsx`
- **Lỗi:** `URL.createObjectURL(image)` trong JSX
- **Fix:** Lưu preview URL vào state, revoke khi unmount hoặc image thay đổi

### 5. Fix memory leak URL.createObjectURL trong EditBlog.jsx ✅

- **File:** `admin/src/pages/EditBlog.jsx`
- **Lỗi:** `URL.createObjectURL(image)` trong JSX
- **Fix:** Lưu preview URL vào state, revoke khi unmount hoặc image thay đổi

---

## P1 - Hiệu suất/Ổn định

### 6. Thêm AbortController cho Dashboard.jsx

- **File:** `admin/src/pages/Dashboard.jsx`
- **Sửa:** Hủy request khi component unmount hoặc date thay đổi

### 7. Thêm cleanup cho Messages.jsx

- **File:** `admin/src/pages/Messages.jsx`
- **Sửa:** Abort request + cleanup socket listener đúng cách

### 8. Thêm AbortController cho BookingManagement.jsx

- **File:** `admin/src/pages/BookingManagement.jsx`
- **Sửa:** Hủy request khi component unmount

### 9. Thêm AbortController cho UserManagement.jsx

- **File:** `admin/src/pages/UserManagement.jsx`
- **Sửa:** Hủy request khi component unmount

### 10. Fix hardcoded localhost URL

- **File:** `admin/src/pages/ListBlog.jsx`, `admin/src/pages/PostManagement.jsx`
- **Sửa:** Dùng `import.meta.env.VITE_FRONTEND_URL` hoặc tương tự

---

## P2 - Cải thiện

### 11. EditBlog.jsx fetch single blog thay vì all blogs

- **File:** `admin/src/pages/EditBlog.jsx`
- **Sửa:** Dùng API lấy chi tiết 1 blog thay vì fetch tất cả rồi filter

### 12. Thêm interceptor 401 auto-logout

- **File:** `admin/src/context/AdminContext.jsx` hoặc setup axios global
- **Sửa:** Khi nhận 401, tự động logout và redirect về login
