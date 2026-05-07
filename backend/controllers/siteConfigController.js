import siteConfigModel from "../models/siteConfigModel.js";
import {
  CLOUDINARY_FOLDERS,
  uploadBufferToCloudinary,
} from "../services/cloudinaryUpload.js";

const DEFAULT_KEY = "default";
const DEFAULT_SLIDES = [
  {
    url: "/home-slides/slide-1.png",
    alt: "Khám phá Vịnh Hạ Long — VietNam Travel",
  },
  {
    url: "/home-slides/slide-2.png",
    alt: "Việt Nam — Hội An, biển và hành trình của bạn",
  },
  {
    url: "/home-slides/slide-3.png",
    alt: "Du lịch Việt Nam — ưu đãi và hành trình trọn vẹn",
  },
];

const DEFAULT_NOTIFICATIONS = {
  newOrder: true,
  cancelRequest: true,
  newUser: true,
  newReview: true,
  paymentSuccess: true,
  blogComment: true,
};

const normalizeNotifications = (raw) => {
  const o = raw && typeof raw === "object" ? raw : {};
  return {
    newOrder:
      o.newOrder !== undefined
        ? Boolean(o.newOrder)
        : DEFAULT_NOTIFICATIONS.newOrder,
    cancelRequest:
      o.cancelRequest !== undefined
        ? Boolean(o.cancelRequest)
        : DEFAULT_NOTIFICATIONS.cancelRequest,
    newUser:
      o.newUser !== undefined ? Boolean(o.newUser) : DEFAULT_NOTIFICATIONS.newUser,
    newReview:
      o.newReview !== undefined
        ? Boolean(o.newReview)
        : DEFAULT_NOTIFICATIONS.newReview,
    paymentSuccess:
      o.paymentSuccess !== undefined
        ? Boolean(o.paymentSuccess)
        : DEFAULT_NOTIFICATIONS.paymentSuccess,
    blogComment:
      o.blogComment !== undefined
        ? Boolean(o.blogComment)
        : DEFAULT_NOTIFICATIONS.blogComment,
  };
};

const normalizeSlides = (slides) => {
  const safe = Array.isArray(slides) ? slides : [];
  const merged = DEFAULT_SLIDES.map((fallback, i) => {
    const s = safe[i] || {};
    const url = typeof s.url === "string" && s.url.trim() ? s.url.trim() : "";
    const alt =
      typeof s.alt === "string" && s.alt.trim() ? s.alt.trim() : fallback.alt;
    return { url: url || fallback.url, alt };
  });
  return merged;
};

export const getPublicSiteConfig = async (_req, res) => {
  try {
    const doc = await siteConfigModel
      .findOne({ key: DEFAULT_KEY })
      .select(
        "homeSlides maintenance logoUrl adminLogoUrl notifications updatedAt",
      );

    const homeSlides = normalizeSlides(doc?.homeSlides);
    const logoRaw = typeof doc?.logoUrl === "string" ? doc.logoUrl.trim() : "";
    const adminLogoRaw =
      typeof doc?.adminLogoUrl === "string" ? doc.adminLogoUrl.trim() : "";
    const notifications = normalizeNotifications(doc?.notifications);
    return res.json({
      success: true,
      homeSlides,
      logoUrl: logoRaw || "",
      adminLogoUrl: adminLogoRaw || "",
      notifications,
      maintenance: doc?.maintenance || null,
      updatedAt: doc?.updatedAt,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Không thể tải cấu hình website",
    });
  }
};

export const updateNotifications = async (req, res) => {
  try {
    const incoming = req.body?.notifications ?? req.body ?? {};
    const notifications = normalizeNotifications(incoming);

    const updated = await siteConfigModel.findOneAndUpdate(
      { key: DEFAULT_KEY },
      { $set: { notifications, updatedBy: req.userId || null } },
      { new: true, upsert: true },
    );

    return res.json({
      success: true,
      message: "Đã cập nhật cấu hình thông báo",
      notifications: normalizeNotifications(updated?.notifications),
      updatedAt: updated?.updatedAt,
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Không thể cập nhật cấu hình thông báo",
    });
  }
};

