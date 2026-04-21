const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const projectController = require('../controllers/projectController');
const {
    projectIdValidation,
    createProjectValidation,
    updateProjectValidation,
    listProjectsPublicValidation,
    listProjectsAdminValidation,
    uploadProjectImageValidation,
} = require('../validators/projectValidators');

const router = express.Router();

router.get('/admin/list', protect, admin, listProjectsAdminValidation, validate, projectController.listAdminProjects);
router.post('/admin', protect, admin, createProjectValidation, validate, projectController.createProject);
router.post(
    '/admin/upload-image',
    protect,
    admin,
    uploadProjectImageValidation,
    validate,
    projectController.uploadProjectImage
);
router.put('/admin/:id', protect, admin, updateProjectValidation, validate, projectController.updateProject);
router.delete('/admin/:id', protect, admin, projectIdValidation, validate, projectController.deleteProject);
router.get('/', listProjectsPublicValidation, validate, projectController.listPublicProjects);
router.get('/:id', projectIdValidation, validate, projectController.getPublicProject);

module.exports = router;
