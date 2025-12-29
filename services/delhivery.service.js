import axios from "axios";
import PickupLocation from "../models/PickupLocation.js";

const DELHIVERY_STAGING_API_URL =
  "https://staging-express.delhivery.com/api/cmu/create.json";

const DELHIVERY_LIVE_API_URL =
  "https://track.delhivery.com/api/cmu/create.json";

const DELHIVERY_TOKEN = process.env.DELHIVERY_LIVE_API_TOKEN;

export async function createDelhiveryShipment(order) {
  try {
    /* ---------------- FIND PICKUP LOCATION ---------------- */

    const pickupLocation = await PickupLocation.findOne({
      vendorId: order.vendorId,
      isActive: true,
    }).sort({ createdAt: -1 });

    if (!pickupLocation) {
      return {
        success: false,
        error: "No active pickup location found for vendor",
      };
    }

    /* ---------------- PAYMENT MODE ---------------- */

    const isCOD = order.payment_method?.toLowerCase() === "cod";
    const paymentMode = isCOD ? "COD" : "Prepaid";
    const codAmount = isCOD ? Number(order.total) : 0;
    const pickupLocationCode = pickupLocation.code.toUpperCase();

    /* ---------------- PAYLOAD ---------------- */

    const payload = {
      pickup_location: {
        name: pickupLocationCode, // ✅ MUST MATCH DELHIVERY
      },
      shipments: [
        {
          name: `${order.billing.first_name} ${order.billing.last_name}`.trim(),

          add: `${order.billing.address_1} ${
            order.billing.address_2 || ""
          }`.trim(),

          pin: order.billing.postcode,
          city: order.billing.city,
          state: order.billing.state,
          country: "IN",

          phone: order.billing.phone,

          order: order.orderNumber || order._id.toString(),

          payment_mode: paymentMode,
          cod_amount: codAmount,

          total_amount: Number(order.total),

          products_desc: order.line_items
            .map((i) => i.name)
            .join(", "),

          shipment_length: 10,
          shipment_width: 10,
          shipment_height: 10,
          weight: 0.75,

          shipping_mode: "Surface",
        },
      ],
    };

    console.log(
      "📦 Delhivery Shipment Payload:\n",
      JSON.stringify(payload, null, 2)
    );

    /* ---------------- API CALL ---------------- */

    const response = await axios.post(
      DELHIVERY_LIVE_API_URL,
      new URLSearchParams({
        format: "json",
        data: JSON.stringify(payload),
      }),
      {
        headers: {
          Authorization: `Token ${DELHIVERY_TOKEN}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const data = response.data;

    console.log(
      "📦 Delhivery Response:\n",
      JSON.stringify(data, null, 2)
    );

    /* ---------------- RESPONSE PARSE ---------------- */

    const waybills =
      data?.packages
        ?.map((p) => p.waybill)
        ?.filter(Boolean) || [];

    if (waybills.length > 0) {
      return {
        success: true,
        waybills,
        pickupUsed: pickupLocation.code,
      };
    }

    return {
      success: false,
      error:
        data?.rmk ||
        data?.packages?.[0]?.remarks ||
        "Waybill not generated",
      raw: data,
    };
  } catch (err) {
    console.error(
      "❌ Delhivery Shipment Error:",
      err.response?.data || err
    );

    return {
      success: false,
      error: err.response?.data || err.message,
    };
  }
}

export const trackDelhiveryShipment = async (waybill) => {
  const resp = await axios.get(
    `${process.env.DELHIVERY_API_BASE_URL}/v1/packages/json/?waybill=${waybill}`,
    {
      headers: {
        Authorization: `Token ${DELHIVERY_TOKEN}`,
      },
    }
  );

  return resp.data;
};

export async function cancelDelhiveryShipment(waybill) {
  const res = await axios.post(
    "https://track.delhivery.com/api/p/edit",
    new URLSearchParams({
      waybill,
      cancellation: "true",
    }),
    {
      headers: {
        Authorization: `Token ${DELHIVERY_TOKEN}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return res.data;
}