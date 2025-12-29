// utils/smsService.js
import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

/**
 * Send SMS via Twilio
 * @param {string} phone - Recipient phone number (e.g., +919876543210 or 9876543210)
 * @param {string} message - SMS content
 * @returns {Promise<{ok: boolean, sid?: string, error?: string}>}
 */
export const sendSMS = async (phone, message) => {
  try {
    if (!phone) {
      console.warn("⚠️ No phone number provided for SMS");
      return { ok: false, error: "Missing phone number" };
    }

    const formattedPhone = phone.startsWith("+") ? phone : `+91${phone.trim()}`;

    const params = {
      body: message,
      to: formattedPhone,
    };

    if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
      params.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    } else if (process.env.TWILIO_SMS_NUMBER) {
      params.from = process.env.TWILIO_SMS_NUMBER;
    } else {
      throw new Error("Missing Twilio 'from' configuration");
    }

    const response = await client.messages.create(params);

    return { ok: true, sid: response.sid };
  } catch (error) {
    console.error(`❌ SMS send error:`, error.message);
    return { ok: false, error: error.message };
  }
};
