import express from "express";
import { getProducts, getProductById, getCategories } from "../controllers/product.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { hasRole } from "../middleware/role.middleware.js";

const router = express.Router();

/**
 * GET /api/products
 * List products with pagination
 */
router.get("/", verifyToken, hasRole(["owner", "vendor"]), getProducts);

/**
 * GET /api/products/categories
 * List of categories
 */
router.get("/categories", verifyToken, hasRole(["owner", "vendor"]), getCategories);

/**
 * GET /api/products/:id
 * Get single product details by wooId
 */
router.get("/:id", verifyToken, hasRole(["owner", "vendor"]), getProductById);

export default router;
