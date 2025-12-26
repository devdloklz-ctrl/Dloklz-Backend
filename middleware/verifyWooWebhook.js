import crypto from "crypto";

export const verifyWooWebhook = (req, res, next) => {
  const topic = req.headers["x-wc-webhook-topic"];

  // ✅ Allow WooCommerce validation ping
  if (!topic) {
    return res.status(200).json({ ok: true });
  }

  const signature = req.headers["x-wc-webhook-signature"];
  const secret = process.env.WOO_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return res.status(401).json({ message: "Missing webhook signature" });
  }

  const rawBody = req.body; // ✅ THIS IS THE BUFFER

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("base64");

  if (
    !crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  ) {
    return res.status(401).json({ message: "Invalid Woo signature" });
  }

  next();
};
