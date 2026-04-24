import tourModel from "../models/TourModel.js";
import scheduleModel from "../models/scheduleModel.js";
import {
  uploadBufferToCloudinary,
  CLOUDINARY_FOLDERS,
} from "../services/cloudinaryUpload.js";
import {
  TOUR_CATEGORY_ENUM,
  normalizeTourCategory,
} from "../constants/tourCategories.js";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATE_TIME_LOCAL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const MONGO_ID_24_HEX = /^[a-fA-F0-9]{24}$/;
const TOUR_LIST_CACHE_TTL_MS = 30 * 1000;
const tourListCache = new Map();

function buildTourListCacheKey(includeInactive) {
  return `tour:list:${includeInactive === "true" ? "all" : "active"}`;
}

function getCachedTourList(cacheKey) {
  const cached = tourListCache.get(cacheKey);
  if (!cached) return null;
  if (Date.now() - cached.ts > TOUR_LIST_CACHE_TTL_MS) {
    tourListCache.delete(cacheKey);
    return null;
  }
  return cached.data;
}

function setCachedTourList(cacheKey, data) {
  tourListCache.set(cacheKey, { ts: Date.now(), data });
}

function invalidateTourListCache() {
  tourListCache.clear();
}

function mapTourWriteError(error) {
  if (error?.code === 11000) {
    if (error?.keyPattern?.slug) {
      return "Slug tour đã tồn tại. Vui lòng đổi tên tour khác.";
    }
    if (error?.keyPattern?.title) {
      return "Tên tour đang bị ràng buộc unique ở DB. Chạy script migrate để bỏ index title_1 rồi thử lại.";
    }
  }
  return `Lỗi: ${error?.message || "Không xác định"}`;
}

