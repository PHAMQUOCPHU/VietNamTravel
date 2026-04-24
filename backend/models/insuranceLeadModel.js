import mongoose from "mongoose";

const insuranceLeadSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true },
    partner: { type: String, required: true, trim: true },
    consentShareForInsuranceAdvice: { type: Boolean, required: true, default: false },
    source: { type: String, default: "about-page-insurance" },
  },
  { timestamps: true },
);

insuranceLeadSchema.index({ createdAt: -1 });
insuranceLeadSchema.index({ partner: 1 });

const insuranceLeadModel =
  mongoose.models.insuranceLead ||
  mongoose.model("insuranceLead", insuranceLeadSchema);

export default insuranceLeadModel;
