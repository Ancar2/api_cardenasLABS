const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const quotationController = require('../controllers/quotationController');
const {
  quotationIdValidation,
  createQuotationValidation,
  updateQuotationValidation,
} = require('../validators/quotationValidators');

const router = express.Router();

// Ruta pública para ver cotización por Slug
router.get('/public/:slug', quotationController.getPublicQuotation);

// Ruta pública para descargar la cotización en PDF
router.get('/download/:slug', quotationController.downloadPdf);

// Rutas administrativas (Protegidas)
router.get(
  '/next-number',
  protect,
  admin,
  quotationController.getNextQuotationNumber
);

router.post(
  '/',
  protect,
  admin,
  createQuotationValidation,
  validate,
  quotationController.createQuotation
);

router.get(
  '/',
  protect,
  admin,
  quotationController.getQuotations
);

router.get(
  '/:id',
  protect,
  admin,
  quotationIdValidation,
  validate,
  quotationController.getQuotation
);

router.put(
  '/:id',
  protect,
  admin,
  updateQuotationValidation,
  validate,
  quotationController.updateQuotation
);

router.delete(
  '/:id',
  protect,
  admin,
  quotationIdValidation,
  validate,
  quotationController.deleteQuotation
);

module.exports = router;
