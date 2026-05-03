import mongoose from "mongoose";
import voucherModel from "../models/voucherModel.js";
import {
  voucherWasUsedBy,
  deriveVoucherStatus,
} from "../utils/voucherHelpers.js";

const ADMIN_LIST_PROJECTION =
  "_id code discountValue minOrderValue usageLimit usedCount expiryDate isActive status createdAt updatedAt";

// Lấy tất cả voucher cho Admin (không trả usedBy để payload nhẹ)
const getAllVouchers = async (req, res) => {
  try {
    const vouchers = await voucherModel
      .find({})
      .select(ADMIN_LIST_PROJECTION)
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, vouchers });
  } catch (error) {
    console.error("Error fetching vouchers:", error);
    res.json({ success: false, message: error.message });
  }
};

// Lấy voucher public — optional req.userId (JWT) để gắn usedByMe, không leak usedBy[]
const getPublicVouchers = async (req, res) => {
  try {
    const now = new Date();
    const filter = {
      isActive: true,
      expiryDate: { $gt: now },
      status: { $nin: ["exhausted", "expired"] },
      $expr: { $lt: ["$usedCount", "$usageLimit"] },
    };

    const raw = await voucherModel
      .find(filter)
      .sort({ discountValue: -1 })
      .lean();

    const userIdStr = req.userId != null ? String(req.userId) : null;

    const vouchers = raw.map(({ usedBy, ...rest }) => {
      const usedByMe =
        userIdStr &&
        voucherWasUsedBy(usedBy, userIdStr);
      return userIdStr
        ? { ...rest, usedByMe: Boolean(usedByMe) }
        : { ...rest };
    });

    res.json({ success: true, vouchers });
  } catch (error) {
    console.error("Error fetching public vouchers:", error);
    res.json({ success: false, message: error.message });
  }
};

// Admin tạo voucher mới
const createVoucher = async (req, res) => {
  try {
    let { code, discountValue, minOrderValue, usageLimit, expiryDate, isActive } =
      req.body;

    code = String(code || "")
      .trim()
      .toUpperCase();

    discountValue = Number(discountValue);
    minOrderValue = minOrderValue === "" || minOrderValue == null ? 0 : Number(minOrderValue);
    usageLimit = usageLimit === "" || usageLimit == null ? 100 : Number(usageLimit);

    if (!code) {
      return res.json({ success: false, message: "Thiếu mã voucher" });
    }
    if (!Number.isFinite(discountValue) || discountValue < 0) {
      return res.json({ success: false, message: "Giá trị giảm không hợp lệ" });
    }
    if (!Number.isFinite(minOrderValue) || minOrderValue < 0) {
      return res.json({ success: false, message: "Đơn tối thiểu không hợp lệ" });
    }
    if (!Number.isFinite(usageLimit) || usageLimit < 1) {
      return res.json({ success: false, message: "Giới hạn sử dụng phải ≥ 1" });
    }

    const expDate = expiryDate ? new Date(expiryDate) : null;
    if (!expDate || Number.isNaN(expDate.getTime())) {
      return res.json({ success: false, message: "Ngày hết hạn không hợp lệ" });
    }

    const existingVoucher = await voucherModel.findOne({ code }).lean();
    if (existingVoucher) {
      return res.json({ success: false, message: "Mã Voucher đã tồn tại" });
    }

    const draft = {
      code,
      discountValue,
      minOrderValue,
      usageLimit,
      expiryDate: expDate,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    };
    draft.status = deriveVoucherStatus(draft);

    const newVoucher = new voucherModel(draft);
    await newVoucher.save();
    res.json({ success: true, message: "Tạo Voucher thành công" });
  } catch (error) {
    console.error("Error creating voucher:", error);
    res.json({ success: false, message: error.message });
  }
};

