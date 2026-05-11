export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ error: "No image" });
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: imageBase64,
              }
            },
            {
              type: "text",
              text: `このレシートを解析してJSONのみ返答。説明不要。\n{"store":"店名","date":"YYYY-MM-DD","total":合計金額の数値,"category":"食費・外食 か 光熱費・通信費 か 交通費 か 医療・美容 か 娯楽・趣味 か 日用品・衣類 か 教育・保険","subcategory":"サブカテゴリ","items":[{"name":"商品名","price":価格}],"memo":""}`
            }
          ]
        }]
      })
    });
    const data = await response.json();
   if (data.error) throw new Error(data.error.message);
const text = data.content?.find(b => b.type === "text")?.text || "";
const match = text.match(/\{[\s\S]*\}/);
if (!match) throw new Error(`JSON取得失敗: ${text.slice(0,100)}`);
const parsed = JSON.parse(match[0]);
res.json({ ok: true, data: parsed });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
