const asyncHandler = require('express-async-handler');
const Review = require('../models/review.model');
const sendResponse = require('../utils/sendResponse');
const { uploadImageToS3 } = require('../services/s3UploadService');

const listPublicReviews = asyncHandler(async (req, res) => {
    const reviews = await Review.find({ isPublished: true, status: 'approved' })
        .sort({ createdAt: -1 })
        .select('-reviewedBy');

    sendResponse(res, 200, reviews, 'Reseñas publicadas');
});

const submitReview = asyncHandler(async (req, res) => {
    const { name, company, rating, review, photoBase64 } = req.body;

    if (!photoBase64) {
        res.status(400);
        throw new Error('La foto del cliente es obligatoria');
    }

    const uploadResult = await uploadImageToS3({
        base64DataUrl: photoBase64,
        folder: 'reviews',
    });

    const createdReview = await Review.create({
        name,
        company,
        rating,
        review,
        photoUrl: uploadResult.url,
        status: 'pending',
        isPublished: false,
    });

    sendResponse(
        res,
        201,
        {
            _id: createdReview._id,
            status: createdReview.status,
        },
        'Reseña recibida. Será revisada por el administrador.'
    );
});

const listAdminReviews = asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.status) {
        filter.status = req.query.status;
    }

    const reviews = await Review.find(filter)
        .sort({ createdAt: -1 })
        .populate('reviewedBy', 'name email');

    sendResponse(res, 200, reviews, 'Reseñas (admin)');
});

const updateReviewModeration = asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id);
    if (!review) {
        res.status(404);
        throw new Error('Reseña no encontrada');
    }

    const { status } = req.body;

    if (status !== undefined) {
        review.status = status;
    }

    // Regla de negocio: aprobada = publicada, cualquier otro estado = no publicada.
    review.isPublished = review.status === 'approved';

    review.reviewedBy = req.user._id;
    review.reviewedAt = new Date();

    const updatedReview = await review.save();
    sendResponse(res, 200, updatedReview, 'Reseña moderada');
});

const deleteReview = asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id);
    if (!review) {
        res.status(404);
        throw new Error('Reseña no encontrada');
    }

    await review.deleteOne();
    sendResponse(res, 200, {}, 'Reseña eliminada');
});

module.exports = {
    listPublicReviews,
    submitReview,
    listAdminReviews,
    updateReviewModeration,
    deleteReview,
};
