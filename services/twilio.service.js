import twilio from "twilio";

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export const sendOrderSMS = async (order) => {
  const toPhoneNumber = process.env.OWNER_PHONE_NUMBER; // Or vendor phone dynamically

  const message = `New order received! Order #${order.id}, Total: ${order.total} ${order.currency}. Customer: ${order.billing.first_name} ${order.billing.last_name}, Phone: ${order.billing.phone}`;

  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: toPhoneNumber,
    });
    console.log("SMS sent");
  } catch (err) {
    console.error("Failed to send SMS:", err);
  }
};
