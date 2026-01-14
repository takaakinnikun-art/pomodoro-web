// pages/api/webhook.js
import Stripe from "stripe";
import { kv } from "@vercel/kv";

// ✅ 重要: Next.js が勝手に body をパースしないようにする（署名検証の必須条件）
export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// raw body を Buffer で取得
async function buffer(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).send("Method Not Allowed");
  }

  const sig = req.headers["stripe-signature"];
  if (!sig || typeof sig !== "string") {
    return res.status(400).send("Missing stripe-signature");
  }

  let event;
  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    // ✅ 署名検証が落ちた理由をStripe側で見えるようにする
    return res
      .status(400)
      .send(`Webhook signature verification failed: ${err.message}`);
  }

  // ✅ 二重処理防止（Stripeは失敗時にリトライする）
  const dedupeKey = `stripe:event:${event.id}`;
  const already = await kv.get(dedupeKey);
  if (already) return res.status(200).send("ok (deduped)");
  await kv.set(dedupeKey, true, { ex: 60 * 60 * 24 * 7 });

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // uid は metadata.uid または client_reference_id を想定
      const uid = session?.client_reference_id;

// 移行期間の保険（client_reference_id が無い古い決済に備える）
const uidFallback = session?.metadata?.uid;

const finalUid = uid || uidFallback;

console.log("[webhook] uid resolution", {
  eventId: event.id,
  client_reference_id: uid,
  metadata_uid: uidFallback,
  finalUid,
});

if (!finalUid) {
  return res.status(200).json({ received: true, no_uid: true });
}

await kv.set(`pro:${finalUid}`, true);

console.log("[webhook] checkout.session.completed", {
  eventId: event.id,
  uid,
  client_reference_id: session?.client_reference_id,
  metadata_uid: session?.metadata?.uid,
});

      if (!uid) {
        return res.status(200).json({ received: true, no_uid: true });
      }

      await kv.set(`pro:${uid}`, true);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    return res.status(500).send(`Handler error: ${err.message}`);
  }
}
