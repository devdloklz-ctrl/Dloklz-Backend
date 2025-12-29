import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Role from "../models/Role.js";
import Vendor from "../models/Vendor.js";

const JWT_SECRET = process.env.JWT_SECRET || "secretkey";

// Register new user
export const register = async (req, res) => {
  try {
    const { username, identifier, password, roles, vendorId } = req.body;

    if (!identifier)
      return res.status(400).json({ message: "Email or phone is required" });

    const isEmail = identifier.includes("@");

    const existingUser = await User.findOne(
      isEmail ? { email: identifier } : { phone: identifier }
    );

    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    let roleDocs;
    if (roles?.length) {
      roleDocs = await Role.find({ name: { $in: roles } });
    } else {
      roleDocs = [await Role.findOne({ name: "vendor" })];
    }

    let numericVendorId = null;

    if (roles?.includes("vendor")) {
      if (!vendorId) {
        return res.status(400).json({
          message: "vendorId is required for vendor users",
        });
      }

      numericVendorId = Number(vendorId);
      if (isNaN(numericVendorId)) {
        return res.status(400).json({
          message: "vendorId must be a number (Woo/Dokan vendor id)",
        });
      }

      // extra safety: ensure vendor exists
      const vendorExists = await Vendor.findOne({ id: numericVendorId });
      if (!vendorExists) {
        return res.status(404).json({ message: "Vendor not found" });
      }
    }

    const user = new User({
      username,
      email: isEmail ? identifier : undefined,
      phone: !isEmail ? identifier : undefined,
      password: hashedPassword,
      roles: roleDocs.map(r => r._id),
      vendorId: numericVendorId, // ✅ ALWAYS number or null
    });

    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const isEmail = identifier.includes("@");

    const user = await User.findOne(
      isEmail ? { email: identifier } : { phone: identifier }
    ).populate("roles");

    if (!user)
      return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const payload = {
      id: user._id,
      roles: user.roles.map(r => r.name),
      vendorId: user.vendorId || null,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        roles: payload.roles,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};