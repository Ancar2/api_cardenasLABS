const asyncHandler = require('express-async-handler');
const Challenge = require('../models/challenge.model');
const ChallengeResponse = require('../models/challengeResponse.model');
const sendResponse = require('../utils/sendResponse');
const { uploadImageToS3 } = require('../services/s3UploadService');

const MAX_ACTIVE_CHALLENGES_PER_AUDIENCE = 3;

const normalizeString = (value) => {
    if (value === undefined || value === null) {
        return '';
    }

    return String(value).trim();
};

const normalizeChallengeOptions = (options) => {
    if (!Array.isArray(options)) {
        return [];
    }

    return options
        .map((option) => ({
            key: normalizeString(option?.key).toUpperCase(),
            title: normalizeString(option?.title),
            description: normalizeString(option?.description),
            imageUrl: normalizeString(option?.imageUrl),
        }))
        .filter((option) => option.key);
};

const ensureCorrectOptionExists = ({ options, correctOptionKey }) => {
    if (!correctOptionKey) {
        return;
    }

    const keys = options.map((option) => option.key);
    if (!keys.includes(correctOptionKey)) {
        throw new Error('correctOptionKey debe existir dentro de options');
    }
};

const ensureMaxActiveChallenges = async ({ audience, excludeId = null }) => {
    const filter = { audience, isActive: true };
    if (excludeId) {
        filter._id = { $ne: excludeId };
    }

    const count = await Challenge.countDocuments(filter);
    if (count >= MAX_ACTIVE_CHALLENGES_PER_AUDIENCE) {
        throw new Error(
            `Solo se permiten ${MAX_ACTIVE_CHALLENGES_PER_AUDIENCE} retos activos para ${audience}`
        );
    }
};

const listPublicChallenges = asyncHandler(async (req, res) => {
    const filter = { isActive: true };

    if (req.query.audience) {
        filter.audience = req.query.audience;
    }

    const challenges = await Challenge.find(filter)
        .select('-correctOptionKey -explanation')
        .sort({ audience: 1, createdAt: -1 });
    sendResponse(res, 200, challenges, 'Retos activos');
});

const submitChallengeResponse = asyncHandler(async (req, res) => {
    const challenge = await Challenge.findOne({ _id: req.params.id, isActive: true });
    if (!challenge) {
        res.status(404);
        throw new Error('Reto no encontrado o inactivo');
    }

    const username = req.body.username.trim();
    const usernameNormalized = username.toLowerCase();
    const answer = req.body.answer.trim();

    const existingResponse = await ChallengeResponse.findOne({
        challenge: challenge._id,
        usernameNormalized,
    });

    if (existingResponse) {
        res.status(409);
        throw new Error('Este username ya respondió este reto');
    }

    const created = await ChallengeResponse.create({
        challenge: challenge._id,
        username,
        usernameNormalized,
        answer,
    });

    sendResponse(
        res,
        201,
        {
            _id: created._id,
            challenge: created.challenge,
            username: created.username,
            answer: created.answer,
            createdAt: created.createdAt,
        },
        'Respuesta enviada'
    );
});

const listAdminChallenges = asyncHandler(async (req, res) => {
    const filter = {};

    if (req.query.audience) {
        filter.audience = req.query.audience;
    }

    if (req.query.isActive === 'true' || req.query.isActive === 'false') {
        filter.isActive = req.query.isActive === 'true';
    }

    const challenges = await Challenge.aggregate([
        { $match: filter },
        {
            $lookup: {
                from: 'challengeresponses',
                localField: '_id',
                foreignField: 'challenge',
                as: 'responses',
            },
        },
        {
            $addFields: {
                responsesCount: { $size: '$responses' },
            },
        },
        {
            $project: {
                responses: 0,
            },
        },
        {
            $sort: {
                audience: 1,
                createdAt: -1,
            },
        },
    ]);

    sendResponse(res, 200, challenges, 'Retos (admin)');
});

