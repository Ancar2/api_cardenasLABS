const asyncHandler = require('express-async-handler');
const Lead = require('../models/lead.model');
const sendResponse = require('../utils/sendResponse');

const submitLead = asyncHandler(async (req, res) => {
    const { name, email, company, phone, projectType, budget, message } = req.body;

    const lead = await Lead.create({
        name,
        email,
        company,
        phone,
        projectType,
        budget,
        message,
        source: 'website',
        status: 'new',
    });

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

    const fields = ['name', 'email', 'company', 'phone', 'projectType', 'budget', 'message', 'status'];
    fields.forEach((field) => {
        if (req.body[field] !== undefined) {
            lead[field] = req.body[field];
        }
    });

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
