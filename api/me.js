import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  const uid = req.query.uid;

  if (!uid) {
    return res.status(400).json({ ok: false, error: "uid_required" });
  }

  const pro = (await kv.get(`pro:${uid}`)) === true;

  return res.status(200).json({
    ok: true,
    uid,
    pro,
  });
}