const createChallenge = asyncHandler(async (req, res) => {
    const { audience, title, prompt, category, question, imageUrl, options, correctOptionKey, explanation, isActive } = req.body;
    const activeFlag = isActive !== undefined ? isActive : true;

    if (activeFlag) {
        await ensureMaxActiveChallenges({ audience });
    }

    const normalizedOptions = normalizeChallengeOptions(options);
    const normalizedCorrectKey = normalizeString(correctOptionKey).toUpperCase();
    ensureCorrectOptionExists({
        options: normalizedOptions,
        correctOptionKey: normalizedCorrectKey,
    });

    const challenge = await Challenge.create({
        audience,
        title,
        prompt,
        category: normalizeString(category),
        question: normalizeString(question),
        imageUrl: normalizeString(imageUrl),
        options: normalizedOptions,
        correctOptionKey: normalizedCorrectKey,
        explanation: normalizeString(explanation),
        isActive: activeFlag,
    });

    sendResponse(res, 201, challenge, 'Reto creado');
});

const updateChallenge = asyncHandler(async (req, res) => {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
        res.status(404);
        throw new Error('Reto no encontrado');
    }

    const nextAudience =
        req.body.audience !== undefined ? req.body.audience : challenge.audience;
    const nextIsActive =
        req.body.isActive !== undefined ? req.body.isActive : challenge.isActive;

    if (nextIsActive) {
        await ensureMaxActiveChallenges({
            audience: nextAudience,
            excludeId: challenge._id,
        });
    }

    if (req.body.audience !== undefined) challenge.audience = req.body.audience;
    if (req.body.title !== undefined) challenge.title = req.body.title;
    if (req.body.prompt !== undefined) challenge.prompt = req.body.prompt;
    if (req.body.category !== undefined) challenge.category = normalizeString(req.body.category);
    if (req.body.question !== undefined) challenge.question = normalizeString(req.body.question);
    if (req.body.imageUrl !== undefined) challenge.imageUrl = normalizeString(req.body.imageUrl);
    const nextOptions =
        req.body.options !== undefined
            ? normalizeChallengeOptions(req.body.options)
            : challenge.options.map((option) => ({
                  key: option.key,
                  title: option.title,
                  description: option.description,
                  imageUrl: option.imageUrl,
              }));
    const nextCorrectOptionKey =
        req.body.correctOptionKey !== undefined
            ? normalizeString(req.body.correctOptionKey).toUpperCase()
            : challenge.correctOptionKey;

    ensureCorrectOptionExists({
        options: nextOptions,
        correctOptionKey: nextCorrectOptionKey,
    });

    if (req.body.options !== undefined) challenge.options = nextOptions;
    if (req.body.correctOptionKey !== undefined) {
        challenge.correctOptionKey = nextCorrectOptionKey;
    }
    if (req.body.explanation !== undefined) {
        challenge.explanation = normalizeString(req.body.explanation);
    }
    if (req.body.isActive !== undefined) challenge.isActive = req.body.isActive;

    const updated = await challenge.save();
    sendResponse(res, 200, updated, 'Reto actualizado');
});

const deleteChallenge = asyncHandler(async (req, res) => {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
        res.status(404);
        throw new Error('Reto no encontrado');
    }

    await ChallengeResponse.deleteMany({ challenge: challenge._id });
    await challenge.deleteOne();

    sendResponse(res, 200, {}, 'Reto eliminado');
});

const listChallengeResponses = asyncHandler(async (req, res) => {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
        res.status(404);
        throw new Error('Reto no encontrado');
    }

    const responses = await ChallengeResponse.find({ challenge: challenge._id }).sort({
        createdAt: -1,
    });

    sendResponse(
        res,
        200,
        {
            challenge,
            responses,
            totalResponses: responses.length,
        },
        'Respuestas del reto'
    );
});

const uploadChallengeImage = asyncHandler(async (req, res) => {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
        res.status(400);
        throw new Error('Debe enviar imageBase64');
    }

    const result = await uploadImageToS3({
        base64DataUrl: imageBase64,
        folder: 'challenges',
    });

    sendResponse(res, 201, result, 'Imagen de reto subida');
});

module.exports = {
    listPublicChallenges,
    submitChallengeResponse,
    listAdminChallenges,
    createChallenge,
    updateChallenge,
    deleteChallenge,
    listChallengeResponses,
    uploadChallengeImage,
};
