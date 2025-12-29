import Order from "../models/Order.js";
import { sendSMS } from "../services/sms.service.js";
import { cancelDelhiveryShipment, createDelhiveryShipment } from "../services/delhivery.service.js";
import {
  sendOrderConfirmationEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendOrderCancelledEmail,
} from "../services/email.service.js";
import PickupLocation from "../models/PickupLocation.js";

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

    // Search
    if (search) {
      filters.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { "billing.email": { $regex: search, $options: "i" } },
        { "billing.first_name": { $regex: search, $options: "i" } },
        { "billing.last_name": { $regex: search, $options: "i" } },
        { "line_items.name": { $regex: search, $options: "i" } },
      ];
    }

    // Status
    if (status) filters.status = status;

    // Payment
    if (payment_status) {
      filters.needs_payment = payment_status === "pending";
    }

    // 🔐 Vendor isolation
    if (req.user.roles.includes("vendor")) {
      filters.vendorId = req.user.vendorId;
    }

    // Owner filter
    if (
      req.user.roles.includes("owner") &&
      vendorId
    ) {
      filters.vendorId = Number(vendorId);
    }

    const sortOptions = {
      [sortBy]: sortOrder === "asc" ? 1 : -1,
    };

    const skip = (page - 1) * limit;

    const total = await Order.countDocuments(filters);

    const orders = await Order.find(filters)
      .select('orderNumber billing line_items status total date_created needs_payment vendorId') // 👈 ONLY fetch what the table needs
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

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 🔐 Vendor access restriction
    if (
      req.user.roles.includes("vendor") &&
      order.vendorId !== req.user.vendorId
    ) {
      return res.status(403).json({
        message: "You are not allowed to view this order",
      });
    }

    res.json(order);
  } catch (error) {
    console.error("Get order by ID error:", error);
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
    const orderId = req.params.id;
    const { status: newStatus } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const previousStatus = order.status;

    /**
     * 🚚 SHIPMENT CREATION (only when moving to shipped)
     */
    if (newStatus === "shipped" && previousStatus !== "shipped" && !order.shipment?.waybills?.length) {
      const pickupLocation = await PickupLocation.findOne({
        vendorId: order.vendorId,
        isActive: true,
      }).sort({ createdAt: -1 });

      if (!pickupLocation) {
        return res.status(400).json({
          message: "No active pickup location found for this vendor",
        });
      }

      const shipmentResp = await createDelhiveryShipment(order, pickupLocation);

      if (!shipmentResp?.success) {
        return res.status(400).json({
          message: "Shipment creation failed",
          error: shipmentResp,
        });
      }

      order.pickupLocation = {
        id: pickupLocation._id,
        code: pickupLocation.code,
      };

      order.shipment = {
        provider: "delhivery",
        pickupCode: pickupLocation.code.toUpperCase(),
        waybills: shipmentResp.waybills,
        status: "manifested",
        manifestedAt: new Date(),
        rawResponse: shipmentResp,
      };
    }

    order.status = newStatus;
    await order.save();

    if (
      newStatus === "cancelled" &&
      order.shipment &&
      ["pending", "manifested", "in_transit"].includes(order.shipment.status)
    ) {
      await cancelDelhiveryShipment(order.shipment.waybills[0]);

      order.shipment.status = "cancelled";
      order.shipment.cancelledAt = new Date();
    }


    /**
     * 📧 EMAIL + 📩 SMS (only if status changed)
     */
    if (previousStatus !== newStatus) {
      // EMAILS
      switch (newStatus) {
        case "processing":
          await sendOrderConfirmationEmail(order);
          break;

        case "shipped":
          await sendOrderShippedEmail(order);
          break;

        case "completed":
          await sendOrderDeliveredEmail(order);
          break;

        case "cancelled":
          await sendOrderCancelledEmail(order);
          break;

        default:
          break;
      }

      // SMS
      const customerPhone = order.billing?.phone;
      const customerName = order.billing?.first_name || "Customer";
      const orderRef = order.orderNumber || order._id.toString();
      const orderTotal = order.total;

      if (customerPhone) {
        let smsText = "";

        switch (newStatus) {
          case "processing":
            smsText = `Hi ${customerName}, your order #${orderRef} is now being processed.`;
            break;
            
          case "shipped":
            const waybill = order.shipment?.waybills?.[0];
            const trackUrl = waybill
              ? `https://www.delhivery.com/track/package/${waybill}`
              : "";

            smsText = `Hi ${customerName}, your order #${orderRef} has been shipped.${trackUrl ? ` Track here: ${trackUrl}` : ""
              }`;
            break;

          case "completed":
            smsText = `Hi ${customerName}, your order #${orderRef} has been delivered.`;
            break;
          case "cancelled":
            smsText = `Hi ${customerName}, your order #${orderRef} has been cancelled.`;
            break;
          default:
            smsText = `Hi ${customerName}, your order #${orderRef} status is now ${newStatus}.`;
        }

        try {
          await sendSMS(customerPhone, smsText);
        } catch (err) {
          console.error("❌ SMS failed:", err.message);
        }
      }
    }

    res.json({
      message: "Order updated successfully",
      order,
    });
  } catch (err) {
    console.error("Update order error:", err);
    res.status(500).json({ message: "Failed to update order status" });
  }
};
