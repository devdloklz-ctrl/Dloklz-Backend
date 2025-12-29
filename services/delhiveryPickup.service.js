// services/delhiveryPickup.service.js
import axios from "axios";

const BASE_URL = "https://track.delhivery.com/api/backend/clientwarehouse";
const TOKEN = process.env.DELHIVERY_LIVE_API_TOKEN;

const headers = {
  Authorization: `Token ${TOKEN}`,
  Accept: "application/json",
  "Content-Type": "application/json",
};

function normalizeWarehouseName(name) {
  return name
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .slice(0, 50);
}

export async function createOrUpdatePickupLocation(payload) {
  const finalPayload = {
    name: normalizeWarehouseName(payload.name),
    registered_name: process.env.DELHIVERY_REGISTERED_NAME, // SINGLE SOURCE OF TRUTH
    phone: payload.phone.replace(/\D/g, ""),
    email: payload.email,
    address: payload.address,
    city: payload.city,
    state: payload.state,
    pin: payload.pin.replace(/\D/g, ""),
    country: "India",

    return_address: payload.return_address,
    return_city: payload.return_city,
    return_state: payload.return_state,
    return_pin: payload.return_pin.replace(/\D/g, ""),
    return_country: "India",
  };

  try {
    const res = await axios.post(
      `${BASE_URL}/create/`,
      finalPayload,
      { headers }
    );
    return res.data;
  } catch (err) {
    console.error(
      "❌ Delhivery Error:",
      JSON.stringify(err.response?.data, null, 2)
    );
    throw err;
  }
}

export async function deletePickupLocationFromDelhivery(name) {
  const payload = {
    name: normalizeWarehouseName(name),
  };

  const res = await axios.post(
    `${BASE_URL}/delete/`,
    payload,
    { headers }
  );

  return res.data;
}
