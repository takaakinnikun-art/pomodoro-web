import Stripe from "stripe";
import { parse } from "cookie";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const COOKIE_NAME = "uid";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    // Cookieからuidを取得
    const cookies = parse(req.headers.cookie || "");
    const uid = cookies[COOKIE_NAME];

    if (!uid) {
      // まだ /api/identify を通ってない等
      return res.status(400).json({ ok: false, error: "uid_missing_cookie" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.APP_URL}/success`,
      cancel_url: `${process.env.APP_URL}/cancel`,
      client_reference_id: uid,
      metadata: { uid },
    });

    return res.status(200).json({ ok: true, url: session.url });
  } catch (err) {
    console.error("checkout error:", err);
    return res.status(500).json({ ok: false, error: err?.message ?? "Unknown error" });
  }
}
