const { body, param } = require('express-validator');

const loginValidation = [
    body('email').isEmail().withMessage('Por favor incluye un email válido').normalizeEmail(),
    body('password').notEmpty().withMessage('La contraseña es requerida'),
];

const registerValidation = [
    body('name').trim().notEmpty().withMessage('El nombre es requerido'),
    body('email').isEmail().withMessage('Por favor incluye un email válido').normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener 6 o más caracteres'),
];

const forgotPasswordValidation = [
    body('email').isEmail().withMessage('Por favor incluye un email válido').normalizeEmail(),
];

const resetPasswordValidation = [
    param('resettoken')
        .isLength({ min: 20 })
        .withMessage('Token de recuperación inválido'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('La nueva contraseña debe tener 6 o más caracteres'),
];

const verifyEmailValidation = [
    param('verificationtoken')
        .isLength({ min: 40, max: 200 })
        .withMessage('Token de verificación inválido'),
];

const resendVerificationValidation = [
    body('email').isEmail().withMessage('Por favor incluye un email válido').normalizeEmail(),
];

module.exports = {
    loginValidation,
    registerValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
    verifyEmailValidation,
    resendVerificationValidation,
};
