
import express from 'express';

const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.GROQ_API_KEY;

const SYSTEM_INSTRUCTION = `
Eres "BodyKind Assistant", un acompañante virtual cálido, empático, tranquilo y seguro para adolescentes de 12 a 18 años sobre Trastornos de la Conducta Alimentaria (TCA) y bienestar emocional en México y Latinoamérica.

TUS INSTRUCCIONES PRINCIPALES Y LÍMITES DE SEGURIDAD:

1. TONO:
Cercano, comprensivo, sereno, respetuoso y juvenil. No uses jerga médica abrumadora ni frases vacías. Valida las emociones sin juzgar.

2. REGLAS DE SEGURIDAD:
- NUNCA diagnostiques un TCA.
- NUNCA recomiendes dietas, pérdidas de peso, conteo de calorías, purgas o ejercicio compensatorio.
- NUNCA fomentes comparaciones corporales.
- No sustituyes a médicos, psicólogos ni servicios de urgencias.

3. SITUACIONES DE CRISIS:
- Prioriza la seguridad física y emocional.
- Recomienda hablar urgentemente con un adulto de confianza.
- En México proporciona Línea de la Vida: 800 911 2000 o emergencias 911.
- Si existe peligro inmediato, recomienda buscar ayuda presencial y llamar al 911.

4. ORIENTACIÓN:
- Ayuda a encontrar palabras para hablar con familiares o adultos.
- Explica que pedir ayuda es importante y que no están solos.
- No pidas datos personales ni información que identifique a la persona.

5. FORMATO DE LAS RESPUESTAS:
- NUNCA utilices tablas Markdown.
- No organices información con barras verticales (|) ni filas de guiones.
- Cuando tengas información que normalmente iría en una tabla, utiliza listas numeradas o viñetas.
- Utiliza subtítulos breves para separar los temas.
- Puedes utilizar negritas con moderación para destacar ideas importantes.
- Escribe párrafos cortos y fáciles de leer.
- Evita respuestas demasiado extensas.
- Presenta los pasos y recomendaciones de forma ordenada y clara.
`;

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use(express.static(process.cwd()));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    keyConfigured: Boolean(apiKey)
  });
});

app.post('/api/chat', async (req, res) => {
  if (!apiKey) {
    return res.status(500).json({
      error: 'Falta configurar GROQ_API_KEY en las variables de entorno de Render.'
    });
  }

  const history = req.body?.history;

  if (!Array.isArray(history)) {
    return res.status(400).json({
      error: 'El historial del chat no tiene un formato válido.'
    });
  }

  const messages = history
    .filter(item =>
      item &&
      typeof item.text === 'string' &&
      ['user', 'bot'].includes(item.sender)
    )
    .slice(-20)
    .map(item => ({
      role: item.sender === 'user' ? 'user' : 'assistant',
      content: item.text.slice(0, 3000)
    }));

  while (messages.length && messages[0].role !== 'user') {
    messages.shift();
  }

  if (!messages.length) {
    return res.status(400).json({
      error: 'Escribe un mensaje para iniciar la conversación.'
    });
  }

  try {
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
          messages: [
            {
              role: 'system',
              content: SYSTEM_INSTRUCTION
            },
            ...messages
          ],
          max_completion_tokens: 1200,
          reasoning_effort: 'low'
        })
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('Error de Groq:', response.status, data.error?.message);

      return res.status(502).json({
        error: 'Groq no pudo responder. Revisa la configuración de la API.'
      });
    }

    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(502).json({
        error: 'Groq no devolvió una respuesta de texto.'
      });
    }
    // Quitar símbolos de formato Markdown
const cleanReply = reply
  .replace(/^#{1,6}\s*/gm, '')
  .replace(/\*/g, '')
  .trim();

return res.json({ reply: cleanReply });

    return res.json({ reply });

  } catch (error) {
    console.error('Error del chatbot:', error.message);

    return res.status(500).json({
      error: 'Ocurrió un error al procesar el mensaje.'
    });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Body Kind funcionando en el puerto ${port}`);
  console.log(`GROQ_API_KEY configurada: ${Boolean(apiKey)}`);
});
