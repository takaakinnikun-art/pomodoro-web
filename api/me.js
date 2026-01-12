export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    route: "/api/me",
    method: req.method,
    ts: Date.now(),
  });
}
