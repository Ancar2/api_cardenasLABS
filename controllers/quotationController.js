const asyncHandler = require('express-async-handler');
const puppeteer = require('puppeteer');
const Quotation = require('../models/quotation.model');
const sendResponse = require('../utils/sendResponse');

// @desc    Crear una nueva cotización
// @route   POST /api/quotations
// @access  Private/Admin
const createQuotation = asyncHandler(async (req, res) => {
  // El usuario autenticado es el creador
  req.body.user = req.user._id;

  const quotation = await Quotation.create(req.body);

  sendResponse(res, 201, quotation, 'Cotización creada exitosamente');
});

// @desc    Obtener todas las cotizaciones (Dashboard Admin)
// @route   GET /api/quotations
// @access  Private/Admin
const getQuotations = asyncHandler(async (req, res) => {
  const quotations = await Quotation.find().sort({ createdAt: -1 });
  sendResponse(res, 200, quotations, 'Listado de cotizaciones');
});

// @desc    Obtener una cotización por ID (Admin)
// @route   GET /api/quotations/:id
// @access  Private/Admin
const getQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id);

  if (!quotation) {
    res.status(404);
    throw new Error('Cotización no encontrada');
  }

  sendResponse(res, 200, quotation, 'Detalle de cotización');
});

// @desc    Obtener cotización pública por Slug
// @route   GET /api/quotations/public/:slug
// @access  Public
const getPublicQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findOne({ slug: req.params.slug })
    .select('-user -createdAt -updatedAt -__v -_id'); // Ocultamos datos internos

  if (!quotation) {
    res.status(404);
    throw new Error('La cotización no existe o el enlace ha expirado');
  }

  sendResponse(res, 200, quotation, 'Cotización pública');
});

// @desc    Actualizar cotización
// @route   PUT /api/quotations/:id
// @access  Private/Admin
const updateQuotation = asyncHandler(async (req, res) => {
  let quotation = await Quotation.findById(req.params.id);

  if (!quotation) {
    res.status(404);
    throw new Error('Cotización no encontrada');
  }

  quotation = await Quotation.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  sendResponse(res, 200, quotation, 'Cotización actualizada');
});

// @desc    Eliminar cotización
// @route   DELETE /api/quotations/:id
// @access  Private/Admin
const deleteQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id);

  if (!quotation) {
    res.status(404);
    throw new Error('Cotización no encontrada');
  }

  await quotation.deleteOne();
  sendResponse(res, 200, {}, 'Cotización eliminada');
});

// @desc    Descargar cotización en PDF
// @route   GET /api/quotations/download/:slug
// @access  Public
const downloadPdf = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findOne({ slug: req.params.slug });

  if (!quotation) {
    res.status(404);
    throw new Error('La cotización no existe');
  }

  // URL del frontend donde está la cotización (Asegurarse que sea accesible por el backend)
  const frontendUrl = process.env.CLIENT_URL || 'https://cardenaslabs.com';
  const url = `${frontendUrl}/cotizacion/${req.params.slug}`;

  try {
    // Iniciar Puppeteer
    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Emular pantalla de impresión
    await page.emulateMediaType('print');
    
    // Ir a la URL y esperar a que ya no haya conexiones de red (networkidle2 permite hasta 2 conexiones activas, ideal para ignorar los WebSockets de Angular Dev Server)
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Esperar un segundo extra para asegurar renderizado completo de CSS e imágenes
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generar PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });

    await browser.close();

    // Enviar el archivo como descarga
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Cotizacion-${quotation.cotizacion_no}.pdf"`,
      'Content-Length': pdfBuffer.length
    });

    res.end(pdfBuffer);
  } catch (error) {
    console.error('Error generando PDF con Puppeteer:', error);
    res.status(500);
    throw new Error('Error interno al generar el archivo PDF: ' + error.message);
  }
});

// @desc    Obtener el siguiente número de cotización correlativo
// @route   GET /api/quotations/next-number
// @access  Private/Admin
const getNextQuotationNumber = asyncHandler(async (req, res) => {
  const count = await Quotation.countDocuments();
  const year = new Date().getFullYear();
  // El usuario quiere empezar desde la 22. 
  // Si hay 0 en la DB, el número será 22. Si hay 1, será 23, etc.
  const startingNumber = 22;
  const nextNumber = (startingNumber + count).toString().padStart(3, '0');
  const code = `COT-${year}-${nextNumber}`;

  sendResponse(res, 200, { code }, 'Siguiente número de cotización generado');
});

module.exports = {
  createQuotation,
  getQuotations,
  getQuotation,
  getPublicQuotation,
  updateQuotation,
  deleteQuotation,
  downloadPdf,
  getNextQuotationNumber,
};
