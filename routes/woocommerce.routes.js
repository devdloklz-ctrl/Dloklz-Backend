import express from "express";
import { handleNewOrderWebhook, importWooData } from "../controllers/woocommerce.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { hasRole } from "../middleware/role.middleware.js";

const router = express.Router();

// Only Owner can import WooCommerce data
router.post("/import", verifyToken, hasRole(["owner"]), importWooData);
router.post("/order-created", verifyToken, hasRole(["owner"]), handleNewOrderWebhook);

export default router;
