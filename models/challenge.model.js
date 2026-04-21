const mongoose = require('mongoose');

const challengeOptionSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: [true, 'La clave de opcion es requerida'],
            trim: true,
            maxlength: [10, 'La clave de opcion no puede exceder 10 caracteres'],
        },
        title: {
            type: String,
            trim: true,
            maxlength: [120, 'El titulo de opcion no puede exceder 120 caracteres'],
            default: '',
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'La descripcion de opcion no puede exceder 500 caracteres'],
            default: '',
        },
        imageUrl: {
            type: String,
            trim: true,
            default: '',
        },
    },
    { _id: false }
);

const challengeSchema = new mongoose.Schema(
    {
        audience: {
            type: String,
            enum: ['client', 'developer'],
            required: [true, 'La audiencia es requerida'],
        },
        title: {
            type: String,
            required: [true, 'El titulo del reto es requerido'],
            trim: true,
            maxlength: [120, 'El titulo no puede exceder 120 caracteres'],
        },
        prompt: {
            type: String,
            required: [true, 'El enunciado del reto es requerido'],
            trim: true,
            maxlength: [3000, 'El enunciado no puede exceder 3000 caracteres'],
        },
        category: {
            type: String,
            trim: true,
            maxlength: [100, 'La categoria no puede exceder 100 caracteres'],
            default: '',
        },
        question: {
            type: String,
            trim: true,
            maxlength: [500, 'La pregunta no puede exceder 500 caracteres'],
            default: '',
        },
        imageUrl: {
            type: String,
            trim: true,
            default: '',
        },
        options: {
            type: [challengeOptionSchema],
            default: [],
        },
        correctOptionKey: {
            type: String,
            trim: true,
            default: '',
        },
        explanation: {
            type: String,
            trim: true,
            maxlength: [1200, 'La explicacion no puede exceder 1200 caracteres'],
            default: '',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

challengeSchema.index({ audience: 1, isActive: 1, createdAt: -1 });

const Challenge = mongoose.model('Challenge', challengeSchema);

module.exports = Challenge;
