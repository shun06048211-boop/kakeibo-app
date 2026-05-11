export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { user, entry } = req.body;
  if (!user || !entry) return res.status(400).json({ error: "Missing data" });
  // Googleスプレッドシート連携は後で追加
  // 今はデータを返すだけ
  res.json({ ok: true, sheet: `${user}_${entry.date?.slice(0,7)}` });
}
