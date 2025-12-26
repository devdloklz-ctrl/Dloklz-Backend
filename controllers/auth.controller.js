import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Role from "../models/Role.js";

const JWT_SECRET = process.env.JWT_SECRET || "secretkey";

// Register new user
export const register = async (req, res) => {
  try {
    const { username, email, password, roles } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already in use" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Find roles
    let roleDocs;
    if (roles && roles.length > 0) {
      roleDocs = await Role.find({ name: { $in: roles } });
    } else {
      // Default role vendor
      const vendorRole = await Role.findOne({ name: "vendor" });
      roleDocs = [vendorRole];
    }

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      roles: roleDocs.map((r) => r._id),
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
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email }).populate("roles");
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Create JWT payload
    const payload = {
      id: user._id,
      roles: user.roles.map((r) => r.name),
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });

    res.json({ token, user: { id: user._id, username: user.username, email: user.email, roles: payload.roles } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
