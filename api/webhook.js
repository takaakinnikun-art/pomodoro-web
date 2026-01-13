import { kv } from "@vercel/kv";

// raw body を読む（Vercel Functions で req.body が無いことがあるため）
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

  // ✅ 安全柵：この環境変数が true の時だけ「署名検証スキップ」を許可
  // 本番では必ず false（または未設定）に戻してください
  const allowInsecure = process.env.ALLOW_INSECURE_WEBHOOKS === "true";
  if (!allowInsecure) {
    return res
      .status(400)
      .send("Webhook Error: insecure mode disabled (set ALLOW_INSECURE_WEBHOOKS=true in test only).");
  }

  try {
    const rawBody = await getRawBody(req);
    const bodyText = rawBody.toString("utf8");

    // 署名検証はしないが、Stripe-Signature が来てるかだけログに出す（秘密は出さない）
    console.log("[webhook][insecure] has stripe-signature =", Boolean(req.headers["stripe-signature"]));
    console.log("[webhook][insecure] rawBody length =", rawBody.length);

    const event = JSON.parse(bodyText);

    // ✅ 安全柵：Stripe の livemode が true なら拒否（=本番イベントなら拒否）
    if (event?.livemode === true) {
      return res.status(400).send("Webhook Error: livemode events are not allowed in insecure mode.");
    }

    console.log("[webhook][insecure] event.type =", event?.type);

    if (event?.type === "checkout.session.completed") {
      const session = event.data?.object;
      const uid = session?.metadata?.uid;

      console.log("[webhook][insecure] session.metadata =", session?.metadata);

      if (!uid) {
        console.warn("[webhook][insecure] NO uid in metadata");
        return res.status(200).json({ received: true, warning: "no_uid" });
      }

      await kv.set(`pro:${uid}`, true);
      console.log("[webhook][insecure] PRO enabled for uid:", uid);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("[webhook][insecure] error:", err?.message || err);
    return res.status(400).send(`Webhook Error: ${err?.message || "Invalid JSON"}`);
  }
}
