const mongoose = require('mongoose');

const challengeResponseSchema = new mongoose.Schema(
    {
        challenge: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Challenge',
            required: true,
            index: true,
        },
        username: {
            type: String,
            required: [true, 'El username es requerido'],
            trim: true,
            maxlength: [60, 'El username no puede exceder 60 caracteres'],
        },
        usernameNormalized: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        answer: {
            type: String,
            required: [true, 'La respuesta es requerida'],
            trim: true,
            maxlength: [3000, 'La respuesta no puede exceder 3000 caracteres'],
        },
    },
    { timestamps: true }
);

challengeResponseSchema.index(
    { challenge: 1, usernameNormalized: 1 },
    { unique: true, name: 'unique_challenge_username' }
);

const ChallengeResponse = mongoose.model('ChallengeResponse', challengeResponseSchema);

module.exports = ChallengeResponse;
