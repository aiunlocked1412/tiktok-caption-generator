<div align="center">

# 🔴 TikTok Caption Generator

**สร้างแคปชั่น TikTok ขายของด้วย AI ในคลิกเดียว — พร้อมแฮชแท็ก และปุ่มคัดลอก**

เว็บแอปหน้าเดียว โทนขาว-แดง ใช้งานง่ายบนมือถือ ขับเคลื่อนด้วย **GLM 5.3 Flash** ผ่าน [OpenRouter](https://openrouter.ai)

![Node](https://img.shields.io/badge/Node.js-20.6%2B-e11d2e?logo=node.js&logoColor=white)
![Dependencies](https://img.shields.io/badge/dependencies-0-e11d2e)
![Model](https://img.shields.io/badge/model-z--ai%2Fglm--5.3--flash-e11d2e)

<img src="screenshot/form-16x9.png" alt="หน้าแรกของ TikTok Caption Generator" width="100%" />

</div>

---

## ✨ ความสามารถ

| | |
|---|---|
| ✍️ **กรอกง่าย** | ใส่ชื่อสินค้า รายละเอียด และราคา/โปรโมชั่น (ไม่บังคับ) |
| 🎭 **เลือกโทนได้ 4 แบบ** | 😆 สนุก · 💼 มืออาชีพ · 🔥 เร่งปิดการขาย · 🌸 ละมุน |
| 🪝 **แคปชั่นสไตล์ TikTok** | บรรทัดแรกเป็น hook หยุดนิ้ว → จุดเด่นสินค้า → ปิดด้วย Call-to-Action |
| #️⃣ **แฮชแท็ก 5 อันพอดี** | ผสมไทย-อังกฤษ เกี่ยวกับสินค้าจริง (คุมทั้งใน prompt และฝั่ง server) |
| 📋 **คัดลอกได้ 3 แบบ** | เฉพาะแคปชั่น · เฉพาะแฮชแท็ก · ทั้งหมดในครั้งเดียว |
| 🛡️ **ปลอดภัยต่อร้านค้า** | สั่งห้ามคำโอ้อวด/การันตี เช่น 100%, หายขาด, เห็นผลทันที |
| 🔐 **API key ไม่หลุด** | key อยู่ฝั่ง server เท่านั้น เบราว์เซอร์ไม่เคยเห็น |

## 📸 ตัวอย่างผลลัพธ์

<div align="center">
<img src="screenshot/result.png" alt="ตัวอย่างแคปชั่นที่สร้างจริง" width="420" />
</div>

> ตัวอย่างนี้เป็นผลลัพธ์จริงจากโมเดล สำหรับสินค้า “เซรั่มวิตามินซี หน้าใส” โทนสนุก

## 🚀 เริ่มใช้งาน

**สิ่งที่ต้องมี:** Node.js 20.6 ขึ้นไป และ API key จาก [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys)

```bash
git clone https://github.com/aiunlocked1412/tiktok-caption-generator.git
cd tiktok-caption-generator
cp .env.example .env      # แล้วใส่ OPENROUTER_API_KEY ในไฟล์ .env
npm start
```

เปิด **http://localhost:3000** — เสร็จ! ไม่ต้อง `npm install` เพราะไม่มี dependency เลย

## ⚙️ ตั้งค่า (`.env`)

| ตัวแปร | จำเป็น | ค่าเริ่มต้น | คำอธิบาย |
|---|---|---|---|
| `OPENROUTER_API_KEY` | ✅ | – | API key ของ OpenRouter |
| `OPENROUTER_MODEL` | | `z-ai/glm-5.3-flash` | เปลี่ยนเป็นโมเดลอื่นบน OpenRouter ได้ |
| `PORT` | | `3000` | พอร์ตของ server |

## 🧩 โครงสร้างโปรเจกต์

```
├── public/index.html   # หน้าเว็บ (HTML + CSS + JS ไฟล์เดียว)
├── server.js           # เสิร์ฟหน้าเว็บ + proxy เรียก OpenRouter
├── .env.example        # ตัวอย่างไฟล์ตั้งค่า
└── screenshot/         # ภาพประกอบ README
```

**การทำงาน:** เบราว์เซอร์ → `POST /api/generate` → `server.js` แนบ API key แล้วเรียก OpenRouter → แยก JSON `{caption, hashtags}` → ส่งกลับมาแสดงผล

### ปรับแต่ง prompt

แก้ได้ใน `server.js`:
- `SYSTEM_PROMPT` — กติกาการเขียนแคปชั่น
- `TONES` — คำอธิบายของแต่ละโทน
- `MAX_TAGS` — จำนวนแฮชแท็กสูงสุด (ถ้าแก้ อย่าลืมแก้ตัวเลขใน prompt ให้ตรงกัน)

แก้แล้วรีสตาร์ท server (`npm start`) เพื่อให้มีผล

## ⚠️ ข้อควรรู้

- ข้อความจาก AI อาจมีคำพิมพ์ผิดหรือเติมคุณสมบัติที่ไม่ได้กรอก — **อ่านทวนก่อนโพสต์ทุกครั้ง**
- ค่าใช้จ่ายต่อการสร้าง 1 ครั้งต่ำมาก (ระดับเศษสตางค์) ดูราคาล่าสุดที่ [หน้าโมเดล](https://openrouter.ai/z-ai/glm-5.3-flash)
- ห้าม commit ไฟล์ `.env` — ตั้งไว้ใน `.gitignore` แล้ว

---

<div align="center">
Made with ❤️ for Thai sellers · Powered by OpenRouter · GLM 5.3 Flash
</div>
