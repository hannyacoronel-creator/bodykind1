import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.GEMINI_API_KEY;

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use(express.static(__dirname));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, keyConfigured: Boolean(apiKey) });
});

app.post('/api/chat', async (req, res) => {
  if (!apiKey) {
    return res.status(500).json({ error: 'Falta configurar GEMINI_API_KEY en las variables de entorno del servidor.' });
  }
  const history = req.body?.history;
  if (!Array.isArray(history)) {
    return res.status(400).json({ error: 'El campo history debe ser una lista.' });
  }

  const contents = history
    .filter((item) => item && typeof item.text === 'string' && ['user', 'bot'].includes(item.sender))
    .map((item) => ({
      role: item.sender === 'user' ? 'user' : 'model',
      parts: [{ text: item.text.slice(0, 6000) }]
    }));
  // The HTML starts with a local welcome message from the bot. Gemini should receive
  // conversation history beginning with the first actual user message.
  while (contents.length && contents[0].role === 'model') contents.shift();
  const userMessages = contents.filter((item) => item.role === 'user');
  if (userMessages.length === 0) {
    return res.status(400).json({ error: 'Escribe un mensaje para iniciar la conversación.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: `Eres el asistente de BodyKind, un sitio educativo de prevención y concientización sobre los trastornos de la conducta alimentaria (TCA). Responde en español, con empatía, respeto y sin juzgar. No diagnostiques ni sustituyas atención profesional. No fomentes dietas extremas, restricción alimentaria, purgas, autolesiones ni pérdida de peso peligrosa. Si alguien expresa riesgo inmediato de hacerse daño, anímale a contactar servicios de emergencia locales y a una persona de confianza. Mantén respuestas claras y cuidadosas.`,
        maxOutputTokens: 700
      }
    });
    const reply = response.text?.trim();
    if (!reply) return res.status(502).json({ error: 'Gemini no devolvió texto. Inténtalo de nuevo.' });
    return res.json({ reply });
  } catch (error) {
    console.error('Error de Gemini:', error?.message || error);
    return res.status(502).json({ error: 'No se pudo obtener una respuesta de Gemini. Revisa la configuración de la API y vuelve a intentarlo.' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`BodyKind listo en http://localhost:${port}`);
  console.log(`GEMINI_API_KEY configurada: ${Boolean(apiKey)}`);
});
