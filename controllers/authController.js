const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const User = require('../models/user.model');
const generateToken = require('../utils/generateToken');
const sendResponse = require('../utils/sendResponse');
const sendEmail = require('../services/emailService');

const getCookieOptions = () => ({
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: process.env.COOKIE_SAMESITE || 'lax',
    secure: process.env.NODE_ENV === 'production',
});

const sendTokenResponse = (user, statusCode, res, message) => {
    const token = generateToken(user._id);

    res.cookie('token', token, getCookieOptions());

    sendResponse(
        res,
        statusCode,
        {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
        },
        message
    );
};

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
        res.status(401);
        throw new Error('Email o contraseña inválidos');
    }

    if (user.isActive === false) {
        res.status(401);
        throw new Error('La cuenta de usuario está desactivada. Contacte al administrador.');
    }

    sendTokenResponse(user, 200, res, 'Inicio de sesión exitoso');
});

const getMe = asyncHandler(async (req, res) => {
    sendResponse(
        res,
        200,
        {
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            isActive: req.user.isActive,
        },
        'Usuario autenticado'
    );
});

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('El usuario ya existe');
    }

    const user = await User.create({ name, email, password });
    sendTokenResponse(user, 201, res, 'Usuario registrado exitosamente');
});

const logoutUser = asyncHandler(async (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        sameSite: process.env.COOKIE_SAMESITE || 'lax',
        secure: process.env.NODE_ENV === 'production',
    });

    sendResponse(res, 200, {}, 'Sesión cerrada');
});

const forgotPassword = asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        sendResponse(res, 200, {}, 'Si el email existe, se enviaron instrucciones de recuperación');
        return;
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const frontendUrl = process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`;
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const message = `Recibiste este correo porque se solicitó recuperar la contraseña. Usa este enlace: ${resetUrl}`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Recuperación de contraseña',
            message,
        });

        sendResponse(res, 200, {}, 'Si el email existe, se enviaron instrucciones de recuperación');
    } catch (err) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });

        res.status(500);
        throw new Error('El email no pudo ser enviado');
    }
});

const resetPassword = asyncHandler(async (req, res) => {
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resettoken)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
        res.status(400);
        throw new Error('Token inválido o expirado');
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    sendTokenResponse(user, 200, res, 'Contraseña actualizada exitosamente');
});

module.exports = {
    loginUser,
    getMe,
    registerUser,
    logoutUser,
    forgotPassword,
    resetPassword,
};
