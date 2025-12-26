import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

import { rawBodyParser } from "./middleware/rawBodyParser.js";

import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/products.routes.js";
import orderRoutes from "./routes/orders.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import wooRoutes from "./routes/woocommerce.routes.js";

dotenv.config();
const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Use rawBodyParser **only** for the webhook route to capture raw body for signature verification
app.use((req, res, next) => {
  if (req.originalUrl === "/api/webhooks/order-created" && req.method === "POST") {
    return rawBodyParser(req, res, next);
  }
  next();
});

// Use JSON parser for all other routes EXCEPT the webhook POST route above
app.use((req, res, next) => {
  if (req.originalUrl === "/api/webhooks/order-created" && req.method === "POST") {
    // skip json parser here because rawBodyParser already handled the body
    return next();
  }
  express.json()(req, res, next);
});

// Register routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/woocommerce", wooRoutes);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.error(err));
