import User from "../models/User.js";

/**
 * GET /api/users
 * List all users (read-only)
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password -__v")          // exclude sensitive/internal fields
      .populate("roles", "name -_id")   // populate roles and get only the name field
      .lean();

    // Map users to send a cleaner object (optional)
    const usersClean = users.map(user => ({
      id: user._id.toString(),
      username: user.username,
      email: user.email || null,
      phone: user.phone || null,
      roles: user.roles.map(r => r.name),
    }));

    res.json(usersClean);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};
