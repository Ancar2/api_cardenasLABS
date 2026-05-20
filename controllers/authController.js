const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const User = require('../models/user.model');
const generateToken = require('../utils/generateToken');
const sendResponse = require('../utils/sendResponse');
const sendEmail = require('../services/emailService');
const { createPublishSession } = require('../services/linkedinPublishSessionStore');

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

const sendVerificationEmail = async (user, req, { failSilently = false } = {}) => {
    const verificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    const frontendUrl = process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`;
    const verifyUrl = `${frontendUrl}/verify-email/${verificationToken}`;

    const message = `Verifica tu correo para activar tu cuenta: ${verifyUrl}`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Verificación de cuenta',
            message,
            title: 'Verifica Tu Cuenta',
            subtitle: 'Seguridad de Acceso',
            intro: `Hola ${user.name || ''}, te compartimos tu enlace de verificación para activar el acceso al dashboard de Cardenas Labs.`,
            ctaLabel: 'Verificar correo',
            ctaUrl: verifyUrl,
            footerNote: 'El enlace expira en 30 minutos por seguridad.',
        });
        return true;
    } catch (err) {
        user.emailVerificationToken = undefined;
        user.emailVerificationExpire = undefined;
        await user.save({ validateBeforeSave: false });
        if (failSilently) {
            return false;
        }
        throw new Error(`No se pudo enviar el correo de verificación: ${err.message}`);
    }
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

    if (!user.isEmailVerified) {
        res.status(403);
        throw new Error('Debes verificar tu correo antes de iniciar sesión');
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
            isEmailVerified: req.user.isEmailVerified,
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
    const verificationEmailSent = await sendVerificationEmail(user, req, { failSilently: true });

    sendResponse(
        res,
        201,
        {
            email: user.email,
            requiresEmailVerification: true,
            verificationEmailSent,
        },
        verificationEmailSent
            ? 'Usuario registrado. Revisa tu correo para verificar la cuenta.'
            : 'Usuario registrado, pero no pudimos enviar el correo en este momento. Intenta reenviar desde login.'
    );
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
            title: 'Recupera Tu Contraseña',
            subtitle: 'Restablecimiento Seguro',
            intro: `Hola ${user.name || ''}, recibimos una solicitud para restablecer tu contraseña.`,
            ctaLabel: 'Restablecer contraseña',
            ctaUrl: resetUrl,
            footerNote: 'Si no solicitaste este cambio, puedes ignorar este correo.',
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

const verifyEmail = asyncHandler(async (req, res) => {
    const emailVerificationToken = crypto
        .createHash('sha256')
        .update(req.params.verificationtoken)
        .digest('hex');

    const user = await User.findOne({
        emailVerificationToken,
        emailVerificationExpire: { $gt: Date.now() },
    }).select('+emailVerificationToken +emailVerificationExpire');

    if (!user) {
        res.status(400);
        throw new Error('Token de verificación inválido o expirado');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    sendResponse(res, 200, {}, 'Correo verificado exitosamente');
});

const resendVerificationEmail = asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        sendResponse(res, 200, {}, 'Si el email existe, enviamos un nuevo enlace de verificación');
        return;
    }

    if (user.isEmailVerified) {
        sendResponse(res, 200, {}, 'La cuenta ya se encuentra verificada');
        return;
    }

    await sendVerificationEmail(user, req);

    sendResponse(res, 200, {}, 'Si el email existe, enviamos un nuevo enlace de verificación');
});



const linkedinAuthLogin = asyncHandler(async (req, res) => {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
    const stateSecret = process.env.LINKEDIN_STATE_SECRET || 'linkedin_state_secret';

    if (!clientId || !redirectUri) {
        res.status(500);
        throw new Error('Faltan LINKEDIN_CLIENT_ID o LINKEDIN_REDIRECT_URI en el entorno');
    }

    const rawState = crypto.randomBytes(24).toString('hex');
    const stateHash = crypto
        .createHmac('sha256', stateSecret)
        .update(rawState)
        .digest('hex');

    res.cookie('li_oauth_state', rawState, {
        ...getCookieOptions(),
        httpOnly: true,
        sameSite: 'lax',
    });

    const authUrl = new URL(
        process.env.LINKEDIN_AUTH_URL || 'https://www.linkedin.com/oauth/v2/authorization'
    );

    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'openid profile email w_member_social');
    authUrl.searchParams.set('state', `${rawState}.${stateHash}`);

    sendResponse(
        res,
        200,
        {
            authorizationUrl: authUrl.toString(),
        },
        'URL de autorización LinkedIn generada'
    );
});

const linkedinAuthCallback = asyncHandler(async (req, res) => {
    const sendHtmlResponse = (payload) => {
        const payloadJson = JSON.stringify(payload).replace(/</g, '\\u003c');
        res
            .status(200)
            .set('Content-Type', 'text/html; charset=utf-8')
            .set('Cross-Origin-Opener-Policy', 'unsafe-none')
            .set('Cross-Origin-Embedder-Policy', 'unsafe-none')
            .set(
                'Content-Security-Policy',
                "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"
            )
            .send(`
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>LinkedIn Auth</title>
  </head>
  <body>
    <script>
      (function () {
        var payload = ${payloadJson};
        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ source: 'linkedin-oauth', payload: payload }, '*');
          }
        } catch (e) {}

        setTimeout(function () {
          window.close();
        }, 120);
      })();
    </script>
    <p>Procesando... Cerrando ventana...</p>
  </body>
