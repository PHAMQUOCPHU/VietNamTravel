import express from "express";
import { getSafetyAlerts } from "../controllers/safetyController.js";

const safetyRouter = express.Router();

safetyRouter.get("/alerts", getSafetyAlerts);

export default safetyRouter;
