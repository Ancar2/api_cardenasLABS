const { body, param, query } = require('express-validator');

const mongoIdValidation = [param('id').isMongoId().withMessage('ID de usuario inválido')];

const updateProfileValidation = [
    body('name').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('email').optional().isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password')
        .optional()
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener 6 o más caracteres'),
];

const updatePasswordValidation = [
    body('currentPassword').notEmpty().withMessage('La contraseña actual es requerida'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('La nueva contraseña debe tener 6 o más caracteres'),
];

const updateUserAdminValidation = [
    ...mongoIdValidation,
    body('name').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('email').optional().isEmail().withMessage('Email inválido').normalizeEmail(),
    body('role').optional().isIn(['user', 'admin']).withMessage('Rol inválido'),
    body('isActive').optional().isBoolean().withMessage('isActive debe ser booleano'),
];

const deleteUserValidation = [
    ...mongoIdValidation,
    query('permanent').optional().isIn(['true', 'false']).withMessage('permanent debe ser true o false'),
];

module.exports = {
    mongoIdValidation,
    updateProfileValidation,
    updatePasswordValidation,
    updateUserAdminValidation,
    deleteUserValidation,
};
