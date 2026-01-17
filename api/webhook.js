import Stripe from "stripe";
import { buffer } from "micro";
import { kv } from "@vercel/kv";

export const config = {
  api: {
    bodyParser: false, // Stripe署名検証に必須
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  const sig = req.headers["stripe-signature"];

  let event;
  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 👇 ここが本体
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // uid を安全に解決（正ルート + フォールバック）
    const uid =
      session.client_reference_id ||
      session.metadata?.uid ||
      null;

    if (!uid) {
      console.error("UID not found in checkout session", session.id);
      return res.status(400).json({ ok: false, error: "uid_missing" });
    }

    // Pro 化
    await kv.set(`pro:${uid}`, true);

    console.log("✅ Pro enabled for uid:", uid);
  }

  return res.status(200).json({ received: true });
}
