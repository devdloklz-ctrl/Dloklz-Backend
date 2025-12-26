import express from "express";
import Order from "../models/Order.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { hasRole } from "../middleware/role.middleware.js";

const router = express.Router();

router.get("/", verifyToken, hasRole(["owner", "vendor"]), async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

export default router;
