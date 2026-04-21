const express = require('express');

const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const {
    loginValidation,
    registerValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
} = require('../validators/authValidators');

const router = express.Router();

router.post('/register', registerValidation, validate, authController.registerUser);
router.post('/login', loginValidation, validate, authController.loginUser);
router.post('/logout', authController.logoutUser);
router.post('/forgotpassword', forgotPasswordValidation, validate, authController.forgotPassword);
router.put('/resetpassword/:resettoken', resetPasswordValidation, validate, authController.resetPassword);
router.get('/me', protect, authController.getMe);

module.exports = router;
