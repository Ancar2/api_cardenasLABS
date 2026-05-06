const express = require('express');
const validate = require('../middleware/validateMiddleware');
const aiController = require('../controllers/aiController');
const { chatWithAiValidation } = require('../validators/aiValidators');

const router = express.Router();

router.post('/chat', chatWithAiValidation, validate, aiController.chatWithAi);

module.exports = router;
