const GEMINI_BASE_URL =
    process.env.GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 15000);
const GEMINI_MAX_OUTPUT_TOKENS = Number(process.env.GEMINI_MAX_OUTPUT_TOKENS || 900);

const buildSystemPrompt = () =>
    [
        'Eres la IA oficial de Cardenas Labs.',
        'Responde en español claro, profesional y breve.',
        'Objetivo: ayudar con servicios, cotizaciones y dudas del sitio, encaminando al cliente hacia completar su solicitud.',
        'Si no sabes un dato exacto, dilo con honestidad y propone siguiente paso.',
        'No inventes precios cerrados ni promesas técnicas imposibles.',
        'Cuando ofrezcas alternativas o siguientes pasos, devuélvelos en lista con viñetas usando "- " para que sean seleccionables.',
        'Si el usuario busca desarrollo o asesoría, invita a iniciar cotización y a completar datos clave (nombre, correo, tipo de proyecto y descripción).',
    ].join(' ');

const askGeminiRequest = async ({ userMessage, systemPrompt }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        const err = new Error('No se configuró GEMINI_API_KEY en el entorno');
        err.statusCode = 500;
        throw err;
    }

    const url = `${GEMINI_BASE_URL}/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: controller.signal,
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: systemPrompt || buildSystemPrompt() }],
                },
                contents: [
                    {
                        role: 'user',
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
                ?.map((part) => part?.text || '')
                .join('')
                .trim() || '';

        if (!text) {
            const err = new Error('Gemini no devolvió contenido');
            err.statusCode = 502;
            throw err;
        }

        return {
            text,
            finishReason: String(candidate?.finishReason || ''),
        };
    } catch (error) {
        if (error?.name === 'AbortError') {
            const timeoutErr = new Error('La IA tardó demasiado en responder');
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

    if (first.finishReason !== 'MAX_TOKENS') {
        return first.text;
    }

    const continuationPrompt = [
        'Continúa exactamente donde te quedaste y completa la idea final sin repetir lo anterior.',
        '',
        `Texto previo: """${first.text}"""`,
    ].join('\n');

    const second = await askGeminiRequest({
        userMessage: continuationPrompt,
        systemPrompt: baseSystemPrompt,
    });

    return `${first.text}\n${second.text}`.trim();
};

module.exports = {
    askGemini,
};
