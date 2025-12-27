import Vendor from "../models/Vendor.js";
import User from "../models/User.js"; // your auth user model
import bcrypt from "bcryptjs";
import axios from "axios";

export const syncVendorsFromWoo = async (req, res) => {
  try {
    const { data: vendors } = await axios.get(
      `${process.env.DOKAN_API_URL}`,
      {
        auth: {
          username: process.env.WOO_CONSUMER_KEY,
          password: process.env.WOO_CONSUMER_SECRET,
        },
      }
    );

    let inserted = 0;

    for (const v of vendors) {
      const exists = await Vendor.findOne({ id: v.id });
      if (exists) continue;

      await Vendor.create({
        id: v.id,
        user_id: v.user_id,
        store_name: v.store_name,
        first_name: v.first_name,
        last_name: v.last_name,
        phone: v.phone,
        email: v.email,
        shop_url: v.shop_url,
        rating: v.rating,
        enabled: v.enabled,
        registered: v.registered,
        synced_from_woo: true,
      });

      inserted++;
    }

    res.json({
      message: "Vendor sync completed",
      inserted,
      total: vendors.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Vendor sync failed" });
  }
};

export const getNewVendors = async (req, res) => {
  const vendors = await Vendor.find({
    synced_from_woo: true,
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // last 24h
  });

  res.json(vendors);
};

export const getVendors = async (req, res) => {
  const vendors = await Vendor.find();
  res.json(vendors);
};

export const getVendor = async (req, res) => {
  const vendor = await Vendor.findOne({ id: req.params.id });
  if (!vendor) return res.status(404).json({ error: "Vendor not found" });
  res.json(vendor);
};

export const updateVendor = async (req, res) => {
  const vendor = await Vendor.findOneAndUpdate(
    { id: req.params.id },
    req.body,
    { new: true }
  );

  res.json(vendor);
};

export const deleteVendor = async (req, res) => {
  await Vendor.findOneAndDelete({ id: req.params.id });
  res.json({ message: "Vendor deleted" });
};


export const registerVendorAccess = async (req, res) => {
  const { vendorId, password } = req.body;

  const vendor = await Vendor.findOne({ id: vendorId });
  if (!vendor) {
    return res.status(404).json({ error: "Vendor not found" });
  }

  const existingUser = await User.findOne({ email: vendor.email });
  if (existingUser) {
    return res.status(400).json({ error: "User already registered" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name: vendor.store_name,
    email: vendor.email,
    password: hashedPassword,
    role: "vendor",
    vendorId: vendor.id,
  });

  res.json({
    message: "Vendor access created",
    userId: user._id,
  });
};