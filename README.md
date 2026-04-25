# 🌏 VietNamTravel - Nền Tảng Đặt Chuyến Du Lịch Toàn Diện

<div align="center">

![VietNamTravel](https://img.shields.io/badge/Version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)
![Node Version](https://img.shields.io/badge/Node-%3E%3D18.0.0-brightgreen)
![React Version](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)

**Hệ thống đặt tour du lịch hiện đại với AI, thanh toán trực tuyến, và quản lý admin toàn diện**

[📱 Truy Cập Ứng Dụng](#deployment) • [📚 Tài Liệu API](#api-documentation) • [🚀 Khởi Động Nhanh](#quick-start)

</div>

---

## 📋 Mục Lục

- [Giới Thiệu](#giới-thiệu)
- [Tính Năng Chính](#tính-năng-chính)
- [Kiến Trúc Hệ Thống](#kiến-trúc-hệ-thống)
- [Công Nghệ Sử Dụng](#công-nghệ-sử-dụng)
- [Cài Đặt & Khởi Động](#cài-đặt--khởi-động)
- [Cấu Hình Biến Môi Trường](#cấu-hình-biến-môi-trường)
- [Hướng Dẫn Sử Dụng](#hướng-dẫn-sử-dụng)
- [API Documentation](#api-documentation)
- [Cấu Trúc Thư Mục](#cấu-trúc-thư-mục)
- [Đóng Góp](#đóng-góp)

---

## 🎯 Giới Thiệu

**VietNamTravel** là một nền tảng đặt chuyến du lịch toàn diện được xây dựng bằng công nghệ hiện đại, cung cấp trải nghiệm mượt mà cho khách du lịch từ việc khám phá các tour đến thanh toán và quản lý chuyến đi.

Hệ thống được thiết kế với kiến trúc microservice gồm 3 thành phần chính:

- **Frontend** - Giao diện khách hàng (React + Vite)
- **Admin Dashboard** - Bảng điều khiển quản lý (React + Chart.js)
- **Backend API** - Máy chủ ứng dụng (Node.js + Express)

---

## ✨ Tính Năng Chính

### 🎫 **Quản Lý Tour**

- Duyệt và tìm kiếm các tour du lịch với bộ lọc nâng cao
- Xem chi tiết tour (mô tả, hình ảnh, giá, lịch khởi hành)
- Đánh giá sao và bình luận từ những du khách khác
- Lưu tour yêu thích

### 📅 **Hệ Thống Đặt Chuyến**

- Đặt tour với thông tin chi tiết khách hàng
- Chọn ngày khởi hành linh hoạt
- Tính giá động theo số lượng khách
- Quản lý danh sách đặt chuyến cá nhân
- Theo dõi trạng thái đơn đặt hàng

### 💳 **Thanh Toán & Hóa Đơn**

- Tích hợp VNPay thanh toán trực tuyến
- Hóa đơn tự động được tạo sau đặt chuyến
- Xuất hóa đơn dưới dạng PDF
- Mã QR để quản lý đơn đặt
- Theo dõi thời hạn thanh toán tự động

### 🤖 **AI Tour Advisor**

- Tư vấn tour thông minh bằng Google Gemini AI
- Gợi ý cá nhân dựa trên sở thích người dùng
- Trả lời các câu hỏi về tour và điểm đến

### 📝 **Blog & Tư Vấn**

- Bài viết blog về các điểm đến du lịch
- Chia sẻ kinh nghiệm du lịch
- Hướng dẫn an toàn khi du lịch

### 💬 **Tính Năng Xã Hội**

- Chat real-time với quản trị viên (Socket.io)
- Viết nhật ký du lịch cá nhân
- Đánh giá và bình luận tour
- Thông báo và cập nhật từ hệ thống

### 🎁 **Voucher & Khuyến Mãi**

- Hệ thống mã giảm giá
- Áp dụng voucher vào đơn đặt
- Quản lý thời hạn voucher

### 🛡️ **An Toàn & Bảo Hiểm**

- Thông tin an toàn địa điểm du lịch
- Hệ thống đăng ký bảo hiểm du lịch
- Cảnh báo an toàn theo địa điểm

### 📊 **Bảng Điều Khiển Quản Trị**

- Thống kê doanh thu và đơn đặt hàng
- Quản lý tour, blog, người dùng
- Theo dõi thông báo và yêu cầu bảo hiểm
- Biểu đồ phân tích chi tiết (Chart.js)
- Quản lý phiếu giảm giá
- Nhập khẩu hình ảnh tour vào Cloudinary

### 🔔 **Tự Động Hóa**

- Gửi email nhắc nhở trước ngày khởi hành (Cron Job)
- Tự động gửi thông báo thanh toán quá hạn
- Thông báo thời gian thực cho admin

### 🗺️ **Tính Năng Bản Đồ**

- Tích hợp Leaflet và Google Maps
- Hiển thị vị trí tour trên bản đồ
- Tương tác địa lý

---

## 🏗️ Kiến Trúc Hệ Thống

```
┌─────────────────┐
│   Frontend      │
│  (React/Vite)   │
└────────┬────────┘
         │ HTTP/WebSocket
         ▼
┌─────────────────┐      ┌──────────────┐
│   Admin Panel   │      │   Backend    │
│  (React/Vite)   │◄────►│ (Express.js) │
└────────┬────────┘      └──────┬───────┘
         │                      │
         └──────────┬───────────┘
                    │
            ┌───────▼────────┐
            │    MongoDB     │
            │   (Database)   │
            └────────────────┘
```

---

## 🛠️ Công Nghệ Sử Dụng

### Frontend & Admin

| Công Nghệ          | Phiên Bản     | Mục Đích                |
| ------------------ | ------------- | ----------------------- |
| React              | 18.3 / 19.2   | UI Framework            |
| Vite               | 6.0 / 8.0     | Build Tool              |
| TailwindCSS        | 3.4           | Styling                 |
| React Router       | 7.0           | Routing                 |
| Framer Motion      | 11.15 / 12.38 | Animations              |
| Axios              | 1.13-1.14     | HTTP Client             |
| Socket.io Client   | 4.8           | Real-time Communication |
| Chart.js           | 4.5           | Data Visualization      |
| Leaflet            | 1.9           | Interactive Maps        |
| React PDF Renderer | 4.1           | PDF Export              |

### Backend

| Công Nghệ            | Phiên Bản | Mục Đích         |
| -------------------- | --------- | ---------------- |
| Node.js              | 18+       | Runtime          |
| Express              | 4.21      | Web Framework    |
| MongoDB              | -         | NoSQL Database   |
| Mongoose             | 8.9       | ODM              |
| Socket.io            | 4.8       | Real-time Events |
| JWT                  | 9.0       | Authentication   |
| Bcryptjs             | 2.4       | Password Hashing |
| Cloudinary           | 2.9       | Image Storage    |
| Nodemailer           | 8.0       | Email Service    |
| Node-cron            | 3.0       | Scheduled Tasks  |
| Google Generative AI | 0.24      | AI Advisor       |
| VNPay API            | -         | Payment Gateway  |

---

## ⚡ Cài Đặt & Khởi Động

### 📋 Yêu Cầu Hệ Thống

- **Node.js**: v18.0.0 trở lên
- **npm**: v9.0.0 trở lên (hoặc yarn, pnpm)
- **MongoDB**: v4.4+ (Local hoặc Atlas Cloud)
- **Git**: để clone repository

### 🚀 Quick Start

#### 1️⃣ Clone Repository

```bash
git clone https://github.com/yourusername/VietNamTravel.git
cd VietNamTravel
```

#### 2️⃣ Cài Đặt Backend

```bash
cd backend
npm install
npm run server  # Sử dụng nodemon cho development
```

#### 3️⃣ Cài Đặt Frontend

```bash
cd ../frontend
npm install
npm run dev
```

#### 4️⃣ Cài Đặt Admin Dashboard

```bash
cd ../admin
npm install
npm run dev
```

### 📍 Địa Chỉ Truy Cập

| Thành Phần | URL                     | Cổng |
| ---------- | ----------------------- | ---- |
| Frontend   | `http://localhost:5173` | 5173 |
| Admin      | `http://localhost:5174` | 5174 |
| Backend    | `http://localhost:5001` | 5001 |

---

## 🔐 Cấu Hình Biến Môi Trường

> ⚠️ **Lưu ý Bảo Mật**: Không bao giờ commit các file `.env` chứa thông tin nhạy cảm lên GitHub.

Tham khảo các file `.env.example` có sẵn trong mỗi thư mục (`backend/.env.example`, `frontend/.env.example`, `admin/.env.example`) để biết danh sách các biến cần thiết.

**Hướng dẫn cấu hình:**

1. Sao chép file `.env.example` thành `.env` ở từng thư mục
2. Điền các giá trị cần thiết (API keys, database URIs, v.v.)
3. Giữ bí mật và không share với bất kỳ ai

```bash
# Backend
cp backend/.env.example backend/.env
nano backend/.env  # Điền các giá trị

# Frontend
cp frontend/.env.example frontend/.env

# Admin
cp admin/.env.example admin/.env
```

---

## 📖 Hướng Dẫn Sử Dụng

### 👤 Cho Khách Hàng

1. **Đăng Ký & Đăng Nhập**
   - Truy cập trang chủ và nhấp "Đăng Ký"
   - Nhập email và mật khẩu
   - Xác nhận email (nếu có)

2. **Tìm Kiếm Tour**
   - Sử dụng thanh tìm kiếm để lọc tour theo:
     - Điểm đến
     - Khoảng giá
     - Số ngày
     - Loại tour

3. **Đặt Tour**
   - Chọn tour yêu thích
   - Nhấp "Đặt Ngay"
   - Điền thông tin khách hàng
   - Chọn ngày khởi hành
   - Nhập mã voucher (nếu có)
   - Xác nhận đơn đặt

4. **Thanh Toán**
   - Chọn phương thức thanh toán (VNPay)
   - Đợi xác nhận của hệ thống
   - Kiểm tra email để nhận hóa đơn

5. **Quản Lý Đặt Chuyến**
   - Vào "Đơn Đặt Của Tôi"
   - Xem chi tiết, trạng thái
   - Tải xuống hóa đơn hoặc mã QR

### 👨‍💼 Cho Quản Trị Viên

1. **Truy Cập Admin**
   - Đăng nhập bằng tài khoản admin
   - Truy cập `http://localhost:5174`

2. **Quản Lý Tour**
   - Thêm tour mới (Thêm hình, mô tả, giá)
   - Cập nhật thông tin tour
   - Xóa tour

3. **Xem Thống Kê**
   - Doanh thu theo thời gian
   - Số đơn đặt hàng
   - Khách hàng mới
   - Biểu đồ phân tích

4. **Quản Lý Người Dùng**
   - Xem danh sách người dùng
   - Khóa/mở khóa tài khoản
   - Xem lịch sử đặt chuyến

---

## 📚 API Documentation

### Authentication Routes (`/api/user`)

- `POST /register` - Đăng ký tài khoản mới
- `POST /login` - Đăng nhập
- `POST /logout` - Đăng xuất
- `GET /profile` - Lấy thông tin người dùng
- `PUT /update` - Cập nhật hồ sơ

### Tour Routes (`/api/tour`)

- `GET /` - Lấy danh sách tour (có hỗ trợ phân trang, lọc)
- `GET /:id` - Chi tiết tour
- `POST /` - Tạo tour mới (Admin)
- `PUT /:id` - Cập nhật tour (Admin)
- `DELETE /:id` - Xóa tour (Admin)

### Booking Routes (`/api/booking`)

- `POST /` - Tạo đơn đặt mới
- `GET /` - Lấy danh sách đơn đặt của user
- `GET /:id` - Chi tiết đơn đặt
- `PUT /:id/cancel` - Hủy đơn đặt
- `GET /:id/invoice` - Xuất hóa đơn

### Payment Routes (`/api/payment`)

- `POST /vnpay/create` - Tạo liên kết thanh toán VNPay
- `GET /vnpay/return` - Xử lý kết quả thanh toán

### Review Routes (`/api/review`)

- `POST /` - Thêm đánh giá
- `GET /tour/:tourId` - Lấy đánh giá của tour
- `DELETE /:id` - Xóa đánh giá

### Voucher Routes (`/api/voucher`)

- `GET /` - Lấy danh sách voucher
- `POST /validate` - Kiểm tra mã voucher

### Diary Routes (`/api/diary`)

- `POST /` - Tạo nhật ký mới
- `GET /` - Lấy nhật ký của user
- `PUT /:id` - Cập nhật nhật ký
- `DELETE /:id` - Xóa nhật ký

### AI Tour Advisor (`/api/gemini`)

- `POST /chat` - Hỏi AI về tour

### Notification Routes (`/api/notification`)

- `GET /` - Lấy thông báo của user
- `PUT /:id/read` - Đánh dấu đã đọc

### Safety Routes (`/api/safety`)

- `GET /` - Lấy thông tin an toàn

---

## 📁 Cấu Trúc Thư Mục

```
VietNamTravel/
├── frontend/                 # Ứng dụng khách hàng
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Trang (Routes)
│   │   ├── api/             # API calls (Axios)
│   │   ├── context/         # Context API
│   │   ├── hooks/           # Custom hooks
│   │   ├── utils/           # Utility functions
│   │   ├── assets/          # Hình ảnh, tài nguyên
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── admin/                    # Bảng điều khiển admin
│   ├── src/
│   │   ├── components/      # Admin components
│   │   ├── pages/           # Admin pages
│   │   ├── api/             # API integration
│   │   └── main.jsx
│   └── package.json
│
├── backend/                  # API Server
│   ├── config/              # Cấu hình (DB, Cloudinary, Email)
│   ├── controllers/         # Business logic
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API endpoints
│   ├── middlewares/         # Authentication, Upload
│   ├── services/            # Cron jobs, Notifications
│   ├── utils/               # Utility functions
│   ├── scripts/             # Migration scripts
│   ├── server.js            # Entry point
│   └── package.json
│
└── README.md
```

---

## 🔄 Quy Trình Hệ Thống

### Quy Trình Đặt Tour

```
User → Browse Tours → Select Tour → Enter Details → Add to Cart
→ Choose Payment → VNPay Payment → Get Invoice → Confirmation Email
```

### Quy Trình Tự Động Hóa

```
Scheduled Cron Job (Every Day at 8 AM)
├─ Check bookings with departure in 3 days
├─ Send reminder email to users
└─ Create system notifications

Scheduled Cron Job (Every Day at 9 AM)
├─ Check bookings with overdue payment
├─ Send payment deadline reminder
└─ Notify admin
```

---

## 🤝 Đóng Góp

### Cách Đóng Góp

1. **Fork repository**

   ```bash
   git clone https://github.com/yourusername/VietNamTravel.git
   ```

2. **Tạo branch tính năng**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Commit thay đổi**

   ```bash
   git commit -m "Add: mô tả tính năng"
   ```

4. **Push lên GitHub**

   ```bash
   git push origin feature/your-feature-name
   ```

5. **Tạo Pull Request**

### Quy Tắc Code

- Tuân thủ ESLint config
- Viết comments cho code phức tạp
- Test code trước khi submit
- Sử dụng conventional commits

---

## 📝 License

Dự án này được cấp phép theo giấy phép MIT. Xem file [LICENSE](LICENSE) để biết chi tiết.

---

## 📧 Liên Hệ & Hỗ Trợ

- 📧 **Email**: phamquocphu431027@gmail.com
- 💬 **Chat**: Sử dụng tính năng chat trong ứng dụng
- 🐛 **Report Bug**: Tạo Issue trên GitHub

---

## 🙏 Cảm Ơn

Cảm ơn bạn đã quan tâm đến VietNamTravel! Nếu có thích, vui lòng ⭐ star repository này.

---

<div align="center">

**Made with ❤️ for Vietnamese Tourism**

© 2026 VietNamTravel. All rights reserved.

</div>

- Navigate to the homepage where you can view all available tour packages.
- Each package will have details like the title, description, price, available dates, and an image.

### 2. **Booking a Package:**

- Click on the 'Book Now' button next to the package you wish to book.
- Fill in the required customer information and submit the form.
- Your booking will be saved in MongoDB.

### 3. **Invoice Generation:**

- After the booking is confirmed, you will receive an invoice with your booking details, including the customer and package information.

## Contributing

We welcome contributions to enhance the functionality of VietNamTravel! If you'd like to contribute:

1. Fork the repository.
2. Create a new branch
3. Make your changes and commit them.
4. Push your changes to your forked repository.
5. Submit a pull request with a description of your changes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- **Email:** phamquocphu431027@gmail.com
