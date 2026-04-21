const nodemailer = require('nodemailer');

const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_EMAIL', 'SMTP_PASSWORD', 'FROM_EMAIL'];

const sendEmail = async (options) => {
    const missing = requiredVars.filter((envVar) => !process.env[envVar]);

    if (missing.length > 0) {
        throw new Error(`Faltan variables SMTP: ${missing.join(', ')}`);
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
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
