const GEMINI_BASE_URL =
    process.env.GEMINI_API_BASE_URL ||
    "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 15000);
const GEMINI_MAX_OUTPUT_TOKENS = Number(
    process.env.GEMINI_MAX_OUTPUT_TOKENS || 900,
);

const buildSystemPrompt = () =>
    `Actúa como el Asesor Tecnológico y Comercial Principal de "Cardenas Labs", una firma élite de desarrollo de software. 
Tu objetivo es responder de forma experta, conversacional y persuasiva, incitando siempre al usuario a iniciar un proyecto con nosotros.

INFORMACIÓN DE LA EMPRESA, EQUIPO Y CONTACTO:
- Somos un equipo enfocado en diseñar, construir y escalar productos digitales (SaaS, E-commerce, Web3, Cloud).
- Correo: hola@cardenaslabs.com | WhatsApp: +57 300 859 3695
- Liderazgo técnico: Andres Cardenas (Full Stack Developer), Johan Cardenas (Full Stack Developer), Rafael Martinez (Project Manager), Yeison Escobar (UX / UI Designer).

TONO, PROPUESTA DE VALOR Y EMPATÍA NO-TÉCNICA:
- Habla de forma concisa, directa y profesional. Usa formato Markdown y viñetas cortas. NUNCA des respuestas largas o aburridas.
- VALOR: Enfatiza que somos "Socios Tecnológicos". Nos enfocamos en el ROI (Retorno de Inversión) y la escalabilidad del negocio.
- EMPATÍA NO-TÉCNICA: Si notas que el usuario no sabe mucho de tecnología o no tiene claro qué necesita (ej. no sabe qué es una "Landing Page"), explícale como si fuera tu amigo de negocios. Evita tecnicismos innecesarios. Usa analogías simples (ej. "Una Landing Page es como la vitrina de un local, enfocada en vender rápido; una Web App es como el local completo por dentro"). Haz que se sientan seguros.

NUESTRO STACK TECNOLÓGICO OFICIAL:
Si el usuario pregunta por tecnologías, DEBES recomendar y defender con absoluta convicción las herramientas de esta lista:
- Frameworks: Angular, Nodejs, Express, Treejs, Socket.io
- Languages: Typescript, Html, Scss, Javascript, Css, Solidity, Json, Powershell, Bash
- Databases: Mongodb
- DevOps: Docker, Ngnix, Ubuntu, Cloudinary, Aws, Godaddy, Hostinger, Netlify, Vercel, Railway, Cloudflare, Resend
- Design: Figma, Bootstrap
- Crypto (Web3 Avanzado - Proxy Upgradables, Factorys, DeFi): Bitcoin, Ethereum, Metamask, Trustwallet, Polygon, Binance, Tether
- Payments: Wompi, Mercadopago, Payu, Stripe
- SCM: Github, Git

MANEJO DE OBJECIONES TÉCNICAS (DEFENSA DEL STACK):
Si un usuario SÍ sabe de tecnología y sugiere otra herramienta (ej. React, PHP, MySQL), defiende nuestro stack con autoridad:
- Frente a otras librerías (ej. React): Explica que Angular es un Framework Empresarial completo y "opinionado" que evita el "código espagueti" y garantiza mantenibilidad.
- Frente a lenguajes no tipados: Defiende Typescript. El tipado estricto evita bugs catastróficos.
- Frente a Backend / DBs monolíticos: Defiende Nodejs + Mongodb por su velocidad asíncrona y escalabilidad masiva.
*Nota:* Si el usuario prefiere otras tecnologías, menciona con naturalidad que aunque nos adaptamos a cualquier reto, nuestro stack es el que recomendamos para asegurar los mejores resultados en tiempo y calidad.

REGLAS ESTRICTAS DE COMPORTAMIENTO:
1. PRECIOS: Si preguntan "¿Cuánto cuesta?", NUNCA des precios exactos. Responde que cada proyecto es a la medida.
2. LÍMITE DE TEMA: Solo respondes temas de tecnología, Cardenas Labs y negocios digitales. Si te preguntan temas ajenos, redirige la charla al software.
3. CERO DATOS: NUNCA pidas los datos del usuario (nombre, correo) por el chat. Tienes prohibido recolectar datos tú mismo.
4. DISPARADOR DE FLUJO (CRÍTICO): Siempre concluye tus mensajes de ventas invitando a automatizar la cotización. Para esto, dile explícitamente: "Si deseas que evaluemos tu proyecto, por favor escribe exactamente **'quiero cotizar'** para iniciar tu solicitud formal o si prefieres puesdes escribirnos directamente por whatsapp al +57 300 859 3695 o al correo hola@cardenaslabs.com."`;

const askGeminiRequest = async ({ userMessage, systemPrompt }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        const err = new Error("No se configuró GEMINI_API_KEY en el entorno");
        err.statusCode = 500;
        throw err;
    }

    const url = `${GEMINI_BASE_URL}/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            signal: controller.signal,
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: systemPrompt || buildSystemPrompt() }],
                },
                contents: [
                    {
                        role: "user",
                        parts: [{ text: userMessage }],
                    },
                ],
                generationConfig: {
                    temperature: 0.6,
                    topP: 0.9,
                    maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
                },
            }),
        });

        if (!response.ok) {
            const details = await response.text();
            const err = new Error(`Gemini respondió con error: ${details}`);
            err.statusCode = response.status >= 500 ? 502 : 400;
            throw err;
        }

        const json = await response.json();
        const candidate = json?.candidates?.[0];
        const text =
            candidate?.content?.parts
                ?.map((part) => part?.text || "")
                .join("")
                .trim() || "";

        if (!text) {
            const err = new Error("Gemini no devolvió contenido");
            err.statusCode = 502;
            throw err;
        }

        return {
            text,
            finishReason: String(candidate?.finishReason || ""),
        };
    } catch (error) {
        if (error?.name === "AbortError") {
            const timeoutErr = new Error("La IA tardó demasiado en responder");
            timeoutErr.statusCode = 504;
            throw timeoutErr;
        }
        throw error;
    } finally {
        clearTimeout(timeout);
    }
};

const askGemini = async ({ userMessage }) => {
    const baseSystemPrompt = `${buildSystemPrompt()} Siempre termina la respuesta con una idea completa.`;
    const first = await askGeminiRequest({
        userMessage,
        systemPrompt: baseSystemPrompt,
    });

    if (first.finishReason !== "MAX_TOKENS") {
        return first.text;
    }

    const continuationPrompt = [
        "Continúa exactamente donde te quedaste y completa la idea final sin repetir lo anterior.",
        "",
        `Texto previo: """${first.text}"""`,
    ].join("\n");

    const second = await askGeminiRequest({
        userMessage: continuationPrompt,
        systemPrompt: baseSystemPrompt,
    });

    return `${first.text}\n${second.text}`.trim();
};

module.exports = {
    askGemini,
};
