import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/products.routes.js";
import orderRoutes from "./routes/orders.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import wooRoutes from "./routes/woocommerce.routes.js";
import vendorRoutes from "./routes/vendor.routes.js";
import userRoutes from "./routes/user.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import "./cron/delhiveryStatus.cron.js";

dotenv.config();
const app = express();

app.use(cors({
  // origin: "http://localhost:3000",
  origin: "https://dloklz-frontend.vercel.app",
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
app.use("/api/vendors", vendorRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);

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
