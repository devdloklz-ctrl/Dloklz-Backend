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
import { updatePickupLocation, getPickupLocation, getPickupLocations, createPickupLocation } from "../controllers/vendorPickup.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { hasRole } from "../middleware/role.middleware.js";

const router = express.Router();

router.post("/sync", syncVendorsFromWoo);
router.get("/new", getNewVendors);
router.post("/register-access", verifyToken, hasRole(["owner"]), registerVendorAccess);

// Pickup location routes - put BEFORE :id route
router.get("/pickup-location", verifyToken, hasRole(["vendor"]), getPickupLocations);
router.get("/pickup-location/:id", verifyToken, hasRole(["vendor"]), getPickupLocation);
router.post("/pickup-location", verifyToken, hasRole(["vendor"]), createPickupLocation);
router.put("/pickup-location/:id", verifyToken, hasRole(["vendor"]), updatePickupLocation);

// Dynamic :id route - put AFTER all specific routes
router.get("/", getVendors);
router.get("/:id", getVendor);
router.put("/:id", updateVendor);
router.delete("/:id", deleteVendor);

export default router;
