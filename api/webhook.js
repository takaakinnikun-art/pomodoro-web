import Stripe from "stripe";

export const config = {
  api: { bodyParser: false }, // raw body 必須
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const sig = req.headers["stripe-signature"];
  let rawBody = "";

  await new Promise((resolve, reject) => {
    req.on("data", (chunk) => (rawBody += chunk));
    req.on("end", resolve);
    req.on("error", reject);
  });

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log("✅ checkout.session.completed:", session.id);

    // 次のステップでここにKV保存（購入済み）を入れる
  }

  return res.status(200).json({ received: true });
}
