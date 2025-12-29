import mongoose from "mongoose";

/* ---------------- SUB SCHEMAS ---------------- */

const addressSchema = new mongoose.Schema(
  {
    first_name: String,
    last_name: String,
    company: String,
    address_1: String,
    address_2: String,
    city: String,
    state: String,
    postcode: String,
    country: String,
    email: String,
    phone: String,
  },
  { _id: false }
);

const lineItemSchema = new mongoose.Schema(
  {
    wooLineItemId: { type: Number, index: true },
    productId: Number,
    variationId: Number,
    name: String,
    quantity: Number,
    price: Number,
    subtotal: String,
    total: String,
    image: {
      id: String,
      src: String,
    },
    meta_data: [mongoose.Schema.Types.Mixed],
  },
  { _id: false }
);

/* ---------------- SHIPMENT SUB SCHEMA ---------------- */

const shipmentSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ["delhivery", "shiprocket", "manual"],
      default: "delhivery",
    },

    pickupCode: {
      type: String, // PickupLocation.code
      index: true,
    },

    waybills: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: [
        "pending",
        "manifested",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "cancelled",
        "rto",
        "returned",
      ],
      default: "pending",
    },

    manifestedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    lastStatusAt: Date,

    rawResponse: mongoose.Schema.Types.Mixed,
  },
  { _id: false }
);

/* ---------------- ORDER SCHEMA ---------------- */

const orderSchema = new mongoose.Schema(
  {
    wooOrderId: {
      type: Number,
      unique: true,
      required: true,
      index: true,
    },
    orderNumber: String,

    status: {
      type: String,
      enum: [
        "pending",
        "on-hold",
        "processing",
        "shipped",
        "completed",
        "cancelled",
        "refunded",
        "failed",
        "trash",
      ],
      index: true,
    },

    currency: String,
    total: String,
    total_tax: String,
    discount_total: String,
    shipping_total: String,

    customerId: Number,
    billing: addressSchema,
    shipping: addressSchema,

    payment_method: String,
    payment_method_title: String,
    transaction_id: String,

    line_items: [lineItemSchema],

    vendorId: {
      type: Number,
      index: true,
    },
    store: {
      id: Number,
      name: String,
      url: String,
    },

    date_created: Date,
    date_modified: Date,
    date_paid: Date,
    date_completed: Date,

    needs_payment: {
      type: Boolean,
      default: true,
      index: true,
    },
    needs_processing: {
      type: Boolean,
      default: true,
    },

    /* SHIPPING (SOURCE OF TRUTH) */
    shipment: shipmentSchema,

    /* ⚠️ Deprecated — remove after migration */
    waybills: {
      type: [String],
      default: [],
    },

    meta_data: [mongoose.Schema.Types.Mixed],
    rawWooOrder: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

/* ---------------- INDEXES ---------------- */

orderSchema.index({ vendorId: 1, status: 1 });
orderSchema.index({ "shipment.waybills": 1 });

const Order = mongoose.model("Order", orderSchema);
export default Order;
