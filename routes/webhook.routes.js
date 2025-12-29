import express from "express";
import { verifyWooWebhook } from "../middleware/verifyWooWebhook.js";
import { handleNewOrderWebhook } from "../controllers/woocommerce.controller.js";
import { delhiveryWebhook } from "../controllers/delhiveryWebhook.controller.js";

const router = express.Router();

router.post(
  "/order-created",
  verifyWooWebhook,
  (req, res, next) => {
    // Convert raw buffer to JSON
    try {
      req.body = JSON.parse(req.body.toString("utf8"));
      next();
    } catch (err) {
      return res.status(400).json({ message: "Invalid JSON body" });
    }
  },
  handleNewOrderWebhook
);

router.post("/delhivery", express.json(), delhiveryWebhook);

export default router;
