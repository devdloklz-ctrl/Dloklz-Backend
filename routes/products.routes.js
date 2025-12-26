import express from "express";
import Product from "../models/Product.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { hasRole } from "../middleware/role.middleware.js";

const router = express.Router();

router.get("/", verifyToken, hasRole(["owner", "vendor"]), async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

export default router;
