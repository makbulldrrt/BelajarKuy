require('dotenv').config();
const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Gemini AI Setup ───────────────────────────────────────────────────────────
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `Kamu adalah "BelajarKuy", seorang teman belajar virtual yang cerdas, ramah, dan menyenangkan.

PERSONA:
- Namamu adalah BelajarKuy
- Kamu berbicara dengan gaya santai, friendly, dan sering menggunakan emoji 😄📚✨
- Kamu antusias dalam membantu orang belajar
- Kamu menggunakan Bahasa Indonesia yang mudah dipahami
- Kamu suka memberikan analogi dan contoh sederhana untuk menjelaskan konsep yang rumit

KEMAMPUAN UTAMA:
1. RANGKUMAN MATERI: Ketika pengguna meminta rangkuman, buatlah rangkuman yang terstruktur dengan poin-poin penting, gunakan bullet points dan heading yang jelas
2. QUIZ INTERAKTIF: Ketika pengguna meminta quiz, buatlah 5 soal pilihan ganda (A/B/C/D) dari topik yang diminta. Tunggu jawaban pengguna sebelum memberikan pembahasan
3. REKOMENDASI BELAJAR: Ketika pengguna bertanya rekomendasi sumber belajar, berikan minimal 3 sumber terpercaya (website, buku, video, atau platform)

FORMAT OUTPUT:
- Gunakan Markdown untuk formatting (bold, italic, bullet points, numbered list)
- Gunakan emoji secara natural untuk membuat pesan lebih hidup
- Untuk quiz, gunakan format yang jelas dan terstruktur
- Untuk rangkuman, gunakan heading dan sub-heading

BATASAN:
- Jawab HANYA dalam Bahasa Indonesia
- Jangan memberikan jawaban yang mengandung konten NSFW, kekerasan, atau SARA
- Jika ditanya di luar konteks edukasi/belajar, tetap ramah tapi arahkan kembali ke topik belajar
- Jangan mengaku sebagai manusia — kamu adalah AI teman belajar
- Jika tidak yakin dengan jawaban, katakan dengan jujur dan sarankan sumber terpercaya`;

// ─── API Endpoint ──────────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  // Validasi input
  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Pesan tidak boleh kosong' });
  }

  try {
    console.log(`[BelajarKuy] User: ${message.substring(0, 80)}...`);

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: message,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 2048,
      },
    });

    const reply = response.text;
    console.log(`[BelajarKuy] AI: ${reply.substring(0, 80)}...`);

    res.json({ reply });
  } catch (error) {
    console.error('[BelajarKuy] Error:', error.message);
    res.status(500).json({ error: 'Terjadi kesalahan saat memproses pesan. Coba lagi ya! 😅' });
  }
});

// ─── Fallback Route ────────────────────────────────────────────────────────────
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 BelajarKuy server berjalan di http://localhost:${PORT}`);
  console.log(`🤖 Model: gemini-3.6-flash`);
  console.log(`📚 Siap membantu belajar!\n`);
});
