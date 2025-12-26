import crypto from "crypto";

export const verifyWooWebhook = (req, res, next) => {
  const signature = req.headers["x-wc-webhook-signature"];
  const secret = process.env.WOO_WEBHOOK_SECRET;

  if (!signature) {
    return res.status(401).json({ message: "Missing Woo signature" });
  }

  if (!secret) {
    return res.status(500).json({ message: "Webhook secret not configured" });
  }

  const payload = req.rawBody || JSON.stringify(req.body);

  const hash = crypto
    .createHmac("sha256", secret)
    .update(Buffer.from(payload, "utf8"))
    .digest("base64");

  const signatureBuffer = Buffer.from(signature);
  const hashBuffer = Buffer.from(hash);

  if (
    signatureBuffer.length !== hashBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, hashBuffer)
  ) {
    return res.status(401).json({ message: "Invalid Woo signature" });
  }

  next();
};
