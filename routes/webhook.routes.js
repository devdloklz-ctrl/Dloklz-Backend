import express from "express";
import { verifyWooWebhook } from "../middleware/verifyWooWebhook.js";
import { handleNewOrderWebhook } from "../controllers/woocommerce.controller.js";

const router = express.Router();

router.post(
  "/order-created",
  verifyWooWebhook,      // 🔥 FIRST
  handleNewOrderWebhook  // 🔥 NO AUTH TOKEN HERE
);

export default router;
