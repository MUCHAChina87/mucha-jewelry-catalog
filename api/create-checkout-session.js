const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const products = require("../products.json");

const UK_SHIPPING_PENCE = 299;
const FREE_SHIPPING_AT_PENCE = 4000;
const DUANWU_CODES = new Set(["C040", "C041", "C042"]);

function priceToPence(price) {
  const value = Number(String(price || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
}

function discountedPence(product) {
  const base = priceToPence(product.price);
  if (!base) return 0;
  const rate = DUANWU_CODES.has(product.code) ? 0.8 : 0.9;
  return Math.round(base * rate);
}

function siteOrigin(req) {
  const configured = process.env.SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: "Stripe is not configured yet." });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const requested = Array.isArray(body.items) ? body.items : [];
  const lineItems = [];
  let merchandiseTotal = 0;

  for (const item of requested) {
    const code = String(item.code || "");
    const quantity = Math.max(0, Math.min(20, Number.parseInt(item.quantity, 10) || 0));
    const product = products.find((entry) => entry.code === code);
    const unitAmount = product ? discountedPence(product) : 0;
    if (!product || !quantity || !unitAmount) continue;

    merchandiseTotal += unitAmount * quantity;
    lineItems.push({
      quantity,
      price_data: {
        currency: "gbp",
        unit_amount: unitAmount,
        product_data: {
          name: `${product.code} ${product.name}`,
          metadata: { code: product.code },
        },
      },
    });
  }

  if (!lineItems.length) {
    return res.status(400).json({ error: "Your bag is empty or contains unpriced items." });
  }

  if (merchandiseTotal < FREE_SHIPPING_AT_PENCE) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "gbp",
        unit_amount: UK_SHIPPING_PENCE,
        product_data: { name: "UK delivery" },
      },
    });
  }

  const origin = siteOrigin(req);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    billing_address_collection: "auto",
    shipping_address_collection: {
      allowed_countries: ["GB"],
    },
    phone_number_collection: {
      enabled: true,
    },
    success_url: `${origin}/?checkout=success`,
    cancel_url: `${origin}/?checkout=cancelled`,
    metadata: {
      promotion: "10_percent_sitewide_20_percent_duanwu",
    },
  });

  return res.status(200).json({ url: session.url });
};
