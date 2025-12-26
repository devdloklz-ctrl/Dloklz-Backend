import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const baseUrl = process.env.WOO_BASE_URL;
const consumerKey = process.env.WOO_CONSUMER_KEY;
const consumerSecret = process.env.WOO_CONSUMER_SECRET;

const auth = {
  username: consumerKey,
  password: consumerSecret,
};

export async function fetchAllProducts() {
  let page = 1;
  let products = [];
  while (true) {
    const res = await axios.get(`${baseUrl}/products`, {
      auth,
      params: { per_page: 100, page },
    });
    products = products.concat(res.data);
    if (res.data.length < 100) break;
    page++;
  }
  return products;
}

export async function fetchAllOrders() {
  let page = 1;
  let orders = [];
  for (let page = 1; ; page++) {
    const res = await axios.get(`${baseUrl}/orders`, {
      auth,
      params: { per_page: 50, page },
    });

    if (!res.data.length) break;

    for (const o of res.data) {
      await saveOrder(o);
    }
  }
  return orders;
}

export async function fetchUpdatedProducts(after) {
  const res = await axios.get(`${baseUrl}/products`, {
    auth,
    params: {
      per_page: 100,
      after,
      orderby: "date",
      order: "asc",
    },
  });
  return res.data;
}