// Admin sửa voucher
const updateVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.json({ success: false, message: "Id voucher không hợp lệ" });
    }

    const incoming = req.body || {};
    const patch = {};

    const allowedKeys = [
      "code",
      "discountValue",
      "minOrderValue",
      "usageLimit",
      "expiryDate",
      "isActive",
    ];
    for (const key of allowedKeys) {
      if (Object.prototype.hasOwnProperty.call(incoming, key)) {
        patch[key] = incoming[key];
      }
    }

    const doc = await voucherModel.findById(id);
    if (!doc) {
      return res.json({ success: false, message: "Không tìm thấy Voucher" });
    }

    if (patch.code !== undefined) {
      const nextCode = String(patch.code).trim().toUpperCase();
      const conflicting = await voucherModel.findOne({
        code: nextCode,
        _id: { $ne: id },
      }).lean();
      if (conflicting) {
        return res.json({ success: false, message: "Mã Voucher đã tồn tại ở một Voucher khác" });
      }
      doc.code = nextCode;
    }
    if (patch.discountValue !== undefined) {
      const dv = Number(patch.discountValue);
      if (!Number.isFinite(dv) || dv < 0) {
        return res.json({ success: false, message: "Giá trị giảm không hợp lệ" });
      }
      doc.discountValue = dv;
    }
    if (patch.minOrderValue !== undefined) {
      const mv = patch.minOrderValue === "" ? 0 : Number(patch.minOrderValue);
      if (!Number.isFinite(mv) || mv < 0) {
        return res.json({ success: false, message: "Đơn tối thiểu không hợp lệ" });
      }
      doc.minOrderValue = mv;
    }
    if (patch.usageLimit !== undefined) {
      const ul = patch.usageLimit === "" ? NaN : Number(patch.usageLimit);
      if (!Number.isFinite(ul) || ul < 1) {
        return res.json({ success: false, message: "Giới hạn sử dụng phải ≥ 1" });
      }
      doc.usageLimit = ul;
    }
    if (patch.expiryDate !== undefined) {
      const expDate = patch.expiryDate ? new Date(patch.expiryDate) : null;
      if (!expDate || Number.isNaN(expDate.getTime())) {
        return res.json({ success: false, message: "Ngày hết hạn không hợp lệ" });
      }
      doc.expiryDate = expDate;
    }
    if (patch.isActive !== undefined) {
      doc.isActive = Boolean(patch.isActive);
    }

    doc.status = deriveVoucherStatus(doc);
    await doc.save();

    res.json({
      success: true,
      message: "Cập nhật Voucher thành công",
      voucher: doc.toJSON(),
    });
  } catch (error) {
    console.error("Error updating voucher:", error);
    res.json({ success: false, message: error.message });
  }
};

// Admin xoá voucher
const deleteVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.json({ success: false, message: "Id voucher không hợp lệ" });
    }
    const deletedVoucher = await voucherModel.findByIdAndDelete(id);
    if (!deletedVoucher) {
      return res.json({ success: false, message: "Không tìm thấy Voucher" });
    }
    res.json({ success: true, message: "Xóa Voucher thành công" });
  } catch (error) {
    console.error("Error deleting voucher:", error);
    res.json({ success: false, message: error.message });
  }
};

// Frontend Áp dụng voucher
const applyVoucher = async (req, res) => {
  try {
    const { code, orderValue } = req.body;
    const userId = req.userId;

    if (!code || orderValue === undefined) {
      return res.json({ success: false, message: "Thiếu thông tin mã hoặc giá trị đơn hàng" });
    }

    const codeNorm = String(code).trim().toUpperCase();

    const voucher = await voucherModel.findOne({ code: codeNorm });

    if (!voucher) {
      return res.json({ success: false, message: "Mã giảm giá không tồn tại" });
    }

    if (!voucher.isActive || voucher.status !== "active") {
      if (voucher.status === "expired") {
        return res.json({ success: false, message: "Mã giảm giá đã hết hạn" });
      }
      if (voucher.status === "exhausted") {
        return res.json({ success: false, message: "Mã đã hết lượt sử dụng" });
      }
      return res.json({ success: false, message: "Mã giảm giá đã bị vô hiệu hóa" });
    }

    if (voucherWasUsedBy(voucher.usedBy, userId)) {
      return res.json({ success: false, message: "Bạn đã sử dụng mã này cho đơn hàng khác" });
    }

    if (new Date(voucher.expiryDate) < new Date()) {
      voucher.status = "expired";
      await voucher.save();
      return res.json({ success: false, message: "Mã đã hết hạn" });
    }

    if (voucher.usedCount >= voucher.usageLimit) {
      voucher.status = "exhausted";
      await voucher.save();
      return res.json({ success: false, message: "Mã đã hết lượt sử dụng" });
    }

    if (Number(orderValue) < voucher.minOrderValue) {
      return res.json({
        success: false,
        message: `Đơn hàng tối thiểu để áp dụng mã là ${voucher.minOrderValue.toLocaleString()}đ`,
      });
    }

    let finalDiscount = voucher.discountValue;

    if (finalDiscount > orderValue) {
      finalDiscount = orderValue;
    }

    res.json({
      success: true,
      discountAmount: finalDiscount,
      code: voucher.code,
      message: "Áp dụng mã giảm giá thành công!",
    });
  } catch (error) {
    console.error("Error applying voucher:", error);
    res.json({ success: false, message: error.message });
  }
};

export { getAllVouchers, getPublicVouchers, createVoucher, updateVoucher, deleteVoucher, applyVoucher };
