// routes/dashboard.routes.js

import express from "express";
import { getDashboardData } from "../controllers/dashboard.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// GET /api/dashboard
router.get("/", verifyToken, getDashboardData);

export default router;
