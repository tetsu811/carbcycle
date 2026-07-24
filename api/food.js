// AI 食物營養估算 API (Gemini)
// 需要 Vercel 環境變數: GEMINI_API_KEY
const SUPABASE_URL = 'https://fugpbunpudlaixspijhh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_fLiV9AhKv4pnXaclPmrQTg_ADidh085';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  // 驗證 Supabase 登入 token，避免 API 被外人濫用
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  const u = await fetch(SUPABASE_URL + '/auth/v1/user', {
    headers: { apikey: SUPABASE_KEY, authorization: 'Bearer ' + token },
  });
  if (!u.ok) return res.status(401).json({ error: 'unauthorized' });

  const name = String((req.body && req.body.name) || '').slice(0, 80).trim();
  if (!name) return res.status(400).json({ error: 'no name' });

  const prompt =
    '你是營養師。使用者輸入一個食物名稱（多為台灣常見食物），請估計「一份常見份量」的營養素。' +
    '只回傳 JSON，格式：{"c":碳水化合物克數,"f":脂肪克數,"p":蛋白質克數,"serving":"份量描述(10字內)"}。' +
    '數字取整數。若名稱含數量（如 x2、兩顆、13顆），請按總量估計。食物名稱：' + name;

  const r = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' +
      process.env.GEMINI_API_KEY,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
      }),
    }
  );
  if (!r.ok) {
    const t = await r.text();
    return res.status(502).json({ error: 'gemini error', detail: t.slice(0, 300) });
  }
  const data = await r.json();
  try {
    const text = data.candidates[0].content.parts[0].text;
    const out = JSON.parse(text);
    return res.status(200).json({
      c: Math.max(0, Math.round(Number(out.c) || 0)),
      f: Math.max(0, Math.round(Number(out.f) || 0)),
      p: Math.max(0, Math.round(Number(out.p) || 0)),
      serving: String(out.serving || '').slice(0, 30),
    });
  } catch (e) {
    return res.status(502).json({ error: 'parse error' });
  }
};
