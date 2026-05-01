const { body, param, query } = require('express-validator');

const challengeIdValidation = [param('id').isMongoId().withMessage('ID de reto inválido')];

const validateOptionsAndCorrectKey = (value, { req }) => {
    const options = req.body.options;
    const correctOptionKey = req.body.correctOptionKey;

    if (options === undefined && correctOptionKey === undefined) {
        return true;
    }

    if (options !== undefined) {
        if (!Array.isArray(options)) {
            throw new Error('options debe ser un arreglo');
        }

        const normalizedKeys = options
            .map((option) => String(option?.key || '').trim().toUpperCase())
            .filter(Boolean);

        if (new Set(normalizedKeys).size !== normalizedKeys.length) {
            throw new Error('Las claves de options deben ser únicas');
        }

        if (normalizedKeys.length > 6) {
            throw new Error('Solo se permiten hasta 6 opciones');
        }

        if (correctOptionKey !== undefined) {
            const normalizedCorrectKey = String(correctOptionKey).trim().toUpperCase();
            if (normalizedCorrectKey && !normalizedKeys.includes(normalizedCorrectKey)) {
                throw new Error('correctOptionKey debe existir dentro de options');
            }
        }
    }

    return true;
};

const audienceQueryValidation = [
    query('audience')
        .optional()
        .isIn(['client', 'developer'])
        .withMessage('audience debe ser client o developer'),
];

const listAdminChallengesValidation = [
    ...audienceQueryValidation,
    query('isActive')
        .optional()
        .isIn(['true', 'false'])
        .withMessage('isActive debe ser true o false'),
];

const createChallengeValidation = [
    body('audience')
        .isIn(['client', 'developer'])
        .withMessage('audience debe ser client o developer'),
    body('title')
        .trim()
        .notEmpty()
        .withMessage('El titulo es requerido')
        .isLength({ max: 120 })
        .withMessage('El titulo no puede exceder 120 caracteres'),
    body('prompt')
        .trim()
        .notEmpty()
        .withMessage('El enunciado es requerido')
        .isLength({ min: 10, max: 3000 })
        .withMessage('El enunciado debe tener entre 10 y 3000 caracteres'),
    body('category')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('La categoria no puede exceder 100 caracteres'),
    body('question')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('La pregunta no puede exceder 500 caracteres'),
    body('imageUrl')
        .optional({ checkFalsy: true })
        .isURL({ require_protocol: true })
        .withMessage('imageUrl debe ser una URL válida'),
    body('options').optional().isArray().withMessage('options debe ser un arreglo'),
    body('options.*.key')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Cada opcion debe incluir key')
        .isLength({ max: 10 })
        .withMessage('La key de opcion no puede exceder 10 caracteres'),
    body('options.*.title')
        .optional()
        .trim()
        .isLength({ max: 120 })
        .withMessage('El titulo de opcion no puede exceder 120 caracteres'),
    body('options.*.description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('La descripcion de opcion no puede exceder 500 caracteres'),
    body('options.*.imageUrl')
        .optional({ checkFalsy: true })
        .isURL({ require_protocol: true })
        .withMessage('La imagen de opcion debe ser URL válida'),
    body('correctOptionKey')
        .optional()
        .trim()
        .isLength({ max: 10 })
        .withMessage('correctOptionKey no puede exceder 10 caracteres'),
    body('explanation')
        .optional()
        .trim()
        .isLength({ max: 1200 })
        .withMessage('La explicacion no puede exceder 1200 caracteres'),
    body('options').custom(validateOptionsAndCorrectKey),
    body('isActive').optional().isBoolean().withMessage('isActive debe ser booleano'),
];

const updateChallengeValidation = [
    ...challengeIdValidation,
    body('audience')
        .optional()
        .isIn(['client', 'developer'])
        .withMessage('audience debe ser client o developer'),
    body('title')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('El titulo no puede estar vacío')
        .isLength({ max: 120 })
        .withMessage('El titulo no puede exceder 120 caracteres'),
    body('prompt')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('El enunciado no puede estar vacío')
        .isLength({ min: 10, max: 3000 })
        .withMessage('El enunciado debe tener entre 10 y 3000 caracteres'),
    body('category')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('La categoria no puede exceder 100 caracteres'),
    body('question')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('La pregunta no puede exceder 500 caracteres'),
    body('imageUrl')
        .optional({ checkFalsy: true })
        .isURL({ require_protocol: true })
        .withMessage('imageUrl debe ser una URL válida'),
    body('options').optional().isArray().withMessage('options debe ser un arreglo'),
    body('options.*.key')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Cada opcion debe incluir key')
        .isLength({ max: 10 })
        .withMessage('La key de opcion no puede exceder 10 caracteres'),
    body('options.*.title')
        .optional()
        .trim()
        .isLength({ max: 120 })
        .withMessage('El titulo de opcion no puede exceder 120 caracteres'),
    body('options.*.description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('La descripcion de opcion no puede exceder 500 caracteres'),
    body('options.*.imageUrl')
        .optional({ checkFalsy: true })
        .isURL({ require_protocol: true })
        .withMessage('La imagen de opcion debe ser URL válida'),
    body('correctOptionKey')
        .optional()
        .trim()
        .isLength({ max: 10 })
        .withMessage('correctOptionKey no puede exceder 10 caracteres'),
    body('explanation')
        .optional()
        .trim()
        .isLength({ max: 1200 })
        .withMessage('La explicacion no puede exceder 1200 caracteres'),
    body('options').custom(validateOptionsAndCorrectKey),
    body('isActive').optional().isBoolean().withMessage('isActive debe ser booleano'),
];

const submitChallengeResponseValidation = [
    ...challengeIdValidation,
    body('username')
        .trim()
        .notEmpty()
        .withMessage('El username es requerido')
        .isLength({ min: 3, max: 60 })
        .withMessage('El username debe tener entre 3 y 60 caracteres')
        .matches(/^[a-zA-Z0-9._-]+$/)
        .withMessage('El username solo permite letras, números, punto, guion y guion bajo'),
    body('answer')
        .trim()
        .notEmpty()
        .withMessage('La respuesta es requerida')
        .isLength({ min: 3, max: 3000 })
        .withMessage('La respuesta debe tener entre 3 y 3000 caracteres'),
    body('selectedOptionKey')
        .optional()
        .trim()
        .isLength({ max: 10 })
        .withMessage('selectedOptionKey no puede exceder 10 caracteres'),
];

const uploadChallengeImageValidation = [
    body('imageBase64')
        .notEmpty()
        .withMessage('imageBase64 es requerido')
        .isString()
        .withMessage('imageBase64 debe ser string'),
];

module.exports = {
    challengeIdValidation,
    audienceQueryValidation,
    listAdminChallengesValidation,
    createChallengeValidation,
    updateChallengeValidation,
    submitChallengeResponseValidation,
    uploadChallengeImageValidation,
};
