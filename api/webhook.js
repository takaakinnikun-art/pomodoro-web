import { kv } from "@vercel/kv";

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

  // insecure mode guard（テスト専用）
  if (process.env.ALLOW_INSECURE_WEBHOOKS !== "true") {
    return res.status(400).send("Insecure webhook disabled");
  }

  try {
    const rawBody = await getRawBody(req);
    const payload = JSON.parse(rawBody.toString("utf8"));

    console.log("[webhook][insecure] payload keys =", Object.keys(payload));

    /**
     * Stripe v2 / snapshot / 通常 event
     * どれでも session を拾えるようにする
     */
    const session =
      payload?.data?.object ??
      payload?.object ??
      payload;

    console.log("[webhook][insecure] session.id =", session?.id);
    console.log("[webhook][insecure] session.metadata =", session?.metadata);

    const uid = session?.metadata?.uid;
    if (!uid) {
      console.warn("[webhook][insecure] uid not found");
      return res.status(200).json({ received: true, no_uid: true });
    }

    await kv.set(`pro:${uid}`, true);
    console.log("[webhook][insecure] PRO enabled for uid:", uid);

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("[webhook][insecure] error:", err);
    return res.status(400).send("Webhook parse failed");
  }
}
