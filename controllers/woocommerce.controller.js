import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Vendor from "../models/Vendor.js";

import {
  fetchAllProducts,
  fetchAllOrders,
} from "../services/woocommerce.service.js";
import { sendOrderConfirmationEmail } from "../services/email.service.js";
import WebhookLog from "../models/WebhookLog.js";

/* ---------------- HELPERS ---------------- */

const getVendorIdFromMeta = (metaData = []) => {
  const vendorMeta = metaData.find(
    (m) => m.key === "_dokan_vendor_id"
  );
  return vendorMeta ? Number(vendorMeta.value) : null;
};

/* ---------------- IMPORT ALL DATA ---------------- */

export const importWooData = async (req, res) => {
  try {
    /* ---------- PRODUCTS ---------- */
    const products = await fetchAllProducts();

    for (const p of products) {
      await Product.findOneAndUpdate(
        { wooId: p.id },
        {
          wooId: p.id,
          name: p.name,
          slug: p.slug,
          permalink: p.permalink,
          date_created: p.date_created,
          date_modified: p.date_modified,
          type: p.type,
          status: p.status,
          featured: p.featured,
          catalog_visibility: p.catalog_visibility,

          description: p.description,
          short_description: p.short_description,

          sku: p.sku,
          price: p.price,
          regular_price: p.regular_price,
          sale_price: p.sale_price,
          on_sale: p.on_sale,

          total_sales: p.total_sales,
          virtual: p.virtual,
          downloadable: p.downloadable,
          downloads: p.downloads,

          manage_stock: p.manage_stock,
          stock_quantity: p.stock_quantity,
          stock_status: p.stock_status,
          backorders: p.backorders,

          weight: p.weight,
          dimensions: p.dimensions,

          categories: p.categories,
          tags: p.tags,
          images: p.images,               // FULL IMAGE OBJECTS
          attributes: p.attributes,
          default_attributes: p.default_attributes,
          variations: p.variations,
          upsell_ids: p.upsell_ids,
          cross_sell_ids: p.cross_sell_ids,

          average_rating: p.average_rating,
          rating_count: p.rating_count,
          reviews_allowed: p.reviews_allowed,

          meta_data: p.meta_data,
          store: p.store || null,

          rawWooProduct: p,               // 🔥 FULL RAW PRODUCT
        },
        { upsert: true, new: true }
      );
    }

    /* ---------- ORDERS ---------- */
    const orders = await fetchAllOrders();

    for (const o of orders) {
      const vendorId = getVendorIdFromMeta(o.meta_data);

      await Order.findOneAndUpdate(
        { wooOrderId: o.id },
        {
          wooOrderId: o.id,
          orderNumber: o.number,

          status: o.status,
          currency: o.currency,
          total: o.total,
          total_tax: o.total_tax,
          discount_total: o.discount_total,
          shipping_total: o.shipping_total,

          customerId: o.customer_id,
          billing: o.billing,
          shipping: o.shipping,

          payment_method: o.payment_method,
          payment_method_title: o.payment_method_title,
          transaction_id: o.transaction_id,

          needs_payment: o.needs_payment,
          needs_processing: o.needs_processing,

          line_items: o.line_items.map((item) => ({
            wooLineItemId: item.id,
            productId: item.product_id,
            variationId: item.variation_id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
            total: item.total,
            image: item.image,
            meta_data: item.meta_data,
          })),

          vendorId,
          store: o.store || null,

          date_created: o.date_created,
          date_modified: o.date_modified,
          date_paid: o.date_paid,
          date_completed: o.date_completed,

          meta_data: o.meta_data,
          rawWooOrder: {
            id: o.id,
            status: o.status,
            date_modified: o.date_modified,
          },                 // 🔥 FULL RAW ORDER
        },
        { upsert: true, new: true }
      );
    }

    res.json({
      message: "WooCommerce products & orders imported successfully",
      products: products.length,
      orders: orders.length,
    });
  } catch (err) {
    console.error("Woo import error:", err);
    res.status(500).json({ message: "Failed to import WooCommerce data" });
  }
};


/* ---------------- WEBHOOK HANDLER ---------------- */

