const { body, param } = require('express-validator');

const quotationIdValidation = [param('id').isMongoId().withMessage('ID de cotización inválido')];

const createQuotationValidation = [
  body('empresa').trim().notEmpty().withMessage('La empresa es obligatoria'),
  body('proyecto').trim().notEmpty().withMessage('El nombre del tipo de proyecto es obligatorio'),
  body('cotizacion_no').trim().notEmpty().withMessage('El número de cotización es obligatorio'),
  body('fecha').notEmpty().withMessage('La fecha es obligatoria'),
  body('asesor').trim().notEmpty().withMessage('El asesor es obligatorio'),
  body('nombre_cliente').trim().notEmpty().withMessage('El nombre del cliente es obligatorio'),
  body('diagnostico').trim().notEmpty().withMessage('El diagnóstico es obligatorio'),

  // Validaciones de arrays
  body('necesidades').isArray().withMessage('Necesidades debe ser un array'),
  body('incluye').isArray().withMessage('Lo que incluye debe ser un array'),
  body('no_incluye').isArray().withMessage('Lo que no incluye debe ser un array'),

  // Inversión
  body('inversion.monto').notEmpty().withMessage('El monto de inversión es obligatorio'),
  body('inversion.pagos').isArray().withMessage('Pagos debe ser un array'),

  // Validar que los porcentajes sumen 100
  body('inversion.pagos').custom((pagos) => {
    if (!Array.isArray(pagos)) return true;
    const total = pagos.reduce((acc, curr) => acc + (Number(curr.porcentaje) || 0), 0);
    if (total !== 100) {
      throw new Error('La suma de los porcentajes de pago debe ser exactamente 100%');
    }
    return true;
  }),
];

const updateQuotationValidation = [
  ...quotationIdValidation,
];

module.exports = {
  quotationIdValidation,
  createQuotationValidation,
  updateQuotationValidation,
};
