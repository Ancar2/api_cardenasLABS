const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const challengeController = require('../controllers/challengeController');
const {
    challengeIdValidation,
    audienceQueryValidation,
    listAdminChallengesValidation,
    createChallengeValidation,
    updateChallengeValidation,
    submitChallengeResponseValidation,
    uploadChallengeImageValidation,
} = require('../validators/challengeValidators');

const router = express.Router();

router.get('/', audienceQueryValidation, validate, challengeController.listPublicChallenges);
router.post(
    '/:id/responses',
    submitChallengeResponseValidation,
    validate,
    challengeController.submitChallengeResponse
);

router.get(
    '/admin/list',
    protect,
    admin,
    listAdminChallengesValidation,
    validate,
    challengeController.listAdminChallenges
);
router.post('/admin', protect, admin, createChallengeValidation, validate, challengeController.createChallenge);
router.post(
    '/admin/upload-image',
    protect,
    admin,
    uploadChallengeImageValidation,
    validate,
    challengeController.uploadChallengeImage
);
router.put('/admin/:id', protect, admin, updateChallengeValidation, validate, challengeController.updateChallenge);
router.delete('/admin/:id', protect, admin, challengeIdValidation, validate, challengeController.deleteChallenge);
router.get(
    '/admin/:id/responses',
    protect,
    admin,
    challengeIdValidation,
    validate,
    challengeController.listChallengeResponses
);

module.exports = router;
