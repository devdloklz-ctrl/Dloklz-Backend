import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

export async function sendOrderSMS(order, templateType = "order_placed") {
  try {
    const customerPhone = order.billing.phone;

    if (!customerPhone) {
      console.log("No phone number for order, skipping SMS");
      return;
    }

    const orderNumber = order.orderNumber || order.wooOrderId;

    let message = "";

    switch (templateType) {
      case "order_status_update":
        message = `Your order #${orderNumber} status has been updated to ${order.status}.`;
        break;
      case "payment_status_update":
        message = `Payment status for your order #${orderNumber} is now ${order.needs_payment ? "Pending" : "Completed"}.`;
        break;
      case "order_delivered":
        message = `Your order #${orderNumber} has been delivered. Thank you!`;
        break;
      default:
        message = `Thank you for your order #${orderNumber}. We are processing it.`;
    }

    const sms = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: customerPhone,
    });

    console.log("SMS sent:", sms.sid);
    return sms;
  } catch (error) {
    console.error("SMS sending error:", error);
    throw error;
  }
}
