// routes/vendor.routes.js
import express from "express";
import {
  syncVendorsFromWoo,
  getNewVendors,
  getVendors,
  getVendor,
  updateVendor,
  deleteVendor,
  registerVendorAccess,
} from "../controllers/vendor.controller.js";

const router = express.Router();

router.post("/sync", syncVendorsFromWoo);
router.get("/new", getNewVendors);

router.get("/", getVendors);
router.get("/:id", getVendor);
router.put("/:id", updateVendor);
router.delete("/:id", deleteVendor);

router.post("/register-access", registerVendorAccess);

export default router;