export const updateMaintenance = async (req, res) => {
  try {
    const enabledRaw = req.body?.enabled ?? req.query?.enabled;
    const enabled =
      enabledRaw === true ||
      enabledRaw === "true" ||
      enabledRaw === 1 ||
      enabledRaw === "1";

    const title =
      typeof req.body?.title === "string" ? req.body.title.trim() : undefined;
    const message =
      typeof req.body?.message === "string" ? req.body.message.trim() : undefined;
    const contact = req.body?.contact || {};

    const set = {
      "maintenance.enabled": enabled,
      updatedBy: req.userId || null,
    };
    if (title !== undefined) set["maintenance.title"] = title || "Đang bảo trì hệ thống";
    if (message !== undefined)
      set["maintenance.message"] =
        message || "Trang web đang cập nhật, vui lòng quay lại sau.";

    if (contact && typeof contact === "object") {
      if (typeof contact.name === "string")
        set["maintenance.contact.name"] = contact.name.trim();
      if (typeof contact.phone === "string")
        set["maintenance.contact.phone"] = contact.phone.trim();
      if (typeof contact.email === "string")
        set["maintenance.contact.email"] = contact.email.trim();
    }

    const updated = await siteConfigModel.findOneAndUpdate(
      { key: DEFAULT_KEY },
      { $set: set },
      { new: true, upsert: true },
    );

    return res.json({
      success: true,
      message: enabled ? "Đã bật chế độ bảo trì" : "Đã tắt chế độ bảo trì",
      maintenance: updated?.maintenance || null,
      homeSlides: normalizeSlides(updated?.homeSlides),
      updatedAt: updated?.updatedAt,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Không thể cập nhật chế độ bảo trì",
    });
  }
};

export const updateSiteLogo = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Thiếu file ảnh (field: image)",
      });
    }

    const secureUrl = await uploadBufferToCloudinary(
      file,
      CLOUDINARY_FOLDERS.branding,
    );

    const updated = await siteConfigModel.findOneAndUpdate(
      { key: DEFAULT_KEY },
      { $set: { logoUrl: secureUrl, updatedBy: req.userId || null } },
      { new: true, upsert: true },
    );

    return res.json({
      success: true,
      message: "Đã cập nhật logo website",
      logoUrl:
        typeof updated?.logoUrl === "string" ? updated.logoUrl.trim() : secureUrl,
      homeSlides: normalizeSlides(updated?.homeSlides),
      updatedAt: updated?.updatedAt,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Không thể cập nhật logo",
    });
  }
};

export const updateAdminLogo = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Thiếu file ảnh (field: image)",
      });
    }

    const secureUrl = await uploadBufferToCloudinary(
      file,
      CLOUDINARY_FOLDERS.branding,
    );

    const updated = await siteConfigModel.findOneAndUpdate(
      { key: DEFAULT_KEY },
      { $set: { adminLogoUrl: secureUrl, updatedBy: req.userId || null } },
      { new: true, upsert: true },
    );

    const adminLogoUrl =
      typeof updated?.adminLogoUrl === "string"
        ? updated.adminLogoUrl.trim()
        : secureUrl;

    return res.json({
      success: true,
      message: "Đã cập nhật logo admin",
      adminLogoUrl,
      homeSlides: normalizeSlides(updated?.homeSlides),
      updatedAt: updated?.updatedAt,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Không thể cập nhật logo admin",
    });
  }
};

export const updateHomeSlide = async (req, res) => {
  try {
    const slotRaw = req.body?.slot ?? req.query?.slot;
    const slot = Number(slotRaw);
    if (!Number.isFinite(slot) || slot < 1 || slot > 3) {
      return res.status(400).json({
        success: false,
        message: "slot không hợp lệ (1-3)",
      });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Thiếu file ảnh (field: image)",
      });
    }

    const secureUrl = await uploadBufferToCloudinary(
      file,
      CLOUDINARY_FOLDERS.banners,
    );

    const altRaw = req.body?.alt;
    const alt = typeof altRaw === "string" ? altRaw.trim() : "";

    const existing = await siteConfigModel.findOne({ key: DEFAULT_KEY });
    const current = normalizeSlides(existing?.homeSlides);
    current[slot - 1] = {
      url: secureUrl,
      alt: alt || current[slot - 1]?.alt || DEFAULT_SLIDES[slot - 1].alt,
    };

    const updated = await siteConfigModel.findOneAndUpdate(
      { key: DEFAULT_KEY },
      { $set: { homeSlides: current, updatedBy: req.userId || null } },
      { new: true, upsert: true },
    );

    return res.json({
      success: true,
      message: "Cập nhật banner thành công",
      homeSlides: normalizeSlides(updated?.homeSlides),
      updatedAt: updated?.updatedAt,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Không thể cập nhật banner",
    });
  }
};

