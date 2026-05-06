const asyncHandler = require('express-async-handler');
const sendResponse = require('../utils/sendResponse');
const { askGemini } = require('../services/geminiService');

const chatWithAi = asyncHandler(async (req, res) => {
    const message = String(req.body?.message || '').trim();
    const reply = await askGemini({ userMessage: message });

    sendResponse(
        res,
        200,
        {
            reply,
            model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        },
        'Respuesta generada por IA'
    );
});

module.exports = {
    chatWithAi,
};
