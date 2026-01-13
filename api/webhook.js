import Stripe from "stripe";
import { kv } from "@vercel/kv";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// raw body を取得（署名検証に必須）
async function getRawBody(req) {
  return await new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  try {
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
      console.error(
        "[webhook] signature verification failed:",
        err?.message || err
      );
      return res
        .status(400)
        .send(`Webhook Error: ${err?.message || "Signature verification failed"}`);
    }

    // ---- ここからイベント処理 ----
    console.log("[webhook] event.type =", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      console.log("[webhook] session.id =", session.id);
      console.log("[webhook] session.payment_status =", session.payment_status);
      console.log("[webhook] session.metadata =", session.metadata);

      const uid = session?.metadata?.uid;
      if (!uid) {
        console.warn("[webhook] NO uid in metadata");
        return res.status(200).json({ received: true, warning: "no_uid" });
      }

      await kv.set(`pro:${uid}`, true);
      console.log("[webhook] PRO enabled for uid:", uid);
    } else {
      console.log("[webhook] ignored event:", event.type);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    // ここに来るのは予期せぬ例外
    console.error("[webhook] unexpected error:", err?.message || err);
    return res.status(500).json({
      received: false,
      error: err?.message || String(err),
    });
  }
}
