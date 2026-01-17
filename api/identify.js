import { serialize, parse } from "cookie";
import crypto from "crypto";

const COOKIE_NAME = "uid";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "method not allowed" });
  }

  const cookies = parse(req.headers.cookie || "");
  const existingUid = cookies[COOKIE_NAME];

  // 既に uid Cookie があるなら、そのまま成功でOK
  if (existingUid) {
    return res.status(200).json({ ok: true });
  }

  // 無ければ新規発行
  const uid = crypto.randomUUID();

  const isProd = process.env.NODE_ENV === "production";
  res.setHeader(
    "Set-Cookie",
    serialize(COOKIE_NAME, uid, {
      httpOnly: true,
      secure: isProd,        // 本番だけ true
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1年
    })
  );

  return res.status(200).json({ ok: true });
}
