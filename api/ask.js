export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { goal, items } = req.body;

  if (!goal) {
    return res.status(400).json({ error: "goal is required" });
  }

  const schema = '{"title":"タイトル","summary":"1文","parts":[{"name":"商品名","reason":"1文の理由","monotaro":"あり","priority":"必須"}],"warnings":["注意1","注意2","注意3"],"reviews":[{"stars":4,"text":"レビュー","meta":"用途"},{"stars":5,"text":"レビュー2","meta":"用途2"}]}';

  const prompt = "モノタロウのAIアドバイザーとして回答してください。JSONのみ返してください。コードブロック不要。各フィールドは短く（reason・summaryは1文）。\n\n目的: " + goal + "\n手持ち: " + (items || "なし") + "\n\n" + schema + "\n\nparts3〜5個。monotaro=あり/要確認/なし。priority=必須/推奨/あると便利。";

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const raw = data.content?.[0]?.text || "";
    let clean = raw.replace(/^```json\s*/g, "").replace(/^```\s*/g, "").replace(/```\s*$/g, "").trim();
    const s = clean.indexOf("{");
    const e = clean.lastIndexOf("}");
    if (s !== -1 && e !== -1) clean = clean.slice(s, e + 1);
    const parsed = JSON.parse(clean);

    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
