const nodemailer = require('nodemailer');

const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_EMAIL', 'SMTP_PASSWORD', 'FROM_EMAIL'];

const sendEmail = async (options) => {
    const missing = requiredVars.filter((envVar) => !process.env[envVar]);

    if (missing.length > 0) {
        throw new Error(`Faltan variables SMTP: ${missing.join(', ')}`);
    }

    const port = Number(process.env.SMTP_PORT);
    const secureFromEnv = process.env.SMTP_SECURE;
    const secure = typeof secureFromEnv === 'string' ? secureFromEnv === 'true' : port === 465;

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure,
        connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 10000),
        greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 10000),
        socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 15000),
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    const message = {
        from: `${process.env.FROM_NAME || 'API'} <${process.env.FROM_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    await transporter.sendMail(message);
};

module.exports = sendEmail;
