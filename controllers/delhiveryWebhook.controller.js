import Order from "../models/Order.js";
import {
  sendOrderDeliveredEmail,
  sendOrderCancelledEmail,
} from "../services/email.service.js";
import { sendSMS } from "../services/sms.service.js";

export const delhiveryWebhook = async (req, res) => {
  try {
    const payload = req.body;

    const waybill = payload?.waybill || payload?.Waybill;
    const delhiveryStatus = payload?.status || payload?.Status;

    if (!waybill || !delhiveryStatus) {
      return res.status(400).json({ message: "Invalid webhook payload" });
    }

    const order = await Order.findOne({
      "shipment.waybills": waybill,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found for waybill" });
    }

    // 🔄 STATUS MAPPING
    let orderStatus = order.status;

    switch (delhiveryStatus.toLowerCase()) {
      case "delivered":
        orderStatus = "completed";
        break;
      case "in transit":
      case "out for delivery":
        orderStatus = "shipped";
        break;
      case "rto":
      case "cancelled":
        orderStatus = "cancelled";
        break;
      default:
        break;
    }

    const normalizedStatus = delhiveryStatus.toLowerCase().replace(/ /g, "_");
    order.shipment.status = normalizedStatus;
    
    order.shipment.lastStatusAt = new Date();
    order.status = orderStatus;

    await order.save();

    // 📧 + 📩 Notify
    if (orderStatus === "completed") {
      await sendOrderDeliveredEmail(order);
      if (order.billing?.phone) {
        await sendSMS(
          order.billing.phone,
          `Hi ${order.billing.first_name}, your order #${order.orderNumber} has been delivered 🎉`
        );
      }
    }

    if (orderStatus === "cancelled") {
      await sendOrderCancelledEmail(order);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Delhivery webhook error:", err);
    res.status(500).json({ message: "Webhook processing failed" });
  }
};
