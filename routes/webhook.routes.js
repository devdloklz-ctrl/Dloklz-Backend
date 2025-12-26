import express from "express";
import { verifyWooWebhook } from "../middleware/verifyWooWebhook.js";
import { handleNewOrderWebhook } from "../controllers/woocommerce.controller.js";

const router = express.Router();

router.post(
  "/order-created",
  verifyWooWebhook,      // 🔥 FIRST
  handleNewOrderWebhook  // 🔥 NO AUTH TOKEN HERE
);

router.get("/woocommerce", (req, res) => {
  console.log("⚠️ WooCommerce sent a GET to webhook URL (likely test validation)");
  res.status(200).json({ message: "WooCommerce Webhook endpoint active ✅" });
});

export default router;