</html>
`);
    };

    try {
        const clientId = process.env.LINKEDIN_CLIENT_ID;
        const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
        const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
        const stateSecret = process.env.LINKEDIN_STATE_SECRET || 'linkedin_state_secret';

        if (!clientId || !clientSecret || !redirectUri) {
            return sendHtmlResponse({ success: false, message: 'Faltan credenciales de LinkedIn en el entorno' });
        }

        const { code, state, error, error_description: errorDescription } = req.query;

        if (error) {
            return sendHtmlResponse({ success: false, message: `Has cancelado la conexión o ha ocurrido un error (${error})` });
        }

        if (!code || !state) {
            return sendHtmlResponse({ success: false, message: 'Callback de LinkedIn inválido: faltan code o state' });
        }

        const [rawState, receivedHash] = String(state).split('.');
        const expectedHash = crypto
            .createHmac('sha256', stateSecret)
            .update(rawState || '')
            .digest('hex');

        const stateFromCookie = req.cookies?.li_oauth_state;

        if (!rawState || !receivedHash || receivedHash !== expectedHash || !stateFromCookie || stateFromCookie !== rawState) {
            return sendHtmlResponse({ success: false, message: 'State de LinkedIn inválido o expirado. Por favor, intenta nuevamente.' });
        }

        res.clearCookie('li_oauth_state', {
            httpOnly: true,
            sameSite: process.env.COOKIE_SAMESITE || 'lax',
            secure: process.env.NODE_ENV === 'production',
        });

        const tokenUrl = process.env.LINKEDIN_TOKEN_URL || 'https://www.linkedin.com/oauth/v2/accessToken';
        const tokenBody = new URLSearchParams({
            grant_type: 'authorization_code',
            code: String(code),
            redirect_uri: redirectUri,
            client_id: clientId,
            client_secret: clientSecret,
        });

        const tokenResp = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: tokenBody.toString(),
        });

        if (!tokenResp.ok) {
            const tokenErr = await tokenResp.text();
            return sendHtmlResponse({ success: false, message: 'No se pudo obtener token de LinkedIn' });
        }

        const tokenJson = await tokenResp.json();
        const accessToken = tokenJson.access_token;

        if (!accessToken) {
            return sendHtmlResponse({ success: false, message: 'LinkedIn no devolvió el token de acceso' });
        }

        const userInfoUrl = process.env.LINKEDIN_USERINFO_URL || 'https://api.linkedin.com/v2/userinfo';
        const userInfoResp = await fetch(userInfoUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!userInfoResp.ok) {
            const userInfoErr = await userInfoResp.text();
            return sendHtmlResponse({ success: false, message: 'No se pudo obtener el perfil de LinkedIn' });
        }

        const profile = await userInfoResp.json();

        const payload = {
            success: true,
            data: {
                linkedinSub: profile.sub || '',
                name: profile.name || [profile.given_name, profile.family_name].filter(Boolean).join(' '),
                email: profile.email || '',
                linkedin: profile.profile || '',
                linkedinPhotoUrl: profile.picture || '',
                publishSessionId: createPublishSession({
                    accessToken,
                    linkedinSub: profile.sub || '',
                }).id,
                rawProfile: profile,
            },
            message: 'Perfil de LinkedIn obtenido',
        };

        sendHtmlResponse(payload);
    } catch (err) {
        sendHtmlResponse({ success: false, message: `Error procesando la conexión: ${err.message}` });
    }
});

module.exports = {
    loginUser,
    getMe,
    registerUser,
    logoutUser,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerificationEmail,
    linkedinAuthLogin,
    linkedinAuthCallback,
};