export const handleNewOrderWebhook = async (req, res) => {
  const signature = req.headers["x-wc-webhook-signature"];

  try {
    const order = req.body;
    const vendorId = getVendorIdFromMeta(order.meta_data);

    if (!order?.id) {
      await WebhookLog.create({
        topic: "order.created",
        status: "failed",
        error: "Missing order id",
        payload: order,
      });

      return res.status(200).json({ message: "Invalid payload ignored" });
    }

    const existingOrder = await Order.findOne({ wooOrderId: order.id });

    /* ---------------- IDMPOTENCY CHECK ---------------- */
    if (
      existingOrder &&
      existingOrder.lastWooModified &&
      new Date(order.date_modified) <= existingOrder.lastWooModified
    ) {
      await WebhookLog.create({
        topic: "order.created",
        wooResourceId: order.id,
        status: "ignored",
        payload: order,
      });

      return res.status(200).json({ message: "Outdated webhook ignored" });
    }

    /* ---------------- UPSERT ORDER ---------------- */
    const savedOrder = await Order.findOneAndUpdate(
      { wooOrderId: order.id },
      {
        wooOrderId: order.id,
        orderNumber: order.number,
        status: order.status,
        currency: order.currency,
        total: order.total,

        customerId: order.customer_id,
        billing: order.billing,
        shipping: order.shipping,

        payment_method: order.payment_method,
        payment_method_title: order.payment_method_title,

        line_items: order.line_items.map((item) => ({
          wooLineItemId: item.id,
          productId: item.product_id,
          variationId: item.variation_id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
          total: item.total,
          image: item.image,
          meta_data: item.meta_data,
        })),

        vendorId,
        store: order.store || null,

        date_created: order.date_created,
        date_modified: order.date_modified,
        lastWooModified: order.date_modified,

        meta_data: order.meta_data,
        rawWooOrder: order,

        webhook: {
          lastEvent: "order.created",
          deliveryId: req.headers["x-wc-webhook-id"],
          processedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    /* ---------------- SEND EMAIL ONLY ON FIRST CREATE ---------------- */
    if (!existingOrder) {
      await sendOrderConfirmationEmail(savedOrder);
      await sendSMS(
        savedOrder.billing.phone,
        `Thank you for your order #${savedOrder.orderNumber}! We are processing it and will update you soon.`
      );

      // Owner SMS (assuming owner phone in env)
      const ownerPhone = process.env.OWNER_PHONE;
      if (ownerPhone) {
        const ownerMsg = `📦 Order #${savedOrder.orderNumber} has been placed. Total: ₹${savedOrder.total}.`;
        try {
          await sendSMS(ownerPhone, ownerMsg);
          console.log(`📩 SMS sent to Owner (${ownerPhone})`);
        } catch (err) {
          console.error(`❌ Failed to send owner SMS:`, err.message);
        }
      }

      // Vendor SMS (if vendorId present)
      if (savedOrder.vendorId) {
        try {
          const vendor = await Vendor.findById(savedOrder.vendorId);
          if (vendor?.phone) {
            const vendorMsg = `🛍️ New order #${savedOrder.orderNumber} received from customer ${savedOrder.billing.first_name}. Please take action accordingly.`;
            await sendSMS(vendor.phone, vendorMsg);
            console.log(`📩 SMS sent to Vendor (${vendor.phone})`);
          } else {
            console.warn(`⚠️ Vendor phone not found for vendorId: ${savedOrder.vendorId}`);
          }
        } catch (err) {
          console.error(`❌ Error sending SMS to Vendor (ID: ${savedOrder.vendorId}):`, err.message);
        }
      }
    }

    /* ---------------- LOG SUCCESS ---------------- */
    await WebhookLog.create({
      topic: "order.created",
      wooResourceId: order.id,
      signature,
      status: "success",
      payload: order,
    });

    return res.status(200).json({ message: "Webhook processed" });
  } catch (error) {
    console.error("Webhook error:", error);

    await WebhookLog.create({
      topic: "order.created",
      status: "failed",
      signature,
      error: error.message,
      payload: {
        id: order.id,
        status: order.status,
        total: order.total,
      },
    });

    /**
     * ⚠️ IMPORTANT:
     * Return 200 so Woo doesn't retry forever
     * You already logged the failure
     */
    return res.status(200).json({ message: "Webhook error logged" });
  }
};


/* ---------------- Fetch Updated Products Only ---------------- */

export const syncUpdatedProducts = async (req, res) => {
  try {
    const sync = await Sync.findOne({ key: "products" });
    const after = sync?.lastSyncedAt?.toISOString();

    const products = await fetchUpdatedProducts(after);

    for (const p of products) {
      await Product.findOneAndUpdate(
        { wooId: p.id },
        { rawWooProduct: p },
        { upsert: true }
      );
    }

    await Sync.findOneAndUpdate(
      { key: "products" },
      { lastSyncedAt: new Date() },
      { upsert: true }
    );

    res.json({ synced: products.length });
  } catch (err) {
    res.status(500).json({ message: "Sync failed" });
  }
};