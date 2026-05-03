import express from "express";
import {
  getAllVouchers,
  getPublicVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  applyVoucher,
} from "../controllers/voucherController.js";
import authUser, { optionalDecodeUser } from "../middlewares/auth.js";
import adminAuth from "../middlewares/adminAuth.js";

const voucherRouter = express.Router();

// Routes cho Admin
voucherRouter.get("/admin", adminAuth, getAllVouchers);
voucherRouter.post("/admin", adminAuth, createVoucher);
voucherRouter.put("/admin/:id", adminAuth, updateVoucher);
voucherRouter.delete("/admin/:id", adminAuth, deleteVoucher);

// Routes cho Frontend
voucherRouter.get("/public", optionalDecodeUser, getPublicVouchers);
voucherRouter.post("/apply", authUser, applyVoucher);

export default voucherRouter;
