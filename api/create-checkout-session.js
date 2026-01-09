import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { deviceId } = req.body || {};
    if (!deviceId) return res.status(400).json({ error: "deviceId is required" });

    const origin = req.headers.origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: deviceId,
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: { name: "Pomodoro Pro（買い切り）" },
            unit_amount: 600,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?checkout=cancel`,
    });

    return res.status(200).json({ url: session.url });
  } catch (e) {
    return res.status(500).json({ error: "Failed to create session", details: String(e) });
  }
}
