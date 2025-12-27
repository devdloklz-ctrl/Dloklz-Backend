import Order from "../models/Order.js";
import { sendSMS } from "../services/sms.service.js";
import {
  sendOrderConfirmationEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendOrderCancelledEmail,
} from "../services/email.service.js";

/**
 * GET /api/orders
 * List orders with filtering, pagination, sorting
 */
export const getOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      payment_status,
      vendorId,
      sortBy = "date_created",
      sortOrder = "desc",
    } = req.query;

    const filters = {};

    if (search) {
      filters.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { "billing.email": { $regex: search, $options: "i" } },
        { "billing.first_name": { $regex: search, $options: "i" } },
        { "billing.last_name": { $regex: search, $options: "i" } },
        { "line_items.name": { $regex: search, $options: "i" } },
      ];
    }

    if (status) filters.status = status;

    if (payment_status) {
      filters.needs_payment = payment_status === "pending";
    }

    if (vendorId) filters.vendorId = Number(vendorId);

    const sortOptions = {
      [sortBy]: sortOrder === "asc" ? 1 : -1,
    };

    const skip = (page - 1) * limit;

    const total = await Order.countDocuments(filters);
    const orders = await Order.find(filters)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    res.json({
      data: orders,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

/**
 * GET /api/orders/:id
 */
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch order" });
  }
};

/**
 * PATCH /api/orders/:id/status
 * Owner → can change order + payment
 * Vendor → can change only order status
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;
    const { status: newStatus, needs_payment } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const previousStatus = order.status;

    // Payment status protection
    if (typeof needs_payment !== "undefined" && user.role !== "owner") {
      return res.status(403).json({ message: "Only owner can update payment status" });
    }

    // Apply updates
    if (newStatus) order.status = newStatus;
    if (typeof needs_payment !== "undefined") order.needs_payment = needs_payment;

    await order.save();

    /**
     * EMAIL + SMS TRIGGERS (ONLY on status change)
     */
    if (newStatus && previousStatus !== newStatus) {
      // Email notifications
      switch (newStatus) {
        case "processing":
          await sendOrderConfirmationEmail(order);
          break;

        case "completed":
          await sendOrderDeliveredEmail(order);
          break;

        case "cancelled":
          await sendOrderCancelledEmail(order);
          break;

        case "shipped":
          await sendOrderShippedEmail(order);
          break;

        default:
          break;
      }

      // SMS notifications
      const customerPhone = order.billing.phone;
      const customerName = order.billing.first_name || "Customer";
      const orderId = order.orderNumber || order._id.toString();
      const orderTotal = order.total;

      // Customer SMS
      if (customerPhone) {
        let smsText = "";
        switch (newStatus) {
          case "processing":
            smsText = `Hi ${customerName}, your order #${orderId} is now being processed. Thank you for shopping with us!`;
            break;
          case "shipped":
            smsText = `Hi ${customerName}, your order #${orderId} has been shipped. You can expect delivery soon.`;
            break;
          case "completed":
            smsText = `Hi ${customerName}, your order #${orderId} has been delivered. We hope you enjoy your purchase!`;
            break;
          case "cancelled":
            smsText = `Hi ${customerName}, your order #${orderId} has been cancelled. If you have questions, please contact support.`;
            break;
          default:
            smsText = `Hi ${customerName}, the status of your order #${orderId} has been updated to ${newStatus}.`;
            break;
        }

        try {
          await sendSMS(customerPhone, smsText);
          console.log(`📩 SMS sent to Customer (${customerPhone})`);
        } catch (err) {
          console.error(`❌ Failed to send customer SMS:`, err.message);
        }
      }
    }

    res.json({
      message: "Order updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ message: "Failed to update order" });
  }
};