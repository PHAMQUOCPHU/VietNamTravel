import express from "express";
import adminAuth from "../middlewares/adminAuth.js";
import {
  createInsuranceLead,
  listInsuranceLeadsAdmin,
} from "../controllers/insuranceLeadController.js";

const insuranceLeadRouter = express.Router();

insuranceLeadRouter.post("/", createInsuranceLead);
insuranceLeadRouter.get("/admin", adminAuth, listInsuranceLeadsAdmin);

export default insuranceLeadRouter;
