import express from "express";
import adminAuth from "../middlewares/adminAuth.js";
import upload from "../middlewares/multer.js";
import {
  getPublicSiteConfig,
  updateHomeSlide,
  updateMaintenance,
  updateSiteLogo,
  updateAdminLogo,
  updateNotifications,
} from "../controllers/siteConfigController.js";

const siteConfigRouter = express.Router();

// Public config for frontend (no auth)
siteConfigRouter.get("/public", getPublicSiteConfig);

// Admin-only: logo website (multipart)
siteConfigRouter.post(
  "/logo",
  adminAuth,
  upload.single("image"),
  updateSiteLogo,
);

// Admin-only: logo panel admin — sidebar / favicon tab admin
siteConfigRouter.post(
  "/admin-logo",
  adminAuth,
  upload.single("image"),
  updateAdminLogo,
);

// Admin-only update banner slide (multipart)
siteConfigRouter.post(
  "/home-slide",
  adminAuth,
  upload.single("image"),
  updateHomeSlide,
);

siteConfigRouter.post("/maintenance", adminAuth, updateMaintenance);

// Admin-only: cấu hình toggle thông báo (JSON)
siteConfigRouter.post("/notifications", adminAuth, updateNotifications);

export default siteConfigRouter;

