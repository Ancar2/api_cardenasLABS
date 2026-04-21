const { body, param, query } = require('express-validator');

const projectIdValidation = [param('id').isMongoId().withMessage('ID de proyecto inválido')];

const statusValidation = body('status')
    .optional()
    .isIn(['completed', 'in_progress', 'planned'])
    .withMessage('Estado de proyecto inválido');

const baseProjectValidation = [
    body('title').trim().notEmpty().withMessage('El titulo es requerido'),
    body('domain').trim().notEmpty().withMessage('El dominio es requerido'),
    body('description').trim().notEmpty().withMessage('La descripcion es requerida'),
    body('stack')
        .custom((value) => {
            if (Array.isArray(value) && value.length > 0) return true;
            if (typeof value === 'string' && value.trim().length > 0) return true;
            throw new Error('El stack es requerido');
        }),
    statusValidation,
    body('isPublished')
        .optional()
        .isBoolean()
        .withMessage('isPublished debe ser booleano'),
    body('screenshots')
        .optional()
        .isArray()
        .withMessage('screenshots debe ser un arreglo'),
    body('screenshots.*.title')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Cada imagen debe tener titulo'),
    body('screenshots.*.imageUrl')
        .optional()
        .isURL({ require_protocol: true })
        .withMessage('Cada imagen debe tener una URL válida'),
];

const createProjectValidation = baseProjectValidation;

const updateProjectValidation = [
    ...projectIdValidation,
    body('title').optional().trim().notEmpty().withMessage('El titulo no puede estar vacío'),
    body('domain').optional().trim().notEmpty().withMessage('El dominio no puede estar vacío'),
    body('description')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('La descripcion no puede estar vacía'),
    body('stack')
        .optional()
        .custom((value) => {
            if (Array.isArray(value) && value.length > 0) return true;
            if (typeof value === 'string' && value.trim().length > 0) return true;
            throw new Error('stack debe tener al menos una tecnologia');
        }),
    statusValidation,
    body('isPublished')
        .optional()
        .isBoolean()
        .withMessage('isPublished debe ser booleano'),
    body('screenshots')
        .optional()
        .isArray()
        .withMessage('screenshots debe ser un arreglo'),
    body('screenshots.*.title')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Cada imagen debe tener titulo'),
    body('screenshots.*.imageUrl')
        .optional()
        .isURL({ require_protocol: true })
        .withMessage('Cada imagen debe tener una URL válida'),
];

const listProjectsPublicValidation = [
    query('status')
        .optional()
        .isIn(['completed', 'in_progress', 'planned'])
        .withMessage('status inválido'),
];

const listProjectsAdminValidation = [
    query('status')
        .optional()
        .isIn(['completed', 'in_progress', 'planned'])
        .withMessage('status inválido'),
    query('isPublished')
        .optional()
        .isIn(['true', 'false'])
        .withMessage('isPublished debe ser true o false'),
];

const uploadProjectImageValidation = [
    body('imageBase64')
        .notEmpty()
        .withMessage('imageBase64 es requerido')
        .isString()
        .withMessage('imageBase64 debe ser string'),
];

module.exports = {
    projectIdValidation,
    createProjectValidation,
    updateProjectValidation,
    listProjectsPublicValidation,
    listProjectsAdminValidation,
    uploadProjectImageValidation,
};
