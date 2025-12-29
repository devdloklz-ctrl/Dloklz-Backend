import mongoose from "mongoose";

const PickupLocationSchema = new mongoose.Schema(
  {
    vendorId: {
      type: Number, // Dokan vendor ID
      required: true,
      index: true,
    },

    code: {
      type: String, // Delhivery warehouse name (case-sensitive)
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    city: String,
    state: String,

    pincode: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    delhivery: {
      synced: {
        type: Boolean,
        default: false,
      },
      lastSyncedAt: Date,
    },
  },
  { timestamps: true }
);

// Prevent duplicate warehouse names per vendor
PickupLocationSchema.index(
  { vendorId: 1, code: 1 },
  { unique: true }
);

export default mongoose.model("PickupLocation", PickupLocationSchema);
