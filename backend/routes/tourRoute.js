import express from "express";
// QUAN TRỌNG: Phải import đầy đủ các hàm từ Controller
import {
  addTour,
  listTours,
  removeTour,
  getSingleTour, // Thêm dòng này
  updateTour, // Thêm dòng này
  toggleTourStatus,
  listOnSaleTours,
  updateSaleForTours,
} from "../controllers/tourController.js";
import upload from "../middlewares/multer.js";
import adminAuth from "../middlewares/adminAuth.js";

const tourRouter = express.Router();
const tourImagesUpload = upload.fields([
  { name: "images", maxCount: 3 },
  { name: "image", maxCount: 3 },
]);

// Route thêm tour (upload đúng 3 ảnh)
tourRouter.post("/add", adminAuth, tourImagesUpload, addTour);

// Route lấy danh sách (Frontend + Admin dùng chung)
tourRouter.get("/list", listTours);
tourRouter.get("/on-sale", listOnSaleTours);

// Route xóa tour
tourRouter.post("/remove", adminAuth, removeTour);
tourRouter.post("/toggle-status", adminAuth, toggleTourStatus);
tourRouter.post("/update-sale", adminAuth, updateSaleForTours);

// --- CÁC ROUTE PHỤC VỤ CHỈNH SỬA (EDIT) ---

// Lấy thông tin 1 tour để đổ vào Form Edit
tourRouter.get("/single/:id", getSingleTour);

// Cập nhật thông tin tour sau khi sửa (có thể gửi lại bộ 3 ảnh mới)
tourRouter.post("/update/:id", adminAuth, tourImagesUpload, updateTour);

export default tourRouter;
