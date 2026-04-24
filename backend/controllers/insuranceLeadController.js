import insuranceLeadModel from "../models/insuranceLeadModel.js";

export const createInsuranceLead = async (req, res) => {
  try {
    const { fullName, phone, email, partner, consentShareForInsuranceAdvice, source } =
      req.body;

    if (!fullName?.trim() || !phone?.trim() || !partner?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập họ tên, số điện thoại và chọn đối tác bảo hiểm.",
      });
    }

    if (!consentShareForInsuranceAdvice) {
      return res.status(400).json({
        success: false,
        message: "Cần đồng ý chia sẻ thông tin để gửi yêu cầu tư vấn.",
      });
    }

    const doc = await insuranceLeadModel.create({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: (email || "").trim(),
      partner: partner.trim(),
      consentShareForInsuranceAdvice: true,
      source: source || "about-page-insurance",
    });

    return res.status(201).json({
      success: true,
      message: "Đã ghi nhận yêu cầu tư vấn.",
      lead: doc,
    });
  } catch (error) {
    console.error("createInsuranceLead:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi lưu yêu cầu tư vấn.",
    });
  }
};

export const listInsuranceLeadsAdmin = async (req, res) => {
  try {
    const leads = await insuranceLeadModel
      .find({})
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      leads,
    });
  } catch (error) {
    console.error("listInsuranceLeadsAdmin:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi tải danh sách.",
    });
  }
};
