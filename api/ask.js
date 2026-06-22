export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch(e) { return res.status(400).json({ error: "Invalid JSON body" }); }
  }

  const goal = body?.goal;
  const items = body?.items || "なし";

  if (!goal) return res.status(400).json({ error: "goal is required" });

  const prompt = `モノタロウのAIアドバイザーとして回答してください。必ずJSONのみ返してください。コードブロック（\`\`\`）は絶対に使わないでください。

目的: ${goal}
手持ち: ${items}

以下の形式で返してください:
{"title":"タイトル","summary":"1文","parts":[{"name":"商品名","reason":"理由","monotaro":"あり","priority":"必須"}],"warnings":["注意1","注意2","注意3"],"reviews":[{"stars":4,"text":"レビュー","meta":"用途"},{"stars":5,"text":"レビュー2","meta":"用途2"}]}

parts3〜5個。monotaro=あり/要確認/なし。priority=必須/推奨/あると便利。`;

  try {
    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const apiData = await apiRes.json();

    if (!apiRes.ok) {
      return res.status(500).json({ error: "Anthropic API error: " + (apiData.error?.message || JSON.stringify(apiData)) });
    }

    const raw = apiData.content?.[0]?.text || "";

    // JSONを確実に取り出す
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1) {
      return res.status(500).json({ error: "JSON not found", raw: raw.slice(0, 200) });
    }

    const jsonStr = raw.slice(start, end + 1);
    const parsed = JSON.parse(jsonStr);

    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
