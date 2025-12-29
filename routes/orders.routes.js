import express from "express";
import {
  getOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/order.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { hasRole } from "../middleware/role.middleware.js";

const router = express.Router();

/**
 * GET /api/orders
 * List orders
 * Roles: owner, vendor
 */
router.get(
  "/",
  verifyToken,
  hasRole(["owner", "vendor"]),
  getOrders
);

/**
 * GET /api/orders/:id
 * Get order details
 * Roles: owner, vendor
 */
router.get(
  "/:id",
  verifyToken,
  hasRole(["owner", "vendor"]),
  getOrderById
);

/**
 * PATCH /api/orders/:id/status
 *
 * - Updates order status
 * - Auto-creates Delhivery shipment when status = "shipped"
 *
 * Roles:
 * - owner: can update anything
 * - vendor: can update orderStatus only
 */
router.patch(
  "/:id/status",
  verifyToken,
  hasRole(["owner", "vendor"]),
  updateOrderStatus
);

export default router;
