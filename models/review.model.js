const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'El nombre es requerido'],
            trim: true,
        },
        company: {
            type: String,
            trim: true,
            default: '',
        },
        linkedin: {
            type: String,
            trim: true,
            default: '',
        },
        photoUrl: {
            type: String,
            required: [true, 'La foto es obligatoria'],
            trim: true,
        },
        rating: {
            type: Number,
            required: [true, 'La calificacion es requerida'],
            min: [1, 'La calificacion minima es 1 estrella'],
            max: [5, 'La calificacion maxima es 5 estrellas'],
        },
        review: {
            type: String,
            required: [true, 'La reseña es requerida'],
            trim: true,
        },
        source: {
            type: String,
            enum: ['linkedin', 'manual'],
            default: 'linkedin',
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        isPublished: {
            type: Boolean,
            default: false,
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        reviewedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

reviewSchema.index({ status: 1, isPublished: 1, createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
