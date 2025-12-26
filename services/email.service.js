import fs from "fs";
import path from "path";
import axios from "axios";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

const SENDER = {
  name: "Dloklz",
  email: "no-reply@dloklz.com",
};

/**
 * Load HTML template & replace variables
 */
function loadTemplate(templateName, variables = {}) {
  const templatePath = path.join(
    __dirname,
    "../templates/email",
    templateName
  );

  let html = fs.readFileSync(templatePath, "utf-8");

  Object.entries(variables).forEach(([key, value]) => {
    html = html.replaceAll(`{{${key}}}`, value ?? "");
  });

  return html;
}

/**
 * Core email sender
 */
async function sendEmail({ to, subject, html }) {
  return axios.post(
    BREVO_API_URL,
    {
      sender: SENDER,
      to: [{ email: to }],
      subject,
      htmlContent: html,
    },
    {
      headers: {
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
    }
  );
}

/**
 * Order confirmed
 */
export async function sendOrderConfirmationEmail(order) {
  console.log("email name --- :  ", order.billing.first_name)
  const html = loadTemplate("order-confirmed.html", {
    customerName: order.billing.first_name,
    orderId: order.orderNumber,
    total: order.total,
    orderUrl: `https://dloklz.com/orders/${order.orderNumber}`,
  });

  return sendEmail({
    to: order.billing.email,
    subject: "Your order is confirmed 🎉",
    html,
  });
}

/**
 * Order shipped
 */
export async function sendOrderShippedEmail(order, trackingId, trackingUrl) {
  const html = loadTemplate("order-shipped.html", {
    customerName: order.billing.first_name,
    orderId: order.orderNumber,
    trackingId,
    trackingUrl,
  });

  return sendEmail({
    to: order.billing.email,
    subject: "Your order is on the way 🚚",
    html,
  });
}

/**
 * Order delivered
 */
export async function sendOrderDeliveredEmail(order) {
  const html = loadTemplate("order-delivered.html", {
    customerName: order.billing.first_name,
    orderId: order.orderNumber,
    reviewUrl: "https://dloklz.com/review",
  });

  return sendEmail({
    to: order.billing.email,
    subject: "Delivered! Hope you love it ❤️",
    html,
  });
}

/**
 * Order cancelled
 */
export async function sendOrderCancelledEmail(order) {
  const html = loadTemplate("order-cancelled.html", {
    customerName: order.billing.first_name,
    orderId: order.orderNumber,
  });

  return sendEmail({
    to: order.billing.email,
    subject: "Your order has been cancelled ❌",
    html,
  });
}
