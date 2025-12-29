import cron from "node-cron";
import Order from "../models/Order.js";
import { trackDelhiveryShipment } from "../services/delhivery.service.js";

cron.schedule("0 */6 * * *", async () => {
  console.log("🔄 Delhivery status sync started");

  const orders = await Order.find({
    "shipment.waybills.0": { $exists: true },
    status: "shipped",
  });

  for (const order of orders) {
    try {
      const waybill = order.shipment.waybills[0];
      const resp = await trackDelhiveryShipment(waybill);

      if (!resp?.status) continue;

      if (resp.status === "Delivered") {
        order.status = "completed";
        order.shipment.status = "delivered";
        await order.save();
      }
    } catch (err) {
      console.error("Cron error:", err.message);
    }
  }
});
