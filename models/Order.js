import mongoose from "mongoose";

/* ---------------- SUB SCHEMAS ---------------- */

const addressSchema = new mongoose.Schema({
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
});

const lineItemSchema = new mongoose.Schema({
  wooLineItemId: {type: Number, index: true,},
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
});

/* ---------------- ORDER SCHEMA ---------------- */

const orderSchema = new mongoose.Schema(
  {
    /* Woo identifiers */
    wooOrderId: { type: Number, unique: true, required: true, index: true, },
    orderNumber: String,

    /* Status & totals */
    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "on-hold",
        "completed",
        "cancelled",
        "refunded",
        "failed",
        "trash",
      ],
    },
    currency: String,
    total: String,
    total_tax: String,
    discount_total: String,
    shipping_total: String,

    /* Customer */
    customerId: Number,
    billing: addressSchema,
    shipping: addressSchema,

    /* Payment */
    payment_method: String,
    payment_method_title: String,
    transaction_id: String,
    needs_payment: Boolean,
    needs_processing: Boolean,

    /* Order items */
    line_items: [lineItemSchema],

    /* Vendor / Dokan */
    vendorId: {
      type: Number,
      index: true, // IMPORTANT for vendor queries
    },
    store: {
      id: Number,
      name: String,
      url: String,
    },

    /* Dates */
    date_created: Date,
    date_modified: Date,
    date_paid: Date,
    date_completed: Date,

    /* Raw Woo data (optional but recommended) */
    meta_data: [mongoose.Schema.Types.Mixed],
    rawWooOrder: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
