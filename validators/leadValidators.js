const { body, param, query } = require('express-validator');

const leadIdValidation = [param('id').isMongoId().withMessage('ID de solicitud inválido')];

const submitLeadValidation = [
    body('name').trim().notEmpty().withMessage('El nombre es requerido'),
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('company')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 120 })
        .withMessage('La empresa no puede exceder 120 caracteres'),
    body('nit')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 40 })
        .withMessage('El NIT no puede exceder 40 caracteres'),
    body('phone')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 40 })
        .withMessage('El teléfono no puede exceder 40 caracteres'),
    body('projectType').trim().notEmpty().withMessage('El tipo de proyecto es requerido'),
    body('budget')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 120 })
        .withMessage('El presupuesto no puede exceder 120 caracteres'),
    body('resumen')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 280 })
        .withMessage('El resumen no puede exceder 280 caracteres'),
    body('message')
        .trim()
        .notEmpty()
        .withMessage('La descripción del requerimiento es obligatoria')
        .isLength({ min: 15, max: 3000 })
        .withMessage('El requerimiento debe tener entre 15 y 3000 caracteres'),
    body('source')
        .optional({ checkFalsy: true })
        .trim()
        .isIn(['website', 'ia'])
        .withMessage('source inválido'),
];

const listLeadsValidation = [
    query('status')
        .optional()
        .isIn(['new', 'contacted', 'approved', 'rejected'])
        .withMessage('status inválido'),
];

const updateLeadValidation = [
    ...leadIdValidation,
    body('name').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('email').optional().isEmail().withMessage('Email inválido').normalizeEmail(),
    body('company')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 120 })
        .withMessage('La empresa no puede exceder 120 caracteres'),
    body('nit')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 40 })
        .withMessage('El NIT no puede exceder 40 caracteres'),
    body('phone')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 40 })
        .withMessage('El teléfono no puede exceder 40 caracteres'),
    body('projectType')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('El tipo de proyecto no puede estar vacío'),
    body('budget')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 120 })
        .withMessage('El presupuesto no puede exceder 120 caracteres'),
    body('resumen')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 280 })
        .withMessage('El resumen no puede exceder 280 caracteres'),
    body('message')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('La descripción no puede estar vacía')
        .isLength({ max: 3000 })
        .withMessage('La descripción no puede exceder 3000 caracteres'),
    body('status')
        .optional()
        .isIn(['new', 'contacted', 'approved', 'rejected'])
        .withMessage('status inválido'),
    body('rejectionReason')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 500 })
        .withMessage('El motivo no puede exceder 500 caracteres'),
    body('rejectionReason')
        .if(body('status').equals('rejected'))
        .trim()
        .notEmpty()
        .withMessage('El motivo es obligatorio cuando la solicitud es rechazada'),
];

module.exports = {
    leadIdValidation,
    submitLeadValidation,
    listLeadsValidation,
    updateLeadValidation,
};
