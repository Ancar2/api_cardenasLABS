const asyncHandler = require('express-async-handler');
const Project = require('../models/project.model');
const sendResponse = require('../utils/sendResponse');
const { uploadImageToS3 } = require('../services/s3UploadService');

const normalizeStack = (stack) => {
    if (Array.isArray(stack)) {
        return stack.map((item) => String(item).trim()).filter(Boolean);
    }

    if (typeof stack === 'string') {
        return stack
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    }

    return [];
};

const normalizeScreenshots = (screenshots) => {
    if (!Array.isArray(screenshots)) {
        return [];
    }

    return screenshots
        .map((item) => ({
            title: item?.title ? String(item.title).trim() : '',
            imageUrl: item?.imageUrl ? String(item.imageUrl).trim() : '',
        }))
        .filter((item) => item.title && item.imageUrl);
};

const listPublicProjects = asyncHandler(async (req, res) => {
    const filter = { isPublished: true };

    if (req.query.status) {
        filter.status = req.query.status;
    }

    const projects = await Project.find(filter).sort({ createdAt: -1 });
    sendResponse(res, 200, projects, 'Proyectos públicos');
});

const getPublicProject = asyncHandler(async (req, res) => {
    const project = await Project.findOne({ _id: req.params.id, isPublished: true });

    if (!project) {
        res.status(404);
        throw new Error('Proyecto no encontrado');
    }

    sendResponse(res, 200, project, 'Proyecto público');
});

const listAdminProjects = asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.status) {
        filter.status = req.query.status;
    }
    if (req.query.isPublished === 'true' || req.query.isPublished === 'false') {
        filter.isPublished = req.query.isPublished === 'true';
    }

    const projects = await Project.find(filter).sort({ createdAt: -1 });
    sendResponse(res, 200, projects, 'Proyectos (admin)');
});

const createProject = asyncHandler(async (req, res) => {
    const {
        title,
        domain,
        description,
        stack,
        status,
        screenshots,
        isPublished,
    } = req.body;

    const project = await Project.create({
        title,
        domain,
        description,
        stack: normalizeStack(stack),
        status,
        screenshots: normalizeScreenshots(screenshots),
        isPublished,
    });

    sendResponse(res, 201, project, 'Proyecto creado');
});

const updateProject = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (!project) {
        res.status(404);
        throw new Error('Proyecto no encontrado');
    }

    const fields = ['title', 'domain', 'description', 'status', 'isPublished'];
    fields.forEach((field) => {
        if (req.body[field] !== undefined) {
            project[field] = req.body[field];
        }
    });

    if (req.body.stack !== undefined) {
        project.stack = normalizeStack(req.body.stack);
    }

    if (req.body.screenshots !== undefined) {
        project.screenshots = normalizeScreenshots(req.body.screenshots);
    }

    const updatedProject = await project.save();
    sendResponse(res, 200, updatedProject, 'Proyecto actualizado');
});

const deleteProject = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (!project) {
        res.status(404);
        throw new Error('Proyecto no encontrado');
    }

    await project.deleteOne();
    sendResponse(res, 200, {}, 'Proyecto eliminado');
});

const uploadProjectImage = asyncHandler(async (req, res) => {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
        res.status(400);
        throw new Error('Debe enviar imageBase64');
    }

    const result = await uploadImageToS3({
        base64DataUrl: imageBase64,
        folder: 'projects',
    });

    sendResponse(res, 201, result, 'Imagen de proyecto subida');
});

module.exports = {
    listPublicProjects,
    getPublicProject,
    listAdminProjects,
    createProject,
    updateProject,
    deleteProject,
    uploadProjectImage,
};
