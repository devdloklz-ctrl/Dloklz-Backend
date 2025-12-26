import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp-relay.sendinblue.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOrderEmail = async (order) => {
  const mailOptions = {
    from: '"Your Store" <no-reply@yourdomain.com>',
    to: order.billing.email,
    subject: `Order Confirmation #${order.id}`,
    html: `
      <h2>Thank you for your order!</h2>
      <p>Order ID: ${order.id}</p>
      <p>Total: ${order.total} ${order.currency}</p>
      <p>Customer: ${order.billing.first_name} ${order.billing.last_name}</p>
      <h3>Order Details:</h3>
      <ul>
        ${order.line_items
          .map(
            (item) =>
              `<li>${item.name} x ${item.quantity} = ${item.total} ${order.currency}</li>`
          )
          .join("")}
      </ul>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Order confirmation email sent");
  } catch (error) {
    console.error("Failed to send order email:", error);
  }
};
