import Vendor from "../models/Vendor.js";
import PickupLocation from "../models/PickupLocation.js";
import {
  createOrUpdatePickupLocation,
  deletePickupLocationFromDelhivery,
} from "../services/delhiveryPickup.service.js";

/**
 * GET all pickup locations
 */
export const getPickupLocations = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;
    if (!vendorId) {
      return res.status(403).json({ message: "Not a vendor" });
    }

    const locations = await PickupLocation.find({
      vendorId,
      isActive: true,
    }).sort({ createdAt: -1 });

    res.json({ pickupLocations: locations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch pickup locations" });
  }
};

/**
 * GET single pickup location
 */
export const getPickupLocation = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;
    const { id } = req.params;

    const location = await PickupLocation.findOne({
      _id: id,
      vendorId,
    });

    if (!location) {
      return res.status(404).json({ message: "Pickup location not found" });
    }

    res.json(location);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch pickup location" });
  }
};

/**
 * CREATE pickup location
 */
export const createPickupLocation = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;

    const vendor = await Vendor.findOne({ id: vendorId });
    console.log("Vendor:", vendor.id);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const {
      name,
      address,
      city,
      state,
      pincode,
      phone,
      email,
    } = req.body;

    if (!name || !address || !city || !state || !pincode || !phone || !email) {
      return res.status(400).json({
        message: "All fields including email, city and state are required",
      });
    }

    // 🔁 Sync with Delhivery
    const delhiveryPayload = {
      name,
      phone,
      email,
      address,
      city,
      state,
      pin: pincode,
      return_address: address,
      return_city: city,
      return_pin: pincode,
      return_state: state,
    };

    const delhiveryResp = await createOrUpdatePickupLocation(delhiveryPayload);

    console.log("Delhivery Resp:", delhiveryResp);
    if (delhiveryResp?.success !== true) {
      return res.status(400).json({
        message: "Delhivery warehouse creation failed",
        error: delhiveryResp,
      });
    }

    // 💾 Save locally
    const location = await PickupLocation.create({
      vendorId,
      code: name, // MUST match Delhivery exactly
      name,
      address,
      city,
      state,
      pincode,
      phone,
      email,
      isActive: true,
      delhivery: {
        synced: true,
        lastSyncedAt: new Date(),
      },
    });

    res.status(201).json({
      message: "Pickup location created successfully",
      pickupLocation: location,
    });
  } catch (err) {
    console.error(err);

    // Duplicate warehouse name
    if (err.code === 11000) {
      return res.status(409).json({
        message: "Pickup location with same name already exists",
      });
    }

    res.status(500).json({ message: "Failed to create pickup location" });
  }
};

/**
 * UPDATE / DELETE pickup location
 */
export const updatePickupLocation = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;
    const { id } = req.params;

    const location = await PickupLocation.findOne({
      _id: id,
      vendorId,
    });

    if (!location) {
      return res.status(404).json({ message: "Pickup location not found" });
    }

    // ❌ DELETE
    if (req.body.isActive === false) {
      const delResp = await deletePickupLocationFromDelhivery(location.code);

      if (!delResp?.success) {
        return res.status(400).json({
          message: "Delhivery delete failed",
          error: delResp,
        });
      }

      location.isActive = false;
      await location.save();

      return res.json({ message: "Pickup location deleted successfully" });
    }

    // 🔄 UPDATE
    const { name, address, city, state, pincode, phone, email } = req.body;

    const vendor = await Vendor.findOne({ id: vendorId });

    const delhiveryPayload = {
      name,
      phone,
      email,
      address,
      city,
      state,
      pin: pincode,
      return_address: address,
      return_city: city,
      return_pin: pincode,
      return_state: state,
    };

    const delResp = await createOrUpdatePickupLocation(delhiveryPayload);

    if (!delResp?.success) {
      return res.status(400).json({
        message: "Delhivery update failed",
        error: delResp,
      });
    }

    Object.assign(location, {
      code: name,
      name,
      address,
      city,
      state,
      pincode,
      phone,
      isActive: true,
      delhivery: {
        synced: true,
        lastSyncedAt: new Date(),
      },
    });

    await location.save();

    res.json({
      message: "Pickup location updated successfully",
      pickupLocation: location,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update pickup location" });
  }
};
