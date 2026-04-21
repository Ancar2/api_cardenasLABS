const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'El nombre es requerido'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'El email es requerido'],
            trim: true,
            lowercase: true,
        },
        company: {
            type: String,
            trim: true,
            default: '',
        },
        phone: {
            type: String,
            trim: true,
            default: '',
        },
        projectType: {
            type: String,
            required: [true, 'El tipo de proyecto es requerido'],
            trim: true,
        },
        budget: {
            type: String,
            trim: true,
            default: '',
        },
        message: {
            type: String,
            required: [true, 'La descripcion del requerimiento es requerida'],
            trim: true,
        },
        status: {
            type: String,
            enum: ['new', 'contacted', 'qualified', 'closed'],
            default: 'new',
        },
        source: {
            type: String,
            trim: true,
            default: 'website',
        },
    },
    { timestamps: true }
);

leadSchema.index({ status: 1, createdAt: -1 });

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;
