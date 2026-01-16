// pages/api/identify.js
import crypto from "crypto";

const COOKIE_NAME = "pm_uid";
const SIG_NAME = "pm_uid_sig";

// 簡易署名（改ざん検知用）
function sign(uid, secret) {
  return crypto.createHmac("sha256", secret).update(uid).digest("hex");
}

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const { uid } = req.body || {};
  if (!uid || typeof uid !== "string") return res.status(400).json({ ok: false, error: "missing uid" });

  const secret = process.env.UID_COOKIE_SECRET;
  if (!secret) return res.status(500).json({ ok: false, error: "missing UID_COOKIE_SECRET" });

  const sig = sign(uid, secret);

  const isProd = process.env.NODE_ENV === "production";
  const base = [
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${60 * 60 * 24 * 365}`, // 1年
  ];
  if (isProd) base.push("Secure");

  res.setHeader("Set-Cookie", [
    `${COOKIE_NAME}=${encodeURIComponent(uid)}; ${base.join("; ")}`,
    `${SIG_NAME}=${sig}; ${base.join("; ")}`,
  ]);

  return res.status(200).json({ ok: true });
}
