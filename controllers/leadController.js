const asyncHandler = require('express-async-handler');
const Lead = require('../models/lead.model');
const sendResponse = require('../utils/sendResponse');
const sendEmail = require('../services/emailService');

const leadSourceLabel = (source) => (source === 'ia' ? 'ia' : 'website');

const buildLeadSummary = (lead) =>
    [
        `ID: ${lead._id}`,
        `Origen: ${lead.source}`,
        `Nombre: ${lead.name}`,
        `Email: ${lead.email}`,
        `Empresa: ${lead.company || 'No especificada'}`,
        `NIT: ${lead.nit || 'No especificado'}`,
        `Teléfono: ${lead.phone || 'No especificado'}`,
        `Tipo de proyecto: ${lead.projectType}`,
        `Presupuesto: ${lead.budget || 'No especificado'}`,
        `Resumen: ${lead.resumen || 'No especificado'}`,
        `Descripción: ${lead.message}`,
        `Fecha: ${new Date(lead.createdAt).toLocaleString('es-CO')}`,
    ].join('\n');

const submitLead = asyncHandler(async (req, res) => {
    const { name, email, company, nit, phone, projectType, budget, resumen, message, source } = req.body;
    const leadSource = leadSourceLabel(source);

    const lead = await Lead.create({
        name,
        email,
        company,
        nit,
        phone,
        projectType,
        budget,
        resumen,
        message,
        source: leadSource,
        status: 'new',
    });

    const notificationEmail = process.env.LEADS_NOTIFICATION_EMAIL || 'hola@cardenaslabs.com';
    const clientBaseUrl = String(process.env.CLIENT_URL || 'https://cardenaslabs.com').replace(/\/+$/, '');
    const summary = buildLeadSummary(lead);

    const clientMessage = [
        `Hola ${lead.name},`,
        '',
        'Recibimos tu solicitud correctamente en Cardenas Labs.',
        'Nuestro equipo revisará la información y te contactará pronto.',
        '',
        'Resumen enviado:',
        summary,
        '',
        'Gracias por confiar en nosotros.',
    ].join('\n');

    const internalMessage = [
        'Nueva solicitud recibida',
        '',
        summary,
    ].join('\n');

    await Promise.allSettled([
        sendEmail({
            email: lead.email,
            subject: 'Confirmación de solicitud - Cardenas Labs',
            message: clientMessage,
            title: 'Solicitud Recibida',
            subtitle: 'Equipo Cardenas Labs',
            intro: `Hola ${lead.name}, recibimos tu solicitud correctamente y nuestro equipo la revisará muy pronto.`,
            summaryLines: [
                `Tipo de proyecto: ${lead.projectType}`,
                `Presupuesto: ${lead.budget || 'No especificado'}`,
                `Origen: ${lead.source}`,
            ],
            ctaLabel: 'Ir a Cardenas Labs',
            ctaUrl: clientBaseUrl,
            footerNote: 'Te contactaremos al correo y/o teléfono registrados en tu solicitud.',
        }),
        sendEmail({
            email: notificationEmail,
            subject: `Nueva solicitud (${leadSource}) - ${lead.projectType}`,
            message: internalMessage,
            title: 'Nueva Solicitud Registrada',
            subtitle: 'Notificación Interna',
            intro: `Se registró una nueva solicitud con origen ${leadSource}.`,
            summaryLines: summary.split('\n'),
            ctaLabel: 'Abrir Dashboard',
            ctaUrl: `${clientBaseUrl}/dashboard/leads`,
            footerNote: 'Revisa la solicitud y asigna seguimiento comercial.',
        }),
    ]);

    sendResponse(
        res,
        201,
        { _id: lead._id, status: lead.status },
        'Solicitud recibida. Te contactaremos pronto.'
    );
});

const listLeads = asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.status) {
        filter.status = req.query.status;
    }

    const leads = await Lead.find(filter).sort({ createdAt: -1 });
    sendResponse(res, 200, leads, 'Solicitudes de desarrollo');
});

const getLead = asyncHandler(async (req, res) => {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
        res.status(404);
        throw new Error('Solicitud no encontrada');
    }

    sendResponse(res, 200, lead, 'Solicitud encontrada');
});

const updateLead = asyncHandler(async (req, res) => {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
        res.status(404);
        throw new Error('Solicitud no encontrada');
    }

    const fields = [
        'name',
        'email',
        'company',
        'nit',
        'phone',
        'projectType',
        'budget',
        'resumen',
        'message',
        'status',
        'rejectionReason',
    ];

    fields.forEach((field) => {
        if (req.body[field] !== undefined) {
            lead[field] = req.body[field];
        }
    });

    if (req.body.status && req.body.status !== 'rejected' && req.body.rejectionReason === undefined) {
        lead.rejectionReason = '';
    }

    const updatedLead = await lead.save();
    sendResponse(res, 200, updatedLead, 'Solicitud actualizada');
});

const deleteLead = asyncHandler(async (req, res) => {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
        res.status(404);
        throw new Error('Solicitud no encontrada');
    }

    await lead.deleteOne();
    sendResponse(res, 200, {}, 'Solicitud eliminada');
});

module.exports = {
    submitLead,
    listLeads,
    getLead,
    updateLead,
    deleteLead,
};
