const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const reviewController = require('../controllers/reviewController');
const {
    reviewIdValidation,
    submitReviewValidation,
    publishToLinkedinValidation,
    listAdminReviewsValidation,
    moderateReviewValidation,
} = require('../validators/reviewValidators');

const router = express.Router();

router.get('/', reviewController.listPublicReviews);
router.post('/', submitReviewValidation, validate, reviewController.submitReview);
router.post('/publish-linkedin', publishToLinkedinValidation, validate, reviewController.publishReviewToLinkedin);

router.get('/admin/list', protect, admin, listAdminReviewsValidation, validate, reviewController.listAdminReviews);
router.patch('/admin/:id', protect, admin, moderateReviewValidation, validate, reviewController.updateReviewModeration);
router.delete('/admin/:id', protect, admin, reviewIdValidation, validate, reviewController.deleteReview);

module.exports = router;
