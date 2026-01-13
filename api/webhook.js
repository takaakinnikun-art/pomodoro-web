import Stripe from "stripe";
import { kv } from "@vercel/kv";

/**
 * Stripe 初期化
 */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

/**
 * raw body を取得するためのヘルパー
 * ※ Stripe Webhook の署名検証に必須
 */
async function getRawBody(req) {
  return await new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).send("Method Not Allowed");
  }

  const sig = req.headers["stripe-signature"];
  if (!sig) {
    return res
      .status(400)
      .send("Webhook Error: No stripe-signature header value was provided.");
  }

  let event;
  try {
    const rawBody = await getRawBody(req);

    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  /**
   * === ここからイベント処理 ===
   */
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const uid = session?.metadata?.uid;
    if (!uid) {
      console.warn("checkout.session.completed but no uid in metadata");
      return res.status(200).json({ received: true, warning: "no_uid" });
    }

    // PRO フラグを KV に保存
    await kv.set(`pro:${uid}`, true);

    // （任意）デバッグ・確認用の詳細保存
    await kv.hset(`pro_detail:${uid}`, {
      session_id: session.id,
      payment_status: session.payment_status ?? "",
      amount_total: String(session.amount_total ?? ""),
      currency: session.currency ?? "",
      created: String(session.created ?? ""),
    });

    console.log("PRO enabled for uid:", uid);
  }

  return res.status(200).json({ received: true });
}
