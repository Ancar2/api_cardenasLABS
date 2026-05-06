const { body } = require('express-validator');

const chatWithAiValidation = [
    body('message')
        .trim()
        .notEmpty()
        .withMessage('El mensaje es requerido')
        .isLength({ min: 2, max: 1200 })
        .withMessage('El mensaje debe tener entre 2 y 1200 caracteres'),
];

module.exports = {
    chatWithAiValidation,
};
