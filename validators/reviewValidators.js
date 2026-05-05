const { body, param, query } = require('express-validator');

const reviewIdValidation = [param('id').isMongoId().withMessage('ID de reseña inválido')];

const submitReviewValidation = [
    body('name').trim().notEmpty().withMessage('El nombre es requerido'),
    body('company')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 120 })
        .withMessage('La empresa no puede exceder 120 caracteres'),
    body('role')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 120 })
        .withMessage('El cargo no puede exceder 120 caracteres'),
    body('withoutLinkedin')
        .optional()
        .isBoolean()
        .withMessage('withoutLinkedin debe ser booleano'),
    body('linkedin')
        .optional({ checkFalsy: true })
        .trim()
        .isURL({ require_protocol: true })
        .withMessage('El perfil de LinkedIn debe ser una URL válida')
        .matches(/^https?:\/\/(www\.)?linkedin\.com\//i)
        .withMessage('El perfil debe pertenecer a linkedin.com'),
    body('linkedinPhotoUrl')
        .optional({ checkFalsy: true })
        .trim()
        .isURL({ require_protocol: true })
        .withMessage('La foto de LinkedIn debe ser una URL válida')
        .matches(/linkedin|licdn/i)
        .withMessage('La URL de foto debe provenir de LinkedIn'),
    body('photoBase64')
        .optional({ checkFalsy: true })
        .isString()
        .withMessage('photoBase64 debe ser string'),
    body('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('La calificacion debe ser entre 1 y 5'),
    body('review')
        .trim()
        .notEmpty()
        .withMessage('La reseña es requerida')
        .isLength({ min: 10, max: 2000 })
        .withMessage('La reseña debe tener entre 10 y 2000 caracteres'),
    body().custom((value) => {
        const withoutLinkedin = Boolean(value?.withoutLinkedin);
        const linkedin = String(value?.linkedin || '').trim();
        const linkedinPhotoUrl = String(value?.linkedinPhotoUrl || '').trim();
        const photoBase64 = String(value?.photoBase64 || '').trim();
        const company = String(value?.company || '').trim();
        const role = String(value?.role || '').trim();

        if (company && !role) {
            throw new Error('Si indicas empresa, el cargo es obligatorio');
        }

        if (withoutLinkedin) {
            if (!photoBase64) {
                throw new Error('Si no usa LinkedIn, la foto es obligatoria (photoBase64)');
            }
            return true;
        }

        if (!linkedin) {
            throw new Error('El perfil de LinkedIn es obligatorio');
        }

        if (!linkedinPhotoUrl) {
            throw new Error('La foto desde LinkedIn es obligatoria');
        }

        return true;
    }),
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
