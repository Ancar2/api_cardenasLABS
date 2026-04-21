const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const leadController = require('../controllers/leadController');
const {
    leadIdValidation,
    submitLeadValidation,
    listLeadsValidation,
    updateLeadValidation,
} = require('../validators/leadValidators');

const router = express.Router();

router.post('/', submitLeadValidation, validate, leadController.submitLead);

router.get('/admin/list', protect, admin, listLeadsValidation, validate, leadController.listLeads);
router.get('/admin/:id', protect, admin, leadIdValidation, validate, leadController.getLead);
router.put('/admin/:id', protect, admin, updateLeadValidation, validate, leadController.updateLead);
router.delete('/admin/:id', protect, admin, leadIdValidation, validate, leadController.deleteLead);

module.exports = router;
