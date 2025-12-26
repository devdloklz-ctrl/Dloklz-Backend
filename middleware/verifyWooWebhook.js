import crypto from "crypto";

export const verifyWooWebhook = (req, res, next) => {
  const signature = req.headers["x-wc-webhook-signature"];
  const secret = process.env.WOO_WEBHOOK_SECRET;

  if (!signature) {
    return res.status(401).json({ message: "Missing Woo signature" });
  }

  const payload = JSON.stringify(req.body);

  const hash = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64");

  if (hash !== signature) {
    return res.status(401).json({ message: "Invalid Woo signature" });
  }

  next();
};
