const express = require('express');

const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const {
    loginValidation,
    registerValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
    verifyEmailValidation,
    resendVerificationValidation,
} = require('../validators/authValidators');

const router = express.Router();

router.post('/register', registerValidation, validate, authController.registerUser);
router.post('/login', loginValidation, validate, authController.loginUser);
router.post('/logout', authController.logoutUser);
router.post('/forgotpassword', forgotPasswordValidation, validate, authController.forgotPassword);
router.put('/resetpassword/:resettoken', resetPasswordValidation, validate, authController.resetPassword);
router.get('/verify-email/:verificationtoken', verifyEmailValidation, validate, authController.verifyEmail);
router.post(
    '/resend-verification-email',
    resendVerificationValidation,
    validate,
    authController.resendVerificationEmail
);
router.get('/linkedin/login', authController.linkedinAuthLogin);
router.get('/linkedin/callback', authController.linkedinAuthCallback);
router.get('/me', protect, authController.getMe);

module.exports = router;
