import Order from "../models/Order.js";
import Product from "../models/Product.js";

export const getDashboardData = async (req, res) => {
  try {
    // ✅ Normalize roles
    const roles = Array.isArray(req.user.roles)
      ? req.user.roles
      : req.user.role
        ? [req.user.role]
        : [];

    const vendorId = req.user.vendorId;
    const isVendor = roles.includes("vendor");

    const orderFilter = isVendor ? { vendorId: Number(vendorId) } : {};
    const productFilter = isVendor ? { vendorId: Number(vendorId) } : {};

    const orders = await Order.find(orderFilter)
      .sort({ _id: -1 }) // safer than createdAt
      .limit(5)
      .lean();

    const totalRevenueAgg = await Order.aggregate([
      ...(isVendor ? [{ $match: { vendorId: Number(vendorId) } }] : []),
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $toDouble: "$total",
            },
          },
        },
      },
    ]);

    const recentOrders = orders.map((order) => ({
      _id: order._id,
      orderId: order.orderNumber,
      customerName:
        `${order.billing?.first_name || ""} ${order.billing?.last_name || ""}`.trim() ||
        "Customer",
      totalAmount: order.total || 0,
      paymentStatus: order.needs_payment ? "Pending" : "Paid",
    }));

    res.json({
      totalRevenue: totalRevenueAgg[0]?.total || 0,
      ordersCount: await Order.countDocuments(orderFilter),
      activeProducts: await Product.countDocuments(productFilter),
      recentOrders,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Failed to load dashboard data" });
  }
};
