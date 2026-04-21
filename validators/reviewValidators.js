const { body, param, query } = require('express-validator');

const reviewIdValidation = [param('id').isMongoId().withMessage('ID de reseña inválido')];

const submitReviewValidation = [
    body('name').trim().notEmpty().withMessage('El nombre es requerido'),
    body('company')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 120 })
        .withMessage('La empresa no puede exceder 120 caracteres'),
    body('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('La calificacion debe ser entre 1 y 5'),
    body('review')
        .trim()
        .notEmpty()
        .withMessage('La reseña es requerida')
        .isLength({ min: 10, max: 2000 })
        .withMessage('La reseña debe tener entre 10 y 2000 caracteres'),
    body('photoBase64')
        .notEmpty()
        .withMessage('La foto es obligatoria')
        .isString()
        .withMessage('photoBase64 debe ser string'),
];

const listAdminReviewsValidation = [
    query('status')
        .optional()
        .isIn(['pending', 'approved', 'rejected'])
        .withMessage('status inválido'),
];

const moderateReviewValidation = [
    ...reviewIdValidation,
    body('status')
        .optional()
        .isIn(['pending', 'approved', 'rejected'])
        .withMessage('Estado inválido'),
    body('isPublished')
        .optional()
        .isBoolean()
        .withMessage('isPublished debe ser booleano'),
];

module.exports = {
    reviewIdValidation,
    submitReviewValidation,
    listAdminReviewsValidation,
    moderateReviewValidation,
};
