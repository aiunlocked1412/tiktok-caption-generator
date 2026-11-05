// TikTok Caption Generator — server แบบไม่มี dependency (Node 20+)
// ทำหน้าที่เสิร์ฟหน้าเว็บ และเป็น proxy เรียก OpenRouter โดยเก็บ API key ไว้ฝั่ง server
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT) || 3000;
const API_KEY = process.env.OPENROUTER_API_KEY || "";
const MODEL = process.env.OPENROUTER_MODEL || "z-ai/glm-5.3-flash";
const INDEX = path.join(__dirname, "public", "index.html");
const MAX_TAGS = 5; // จำนวนแฮชแท็กสูงสุดที่ส่งกลับไปหน้าเว็บ

const SYSTEM_PROMPT = `คุณคือนักเขียนแคปชั่น TikTok สายขายของมืออาชีพ เขียนภาษาไทยเป็นกันเอง สนุก กระชับ อ่านง่ายบนมือถือ
กติกา:
- บรรทัดแรกต้องเป็น hook ที่หยุดนิ้วคนเลื่อนฟีด
- เล่าจุดเด่น/ประโยชน์ของสินค้าสั้น ๆ 2-4 บรรทัด ใส่อีโมจิพอดี ๆ
- ปิดท้ายด้วย Call-to-Action เช่น กดตะกร้า / กดติดตาม / คอมเมนต์ถาม
- ห้ามใช้คำการันตีหรือโอ้อวดเกินจริง เช่น 100%, หายขาด, การันตี, ดีที่สุดในโลก, เห็นผลทันที
- แฮชแท็กต้องมีจำนวน 5 อันพอดี ห้ามเกิน 5 อันเด็ดขาด ผสมไทยและอังกฤษ เกี่ยวกับสินค้าจริง และมีแท็กทั่วไป เช่น #tiktokshop #ของดีบอกต่อ
- ห้ามใส่แฮชแท็กในข้อความ caption ให้ใส่เฉพาะใน hashtags เท่านั้น
ตอบกลับเป็น JSON เท่านั้น ไม่มีข้อความอื่น รูปแบบ:
{"caption": "ข้อความแคปชั่น (ขึ้นบรรทัดใหม่ด้วย \\n ได้)", "hashtags": ["#แท็ก1", "#tag2"]}`;

const TONES = {
  fun: "สนุก ขี้เล่น วัยรุ่น",
  pro: "น่าเชื่อถือ มืออาชีพ",
  urgent: "เร่งด่วน กระตุ้นให้ซื้อตอนนี้ (โปรมีจำกัด)",
  soft: "อบอุ่น ละมุน เล่าเรื่อง",
};

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function readBody(req, limit = 20_000) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      if (data.length > limit) reject(new Error("too_large"));
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

// แยก JSON ออกจากคำตอบ (กันกรณีโมเดลห่อด้วย ```json)
function parseResult(text) {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      const obj = JSON.parse(cleaned.slice(start, end + 1));
      if (typeof obj.caption === "string") {
        const tags = Array.isArray(obj.hashtags) ? obj.hashtags : [];
        return {
          caption: obj.caption.trim(),
          hashtags: tags
            .map((t) => String(t).trim().replace(/\s+/g, ""))
            .filter(Boolean)
            .map((t) => (t.startsWith("#") ? t : "#" + t))
            .slice(0, MAX_TAGS),
        };
      }
    } catch {}
  }
  // fallback: ดึงแฮชแท็กจากข้อความดิบ
  const hashtags = (cleaned.match(/#[^\s#]+/g) || []).slice(0, MAX_TAGS);
  const caption = cleaned.replace(/#[^\s#]+/g, "").trim();
  return { caption, hashtags };
}

const ERRORS = {
  400: "คำขอไม่ถูกต้อง (400)",
  401: "API key ไม่ถูกต้อง — ตรวจสอบ OPENROUTER_API_KEY ในไฟล์ .env",
  402: "เครดิต OpenRouter ไม่พอ — เติมเครดิตที่ openrouter.ai",
  403: "ถึงวงเงินที่ตั้งไว้ หรือ key ถูกปิดใช้งาน",
  404: "ไม่พบโมเดล หรือไม่มีผู้ให้บริการพร้อมใช้งานตอนนี้",
  429: "เรียกใช้ถี่เกินไป รอสักครู่แล้วลองใหม่",
  502: "ผู้ให้บริการโมเดลขัดข้องชั่วคราว ลองใหม่อีกครั้ง",
};

async function handleGenerate(req, res) {
  if (!API_KEY) {
    return send(res, 500, { error: "ยังไม่ได้ตั้งค่า OPENROUTER_API_KEY ในไฟล์ .env" });
  }
  let input;
  try {
    input = JSON.parse(await readBody(req));
  } catch {
    return send(res, 400, { error: "ข้อมูลที่ส่งมาไม่ถูกต้อง" });
  }
  const name = String(input.name || "").trim().slice(0, 150);
  const details = String(input.details || "").trim().slice(0, 1500);
  const price = String(input.price || "").trim().slice(0, 60);
  const tone = TONES[input.tone] || TONES.fun;
  if (!name) return send(res, 400, { error: "กรุณากรอกชื่อสินค้า" });

  const userPrompt = [
    `ชื่อสินค้า: ${name}`,
    details && `รายละเอียด: ${details}`,
    price && `ราคา/โปรโมชั่น: ${price}`,
    `โทนการเขียน: ${tone}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "X-Title": "TikTok Caption Generator",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.9,
        max_tokens: 8000, // เผื่อ reasoning token ไม่ให้ content ว่าง
      }),
      signal: AbortSignal.timeout(90_000),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      const msg = ERRORS[r.status] || data?.error?.message || `เกิดข้อผิดพลาด (${r.status})`;
      console.error("OpenRouter error", r.status, data?.error?.message);
      return send(res, r.status >= 500 ? 502 : r.status, { error: msg });
    }

    const choice = data.choices?.[0];
    const content = choice?.message?.content?.trim();
    if (!content) {
      const why = choice?.finish_reason === "length" ? " (token ไม่พอ)" : "";
      return send(res, 502, { error: "โมเดลไม่ได้ส่งข้อความกลับมา" + why + " ลองกดสร้างใหม่อีกครั้ง" });
    }
    return send(res, 200, parseResult(content));
  } catch (e) {
    const timeout = e.name === "TimeoutError";
    console.error("Request failed", e.message);
    return send(res, 504, { error: timeout ? "รอนานเกินไป ลองใหม่อีกครั้ง" : "เชื่อมต่อ OpenRouter ไม่ได้" });
  }
}

http
  .createServer((req, res) => {
    if (req.method === "POST" && req.url === "/api/generate") return handleGenerate(req, res);
    if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return fs.createReadStream(INDEX).pipe(res);
    }
    send(res, 404, { error: "not found" });
  })
  .listen(PORT, () => {
    console.log(`✅ เปิดใช้งานที่ http://localhost:${PORT}`);
    if (!API_KEY) console.warn("⚠️  ยังไม่มี OPENROUTER_API_KEY ใน .env");
  });
