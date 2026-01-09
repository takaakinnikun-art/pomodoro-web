import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const deviceId = req.query.deviceId;
  if (!deviceId) return res.status(400).json({ error: "deviceId is required" });

  const v = await kv.get(`pro:${deviceId}`);
  return res.status(200).json({ isPro: v === 1 || v === "1" || v === true });
}
