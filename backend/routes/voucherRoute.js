import express from "express";
import { 
    getAllVouchers, 
    getPublicVouchers, 
    createVoucher, 
    updateVoucher, 
    deleteVoucher, 
    applyVoucher 
} from "../controllers/voucherController.js";
import authUser from "../middlewares/auth.js";

const voucherRouter = express.Router();

// Routes cho Admin (có thể thêm adminMiddleware nếu có)
voucherRouter.get("/admin", getAllVouchers);
voucherRouter.post("/admin", createVoucher);
voucherRouter.put("/admin/:id", updateVoucher);
voucherRouter.delete("/admin/:id", deleteVoucher);

// Routes cho Frontend
voucherRouter.get("/public", getPublicVouchers);
voucherRouter.post("/apply", authUser, applyVoucher);

export default voucherRouter;
