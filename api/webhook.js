import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20", // 無くても動くが明示推奨
});

// raw body を取得
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
    return res.status(400).send("Webhook Error: No stripe-signature header value was provided.");
  }

  let event;
  try {
    const rawBody = await getRawBody(req); // ★ここが重要（req.body を使わない）
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err?.message || err);
    return res.status(400).send(`Webhook Error: ${err?.message || "Signature verification failed"}`);
  }

  // ここから先はイベント処理
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    // TODO: session.metadata.uid 等を使ってDB更新
  }

  return res.status(200).json({ received: true });
}
