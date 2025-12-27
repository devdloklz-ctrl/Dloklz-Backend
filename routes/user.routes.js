import express from "express";
import { getAllUsers } from "../controllers/user.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { hasRole } from "../middleware/role.middleware.js";

const router = express.Router();

/**
 * Owner only
 */
router.get(
  "/",
  verifyToken,
  hasRole(["owner",]),
  getAllUsers
);

export default router;
