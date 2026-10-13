# BodyKind + Google Gemini

Este proyecto sirve el `index.html` de BodyKind y añade el endpoint `/api/chat` para hablar con Gemini. La clave API se mantiene en una variable de entorno del servidor; no la escribas en `index.html` ni la subas a GitHub.

## Probar en tu computadora (opcional)
1. Instala Node.js LTS desde https://nodejs.org/.
2. En esta carpeta, copia `.env.example` como `.env`.
3. En `.env`, reemplaza el texto de ejemplo por tu clave de Gemini de https://aistudio.google.com/apikey.
4. Abre una terminal en esta carpeta y ejecuta `npm install` y luego `npm start`.
5. Abre http://localhost:3000. Para comprobar el servidor, visita http://localhost:3000/api/health.

## Publicar gratis en Render
1. Sube el contenido de esta carpeta a un repositorio de GitHub. NO subas el archivo `.env` ni pegues la clave en el código.
2. En https://render.com/ crea una cuenta y elige **New + → Web Service**; conecta el repositorio.
3. Configura **Build Command**: `npm install`; **Start Command**: `npm start`; plan: **Free**.
4. En la sección **Environment** del servicio, añade `GEMINI_API_KEY` con tu clave de Google AI Studio. Opcionalmente añade `GEMINI_MODEL` con valor `gemini-2.5-flash`.
5. Pulsa **Deploy**. Al terminar, abre la URL `onrender.com` que Render proporciona y prueba el chat.

Nota: los servicios gratuitos de Render pueden tardar alrededor de un minuto en despertar tras un periodo sin uso. El uso de Gemini puede estar sujeto a cuotas o cargos según el plan y las condiciones de Google; revisa tu cuenta y límites.
