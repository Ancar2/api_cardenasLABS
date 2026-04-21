const mongoose = require('mongoose');

const screenshotSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'El titulo de la imagen es requerido'],
            trim: true,
        },
        imageUrl: {
            type: String,
            required: [true, 'La URL de la imagen es requerida'],
            trim: true,
        },
    },
    { _id: false }
);

const projectSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'El titulo del proyecto es requerido'],
            trim: true,
        },
        domain: {
            type: String,
            required: [true, 'El dominio es requerido'],
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'La descripcion es requerida'],
            trim: true,
        },
        stack: {
            type: [String],
            required: [true, 'El stack es requerido'],
            validate: {
                validator: (value) => Array.isArray(value) && value.length > 0,
                message: 'Debe incluir al menos una tecnologia',
            },
        },
        status: {
            type: String,
            enum: ['completed', 'in_progress', 'planned'],
            default: 'completed',
        },
        screenshots: {
            type: [screenshotSchema],
            default: [],
        },
        isPublished: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

projectSchema.index({ status: 1, isPublished: 1, createdAt: -1 });

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