const slugifyTourTitle = (value = "") =>
  String(value)
    .replace(/\u0110|\u0111/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

async function generateUniqueTourSlug(title, excludeId = null) {
  const base = slugifyTourTitle(title) || "tour";
  const queryBase = excludeId
    ? { _id: { $ne: excludeId } }
    : {};
  let candidate = base;
  let i = 2;
  while (true) {
    const existed = await tourModel.exists({
      ...queryBase,
      slug: candidate,
    });
    if (!existed) return candidate;
    candidate = `${base}-${i}`;
    i += 1;
  }
}

async function resolveTourByKey(tourKey) {
  const key = String(tourKey || "").trim();
  if (!key) return null;
  if (MONGO_ID_24_HEX.test(key)) {
    const byId = await tourModel.findById(key);
    if (byId) return byId;
  }
  const bySlug = await tourModel.findOne({ slug: key.toLowerCase() });
  if (bySlug) return bySlug;

  // Backward compatibility cho dữ liệu cũ chưa có field slug.
  const legacyTours = await tourModel
    .find({
      $or: [{ slug: { $exists: false } }, { slug: null }, { slug: "" }],
    })
    .select("_id title");
  const match = legacyTours.find((x) => slugifyTourTitle(x.title) === key.toLowerCase());
  if (!match) return null;

  const hydrated = await tourModel.findById(match._id);
  if (!hydrated) return null;
  const persistedSlug = await generateUniqueTourSlug(hydrated.title, hydrated._id);
  await tourModel.findByIdAndUpdate(hydrated._id, { slug: persistedSlug });
  hydrated.slug = persistedSlug;
  return hydrated;
}

/** Slot: `YYYY-MM-DD` hoặc `YYYY-MM-DD|HH:mm` → Date (VN +07:00), hoặc null nếu không parse được */
function scheduleSlotToStartDate(slot) {
  const raw = String(slot ?? "").trim();
  if (!raw) return null;

  let datePart;
  let timePart = "07:00";
  if (raw.includes("|")) {
    const parts = raw.split("|").map((x) => x.trim()).filter(Boolean);
    datePart = parts[0];
    if (parts[1]) timePart = parts[1];
  } else {
    datePart = raw;
  }

  if (!datePart || !ISO_DATE.test(datePart)) return null;

  const [hh = "07", mm = "00"] = String(timePart).split(":");
  const h = String(Math.min(23, Math.max(0, parseInt(hh, 10) || 0))).padStart(2, "0");
  const m = String(Math.min(59, Math.max(0, parseInt(mm, 10) || 0))).padStart(2, "0");
  const d = new Date(`${datePart}T${h}:${m}:00+07:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function buildSchedulesFromSlots(finalDates, tourId, maxGroupSize) {
  const n = Number(maxGroupSize) || 0;
  const out = [];
  for (const slot of finalDates || []) {
    const startDate = scheduleSlotToStartDate(slot);
    if (!startDate) continue;
    out.push({
      tourId,
      startDate,
      maxGroupSize: n,
      joinedParticipants: 0,
    });
  }
  return out;
}

function parseSaleDateInput(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  if (ISO_DATE_TIME_LOCAL.test(raw)) {
    const parsed = new Date(`${raw}:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (ISO_DATE.test(raw)) {
    const parsed = new Date(`${raw}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const fallback = new Date(raw);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

const withSaleMeta = (tourDoc) => {
  const obj = tourDoc?.toObject ? tourDoc.toObject() : { ...tourDoc };
  const normalizedImages = Array.isArray(obj.images)
    ? obj.images
    : obj.image
      ? [obj.image]
      : [];
  const coverImage = normalizedImages[0] || "";
  const now = Date.now();
  const start = obj.saleStartDate ? new Date(obj.saleStartDate).getTime() : null;
  const end = obj.saleEndDate ? new Date(obj.saleEndDate).getTime() : null;
  const hasWindow = Number.isFinite(start) && Number.isFinite(end);
  const isInWindow = hasWindow && now >= start && now <= end;
  let saleStatus = "none";
  if (obj.isSale && hasWindow) {
    if (now < start) saleStatus = "pending";
    else if (now > end) saleStatus = "expired";
    else saleStatus = "active";
  }
  const canApplySale =
    obj.isSale === true &&
    isInWindow &&
    Number(obj.discountPercent) > 0 &&
    Number(obj.discountPercent) < 100;
  const basePrice = Number(obj.price) || 0;
  const salePrice = canApplySale
    ? Math.max(0, Math.round(basePrice * (1 - Number(obj.discountPercent) / 100)))
    : basePrice;
  const slug = obj.slug || slugifyTourTitle(obj.title || "");

  return {
    ...obj,
    images: normalizedImages,
    image: coverImage,
    isSaleActive: canApplySale,
    saleStatus,
    salePrice,
    displayPrice: salePrice,
    originalPrice: basePrice,
    slug,
  };
};

// --- HÀM BỔ TRỢ: TÍNH TOÁN NGÀY THEO THỨ ĐÃ CHỌN ---
const generateDates = (bookingMode, availableDates, autoSchedule) => {
  let finalDates = [];

  if (bookingMode === "auto" && autoSchedule) {
    try {
      const parsedAuto =
        typeof autoSchedule === "string"
          ? JSON.parse(autoSchedule)
          : autoSchedule;

      const { startDate, endDate, selectedDays, departureTime = "07:00" } =
        parsedAuto;

      if (
        !startDate ||
        !endDate ||
        !selectedDays ||
        !Array.isArray(selectedDays)
      ) {
        return [];
      }

      const timePart = String(departureTime).slice(0, 5) || "07:00";

      let current = new Date(startDate);
      current.setHours(7, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(7, 0, 0, 0);

      while (current <= end) {
        if (selectedDays.includes(current.getDay())) {
          finalDates.push(`${current.toISOString().split("T")[0]}|${timePart}`);
        }
        current.setDate(current.getDate() + 1);
      }
    } catch (error) {
      console.error("Lỗi parse autoSchedule:", error);
      return [];
    }
  } else {
    try {
      finalDates =
        typeof availableDates === "string"
          ? JSON.parse(availableDates)
          : availableDates;
    } catch (e) {
      finalDates = [];
    }
  }
  return (finalDates || []).filter((s) => String(s).trim().length > 0);
};

const getUploadedTourFiles = (req) => {
  if (Array.isArray(req.files)) {
    return req.files.filter(Boolean);
  }
  if (req.files && typeof req.files === "object") {
    const imagesFromArray = (req.files.images || []).filter(Boolean);
    const imagesFromSingle = (req.files.image || []).filter(Boolean);
    return [...imagesFromArray, ...imagesFromSingle];
  }
  return [];
};

// 1. Thêm Tour mới (Đã sửa thêm duration)
const addTour = async (req, res) => {
  try {
    const {
      title,
      city,
      price,
      oldPrice,
      maxGroupSize,
      duration, // <-- THÊM DÒNG NÀY
      desc,
      featured,
      availableDates,
      category,
      region,
      bookingMode,
      autoSchedule,
      itinerary,
    } = req.body;

    const uploadedFiles = getUploadedTourFiles(req);
    if (uploadedFiles.length !== 3) {
      return res.json({
        success: false,
        message: "Vui lòng tải lên đúng 3 ảnh cho tour",
      });
    }
    const uploadedImages = await Promise.all(
      uploadedFiles.map((file) =>
        uploadBufferToCloudinary(file, CLOUDINARY_FOLDERS.tours),
      ),
    );

    const finalDates = generateDates(bookingMode, availableDates, autoSchedule);

    const categoryNorm = normalizeTourCategory(category);
    if (!TOUR_CATEGORY_ENUM.includes(categoryNorm)) {
      return res.json({ success: false, message: "Loại hình tour không hợp lệ" });
    }
    const slug = await generateUniqueTourSlug(title);

    const priceNum = Number(price);
    const maxGsNum = Number(maxGroupSize);
    const durationNum = Number(duration);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      return res.json({ success: false, message: "Giá bán không hợp lệ" });
    }
    if (!Number.isFinite(maxGsNum) || maxGsNum < 1) {
      return res.json({
        success: false,
        message: "Số khách tối đa không hợp lệ",
      });
    }
    const tourData = {
      title,
      slug,
      city,
      price: priceNum,
      oldPrice: Number(oldPrice) || 0,
      maxGroupSize: maxGsNum,
      duration: Number.isFinite(durationNum) && durationNum >= 1 ? durationNum : 1,
      desc,
      itinerary: (() => {
        try {
          const parsed = typeof itinerary === "string" ? JSON.parse(itinerary) : itinerary;
          return Array.isArray(parsed)
            ? parsed.filter((item) => item?.dayTitle && item?.content)
            : [];
        } catch {
          return [];
        }
      })(),
      featured: featured === "true" || featured === true,
      availableDates: finalDates,
      images: uploadedImages,
      category: categoryNorm,
      region,
    };

    const newTour = new tourModel(tourData);
    const savedTour = await newTour.save();

    if (finalDates.length > 0) {
      const schedules = buildSchedulesFromSlots(
        finalDates,
        savedTour._id,
        maxGroupSize,
      );
      if (schedules.length === 0) {
        await tourModel.findByIdAndDelete(savedTour._id);
        return res.json({
          success: false,
          message:
            "Không tạo được lịch khởi hành: ngày/giờ không hợp lệ. Kiểm tra từng ngày (định dạng YYYY-MM-DD).",
        });
      }
      await scheduleModel.insertMany(schedules);
    }
    invalidateTourListCache();

    res.json({
      success: true,
      message: `Thêm Tour và ${finalDates.length} lịch trình thành công!`,
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: mapTourWriteError(error) });
  }
};

// 2. Cập nhật Tour (Đã sửa thêm duration)
const updateTour = async (req, res) => {
  try {
    const { id: tourKey } = req.params;
    const { bookingMode, availableDates, autoSchedule, duration } = req.body; // <-- LẤY DURATION RA
    let updateData = { ...req.body };
    delete updateData.season;
    delete updateData.distance;
    const existingTour = await resolveTourByKey(tourKey);
    if (!existingTour) {
      return res.json({ success: false, message: "Không tìm thấy tour" });
    }
    const tourId = existingTour._id;
    if (updateData.category !== undefined) {
      const categoryNorm = normalizeTourCategory(updateData.category);
      if (!TOUR_CATEGORY_ENUM.includes(categoryNorm)) {
        return res.json({ success: false, message: "Loại hình tour không hợp lệ" });
      }
      updateData.category = categoryNorm;
    }
    if (updateData.title !== undefined) {
      const nextTitle = String(updateData.title || "").trim();
      if (!nextTitle) {
        return res.json({ success: false, message: "Tên tour không hợp lệ" });
      }
      if (nextTitle !== existingTour.title) {
        updateData.slug = await generateUniqueTourSlug(nextTitle, tourId);
      } else if (!existingTour.slug) {
        updateData.slug = await generateUniqueTourSlug(nextTitle, tourId);
      }
    }

    const uploadedFiles = getUploadedTourFiles(req);
    if (uploadedFiles.length > 0 && uploadedFiles.length !== 3) {
      return res.json({
        success: false,
        message: "Nếu cập nhật ảnh, vui lòng tải đủ 3 ảnh mới",
      });
    }
    const uploadedImages =
      uploadedFiles.length > 0
        ? await Promise.all(
            uploadedFiles.map((file) =>
              uploadBufferToCloudinary(file, CLOUDINARY_FOLDERS.tours),
            ),
          )
        : [];
    if (uploadedImages.length > 0) {
      updateData.images = uploadedImages;
    }

    // Ép kiểu số tránh lỗi tính toán
    ["price", "oldPrice", "maxGroupSize", "duration"].forEach(
      (field) => {
        if (updateData[field]) updateData[field] = Number(updateData[field]);
      },
    );

    if (updateData.featured !== undefined) {
      updateData.featured =
        updateData.featured === "true" || updateData.featured === true;
    }

    if (updateData.itinerary !== undefined) {
      try {
        const parsed =
          typeof updateData.itinerary === "string"
            ? JSON.parse(updateData.itinerary)
            : updateData.itinerary;
        updateData.itinerary = Array.isArray(parsed)
          ? parsed.filter((item) => item?.dayTitle && item?.content)
          : [];
      } catch {
        updateData.itinerary = [];
      }
    }

    const finalDates = generateDates(bookingMode, availableDates, autoSchedule);
    updateData.availableDates = finalDates;

    const existingForSize = await tourModel.findById(tourId).select("maxGroupSize");
    const maxGs =
      Number(updateData.maxGroupSize) ||
      existingForSize?.maxGroupSize ||
      10;

    let schedulesToInsert = [];
    if (finalDates.length > 0) {
      schedulesToInsert = buildSchedulesFromSlots(finalDates, tourId, maxGs);
      if (schedulesToInsert.length === 0) {
        return res.json({
          success: false,
          message:
            "Không cập nhật được lịch: ngày/giờ khởi hành không hợp lệ. Xóa các dòng lịch sai hoặc nhập lại ngày (YYYY-MM-DD) và giờ.",
        });
      }
    }

    const updatedTour = await tourModel.findByIdAndUpdate(tourId, updateData, {
      new: true,
    });

    if (schedulesToInsert.length > 0) {
      await scheduleModel.deleteMany({ tourId: tourId });
      await scheduleModel.insertMany(schedulesToInsert);
    }
    invalidateTourListCache();

    res.json({ success: true, message: "Cập nhật thành công!", updatedTour });
  } catch (error) {
    res.json({ success: false, message: mapTourWriteError(error) });
  }
};

const listTours = async (req, res) => {
  try {
    const { includeInactive } = req.query;
    const cacheKey = buildTourListCacheKey(includeInactive);
    const cachedTours = getCachedTourList(cacheKey);
    if (cachedTours) {
      return res.json({ success: true, tours: cachedTours, cached: true });
    }
    const query =
      includeInactive === "true"
        ? {}
        : { $or: [{ isActive: true }, { isActive: { $exists: false } }] };
    const tours = await tourModel.find(query).sort({ createdAt: -1 }).lean();
    const toursWithMeta = tours.map(withSaleMeta);
    setCachedTourList(cacheKey, toursWithMeta);
    res.json({ success: true, tours: toursWithMeta });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const listOnSaleTours = async (req, res) => {
  try {
    const cacheKey = "tour:on-sale";
    const cachedTours = getCachedTourList(cacheKey);
    if (cachedTours) {
      return res.json({ success: true, tours: cachedTours, cached: true });
    }
    const tours = await tourModel
      .find({ isSale: true, discountPercent: { $gt: 0 } })
      .sort({ updatedAt: -1 })
      .lean();
    const toursWithMeta = tours.map(withSaleMeta);
    setCachedTourList(cacheKey, toursWithMeta);
    res.json({ success: true, tours: toursWithMeta });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const updateSaleForTours = async (req, res) => {
  try {
    const {
      applyToAll = false,
      tourIds = [],
      isSale = false,
      discountPercent = 0,
      saleStartDate,
      saleEndDate,
    } = req.body;

    const query =
      applyToAll === true || applyToAll === "true"
        ? {}
        : { _id: { $in: Array.isArray(tourIds) ? tourIds : [] } };

    if (!(applyToAll === true || applyToAll === "true") && !query._id.$in.length) {
      return res.json({ success: false, message: "Vui lòng chọn tour để cập nhật sale" });
    }

    const saleEnabled = isSale === true || isSale === "true";
    const parsedSaleStartDate = parseSaleDateInput(saleStartDate);
    const parsedSaleEndDate = parseSaleDateInput(saleEndDate);

    if (saleEnabled) {
      if (!parsedSaleStartDate || !parsedSaleEndDate) {
        return res.json({
          success: false,
          message: "Thiếu hoặc sai định dạng thời gian sale (bắt đầu/kết thúc)",
        });
      }
      if (parsedSaleStartDate.getTime() > parsedSaleEndDate.getTime()) {
        return res.json({
          success: false,
          message: "Thời gian bắt đầu sale không được sau thời gian kết thúc",
        });
      }
    }

    const updateData = saleEnabled
      ? {
          isSale: true,
          discountPercent: Math.min(100, Math.max(0, Number(discountPercent) || 0)),
          saleStartDate: parsedSaleStartDate,
          saleEndDate: parsedSaleEndDate,
        }
      : {
          isSale: false,
          discountPercent: 0,
          saleStartDate: null,
          saleEndDate: null,
        };

    await tourModel.updateMany(query, { $set: updateData });
    const updatedCount = await tourModel.countDocuments(query);
    invalidateTourListCache();

    res.json({
      success: true,
      message: saleEnabled
        ? `Đã cập nhật khuyến mãi cho ${updatedCount} tour`
        : `Đã tắt khuyến mãi cho ${updatedCount} tour`,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const toggleTourStatus = async (req, res) => {
  try {
    const { id, isActive } = req.body;
    const tour = await tourModel.findByIdAndUpdate(
      id,
      { isActive: Boolean(isActive) },
      { new: true },
    );
    if (!tour) {
      return res.json({ success: false, message: "Không tìm thấy tour" });
    }
    invalidateTourListCache();
    res.json({
      success: true,
      message: tour.isActive ? "Tour đang hoạt động trở lại" : "Tour đã ngưng kinh doanh",
      tour,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const removeTour = async (req, res) => {
  try {
    const { id } = req.body;
    await tourModel.findByIdAndDelete(id);
    await scheduleModel.deleteMany({ tourId: id });
    invalidateTourListCache();
    res.json({
      success: true,
      message: "Đã xóa Tour và toàn bộ lịch trình liên quan!",
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const getSingleTour = async (req, res) => {
  try {
    const tour = await resolveTourByKey(req.params.id);
    if (!tour) {
      return res.json({ success: false, message: "Không tìm thấy tour" });
    }
    res.json({ success: true, tour: withSaleMeta(tour) });
  } catch (error) {
    res.json({ success: false, message: "Không tìm thấy tour" });
  }
};

export {
  addTour,
  listTours,
  removeTour,
  updateTour,
  getSingleTour,
  toggleTourStatus,
  listOnSaleTours,
  updateSaleForTours,
};
