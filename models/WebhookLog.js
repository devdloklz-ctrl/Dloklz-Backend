import mongoose from "mongoose";

const webhookLogSchema = new mongoose.Schema(
  {
    topic: String,
    wooResourceId: Number,
    signature: String,
    payload: mongoose.Schema.Types.Mixed,
    error: String,
    status: {
      type: String,
      enum: ["success", "ignored", "failed"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("WebhookLog", webhookLogSchema);
