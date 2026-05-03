import termsModel from "../models/termsModel.js";

export const DEFAULT_SECTION_TITLES = [
  "Thông tin chung & Xác nhận",
  "Quy định Thanh toán (MoMo)",
  "Chính sách Hủy tour & Hoàn tiền",
  "Bảo mật & Dữ liệu (Cloudinary/AI)",
  "Trách nhiệm khách hàng",
  "Thay đổi điều khoản",
];

export const MIN_SECTIONS = 1;
export const MAX_SECTIONS = 40;

export function buildDefaultSections() {
  return DEFAULT_SECTION_TITLES.map((title, order) => ({
    title,
    content: `<p>Nội dung <strong>${title}</strong>. Vui lòng cập nhật chi tiết phù hợp trong Admin.</p>`,
    order,
  }));
}

/** Chuẩn hoá mảng sections khi đọc (giữ số lượng bản ghi, chỉ sửa thiếu title/content & order) */
function normalizeStoredSections(sections) {
  if (!Array.isArray(sections) || sections.length === 0) {
    return buildDefaultSections();
  }
  return sections.map((s, order) => ({
    title:
      typeof s?.title === "string" && s.title.trim()
        ? s.title.trim()
        : `Mục ${order + 1}`,
    content:
      typeof s?.content === "string" ? s.content : "<p></p>",
    order,
  }));
}

async function ensureTermsDocument() {
  let doc = await termsModel.findOne().sort({ _id: 1 });
  if (!doc) {
    return await termsModel.create({
      sections: buildDefaultSections(),
      lastUpdated: new Date(),
    });
  }

  if (!Array.isArray(doc.sections) || doc.sections.length === 0) {
    return await termsModel.findByIdAndUpdate(
      doc._id,
      {
        sections: buildDefaultSections(),
        lastUpdated: new Date(),
      },
      { new: true, runValidators: true },
    );
  }

  return doc;
}

/** GET — trả điều khoản; nếu chưa có document hoặc mảng rỗng thì seed mặc định */
export async function getTerms(req, res) {
  try {
    const doc = await ensureTermsDocument();
    const merged = normalizeStoredSections(doc.sections);
    const payload = {
      ...doc.toObject(),
      sections: merged,
    };
    res.json({ success: true, terms: payload });
  } catch (error) {
    console.error("getTerms:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/** PUT — cập nhật toàn bộ danh sách mục (số lượng linh hoạt) */
export async function updateTerms(req, res) {
  try {
    const incoming = req.body?.sections;

    if (!Array.isArray(incoming)) {
      return res.status(400).json({
        success: false,
        message: "Thiếu mảng sections",
      });
    }

    if (incoming.length < MIN_SECTIONS || incoming.length > MAX_SECTIONS) {
      return res.status(400).json({
        success: false,
        message: `Cần từ ${MIN_SECTIONS} đến ${MAX_SECTIONS} mục điều khoản`,
      });
    }

    const sections = incoming.map((s, order) => {
      const title = typeof s?.title === "string" ? s.title.trim() : "";
      const content =
        typeof s?.content === "string" ? s.content : "";

      return { title, content, order };
    });

    for (let i = 0; i < sections.length; i++) {
      if (!sections[i].title) {
        return res.status(400).json({
          success: false,
          message: `Mục thứ ${i + 1} thiếu tiêu đề`,
        });
      }
    }

    const basis = await ensureTermsDocument();

    const doc = await termsModel
      .findByIdAndUpdate(
        basis._id,
        {
          sections,
          lastUpdated: new Date(),
          updatedBy: req.userId || null,
        },
        { new: true, runValidators: true },
      )
      .lean();

    res.json({
      success: true,
      message: "Đã cập nhật điều khoản thành công!",
      terms: doc,
    });
  } catch (error) {
    console.error("updateTerms:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}
