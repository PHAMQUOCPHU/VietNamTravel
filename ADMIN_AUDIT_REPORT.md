# BÁO CÁO KIỂM TRA LUỒNG ADMIN - VIETNAM TRAVEL

## 🔴 LỖI NGHIÊM TRỌNG (Cần sửa ngay)

### 1. Memory leak từ `URL.createObjectURL` (4 file)

- **File:** `AddTour.jsx`, `EditTour.jsx`, `AddBlog.jsx`, `EditBlog.jsx`
- **Vấn đề:** Mỗi lần render tạo `URL.createObjectURL()` mới mà không `revokeObjectURL()`
- **Hậu quả:** Memory leak, browser chậm/crash khi dùng lâu
- **Cách sửa:** Lưu preview URL vào state + cleanup bằng `useEffect`

### 2. Header auth không đúng trong `AddBlog.jsx`

- **File:** `AddBlog.jsx` (dòng ~78, ~109)
- **Vấn đề:** Gửi `{ headers: { aToken } }` → key là `"aToken"` (chữ A hoa)
- **Hậu quả:** Backend `adminAuth.js` chỉ đọc `req.headers.atoken` hoặc `req.headers.token` → **KHÔNG TÌM THẤY TOKEN** → API bị từ chối (401/403)
- **Cách sửa:** Đổi thành `{ headers: { atoken: aToken } }` hoặc `{ headers: { token: aToken } }`

### 3. EditBlog.jsx fetch dữ liệu không tối ưu

- **File:** `EditBlog.jsx` (hàm `fetchBlogData`)
- **Vấn đề:** Fetch TẤT CẢ blogs (`/api/blog/list-blogs`) rồi filter client-side
- **Hậu quả:** Chậm và tốn băng thông khi số lượng bài viết lớn
- **Cách sửa:** Tạo API `/api/blog/detail/:id` hoặc dùng query param

### 4. Hardcoded localhost URL

- **File:** `ListBlog.jsx`, `PostManagement.jsx`
- **Vấn đề:** Link xem bài viết hardcoded `http://localhost:5174/blog/${id}`
- **Hậu quả:** Không chạy đúng trên production
- **Cách sửa:** Dùng `window.location.origin` hoặc env var

---

## 🟡 VẤN ĐỀ HIỆU SUẤT / NGHẼN (Cần cải thiện)

### 5. Không có AbortController / cleanup request

- **File:** `Dashboard.jsx`, `Messages.jsx`, `BookingManagement.jsx`, `UserManagement.jsx`
- **Vấn đề:** Component unmount nhưng request vẫn chạy, sau đó setState → warning + lãng phí tài nguyên
- **Cách sửa:** Dùng `AbortController` hoặc flag `cancelled`

### 6. Fetch tất cả dữ liệu về client (không phân trang server)

- **File:** `TourManagement.jsx`, `BookingManagement.jsx`, `UserManagement.jsx`
- **Vấn đề:** Fetch toàn bộ records về browser rồi mới filter/paginate
- **Hậu quả:** Chậm khi dữ liệu lớn (>1000 records), tốn RAM client
- **Cách sửa:** Thêm pagination + filter server-side (hoặc ít nhất limit)

### 7. `useEffect` dependency không ổn định

- **File:** `Messages.jsx`
- **Vấn đề:** `fetchUsers` được define bên ngoài `useEffect` nhưng dùng làm dependency, gây re-render không cần thiết
- **Cách sửa:** Dùng `useCallback` hoặc đưa logic vào trong `useEffect`

### 8. Socket connection không cleanup đúng

- **File:** `Messages.jsx`
- **Vấn đề:** `socket` global, không disconnect khi component unmount
- **Hậu quả:** Nhiều listener cùng lúc nếu user navigate qua lại

---

## 🟠 VẤN ĐỀ NHẤT QUÁN / CODE SMELL

### 9. Auth header không thống nhất

- `tourApi.js` → dùng `atoken`
- `Dashboard.jsx` → dùng `token`
- `BookingManagement.jsx` → dùng `token`
- `AdminContext.jsx` → dùng `atoken`
- `UserManagement.jsx` (openUserDetail) → dùng `token`
- `AddBlog.jsx` → dùng `aToken` (SAI!)
- **Khuyến nghị:** Chuẩn hóa về 1 header duy nhất (`atoken`)

### 10. Không kiểm tra token hết hạn

- **File:** `App.jsx`, `AdminContext.jsx`
- **Vấn đề:** Nếu token hết hạn trong khi đang dùng, API sẽ lỗi 401 liên tục, không tự redirect về login
- **Khuyến nghị:** Thêm interceptor 401 để logout tự động

---

## 📋 KẾ HOẠCH SỬA


| Ưu tiên | File                  | Vấn đề                            | Cách sửa                       |
| ------- | --------------------- | --------------------------------- | ------------------------------ |
| P0      | AddBlog.jsx           | Header auth sai                   | Sửa `aToken` → `atoken`        |
| P0      | AddTour.jsx           | Memory leak URL.createObjectURL   | Revoke URL + useEffect cleanup |
| P0      | EditTour.jsx          | Memory leak URL.createObjectURL   | Revoke URL + useEffect cleanup |
| P0      | AddBlog.jsx           | Memory leak URL.createObjectURL   | Revoke URL + useEffect cleanup |
| P0      | EditBlog.jsx          | Memory leak URL.createObjectURL   | Revoke URL + useEffect cleanup |
| P1      | Dashboard.jsx         | Không abort request               | Thêm AbortController           |
| P1      | Messages.jsx          | Không abort request + socket leak | Cleanup socket + abort         |
| P1      | BookingManagement.jsx | Không abort request               | Thêm AbortController           |
| P1      | UserManagement.jsx    | Không abort request               | Thêm AbortController           |
| P1      | ListBlog.jsx          | Hardcoded localhost               | Dùng env var                   |
| P1      | PostManagement.jsx    | Hardcoded localhost               | Dùng env var                   |
| P2      | EditBlog.jsx          | Fetch all blogs                   | Fetch single blog              |
| P2      | TourManagement.jsx    | Pagination client-side            | Pagination server-side         |
| P2      | BookingManagement.jsx | Pagination client-side            | Thêm limit                     |
| P2      | AdminContext.jsx      | Không xử lý 401                   | Thêm interceptor auto-logout   |
