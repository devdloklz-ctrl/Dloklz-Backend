import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/products.routes.js";
import orderRoutes from "./routes/orders.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import wooRoutes from "./routes/woocommerce.routes.js";

dotenv.config();
const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

/**
 * ✅ Webhook route FIRST — RAW BODY ONLY
 */
app.use(
  "/api/webhooks",
  express.raw({ type: "*/*" }),
  webhookRoutes
);

/**
 * ✅ Normal JSON routes AFTER
 */
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/woocommerce", wooRoutes);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`)
    );
  })
  .catch(console.error);
