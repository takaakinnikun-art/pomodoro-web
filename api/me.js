import { kv } from "@vercel/kv";
import { parse } from "cookie";

const COOKIE_NAME = "uid";

export default async function handler(req, res) {
  // Cookie から uid を取得（httpOnlyでもサーバー側なら読める）
  const cookies = parse(req.headers.cookie || "");
  const uid = cookies[COOKIE_NAME];

  // uid が無い = まだ /api/identify を通ってない等
  // 400にせず、Freeとして返す（UIが安定する）
  if (!uid) {
    return res.status(200).json({ ok: true, uid: null, pro: false });
  }

  const pro = (await kv.get(`pro:${uid}`)) === true;

  return res.status(200).json({
    ok: true,
    uid, // デバッグに便利。不要なら後で消してOK
    pro,
  });
}
