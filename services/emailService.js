const nodemailer = require('nodemailer');

const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_EMAIL', 'SMTP_PASSWORD', 'FROM_EMAIL'];

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const toParagraphs = (message = '') => {
  const blocks = String(message || '')
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  return blocks
    .map((block) => `<p style="margin:0 0 14px;line-height:1.65;color:#d8dde8;font-size:14px;">${escapeHtml(block).replace(/\n/g, '<br/>')}</p>`)
    .join('');
};

const renderEmailLayout = ({
  preheader,
  title,
  subtitle,
  intro,
  message,
  summaryLines = [],
  ctaLabel,
  ctaUrl,
  footerNote,
}) => {
  const clientBase = String(process.env.CLIENT_URL || '').replace(/\/+$/, '');
  const logoUrl = clientBase ? `${clientBase}/I3.png` : 'I3.png';
  const statueUrl = clientBase ? `${clientBase}/estatua_devs.png` : 'estatua_devs.png';
  const safeTitle = escapeHtml(title || 'Cardenas Labs');
  const safeSubtitle = subtitle ? `<p style="margin:0 0 18px;color:#b8ff5b;font-size:12px;letter-spacing:1.2px;text-transform:uppercase;">${escapeHtml(subtitle)}</p>` : '';
  const safeIntro = intro ? `<p style="margin:0 0 14px;line-height:1.65;color:#d8dde8;font-size:14px;">${escapeHtml(intro)}</p>` : '';
  const safeMessage = toParagraphs(message);
  const safeSummary =
    summaryLines.length > 0
      ? `<div style="margin:18px 0 20px;padding:14px 16px;border-radius:14px;background:rgba(186,255,76,.08);border:1px solid rgba(186,255,76,.25);">
                ${summaryLines
        .map(
          (line) =>
            `<p style="margin:0 0 8px;line-height:1.5;color:#ebf1ff;font-size:13px;">${escapeHtml(line)}</p>`
        )
        .join('')}
              </div>`
      : '';
  const safeCta =
    ctaLabel && ctaUrl
      ? `<a href="${escapeHtml(ctaUrl)}" style="display:inline-block;margin-top:6px;padding:12px 18px;background:#baff4c;color:#071008;text-decoration:none;border-radius:10px;font-weight:700;font-size:13px;">${escapeHtml(
        ctaLabel
      )}</a>`
      : '';
  const safeFooterNote = footerNote
    ? `<p style="margin:16px 0 0;color:#9aa4b7;font-size:12px;line-height:1.5;">${escapeHtml(footerNote)}</p>`
    : '';

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;padding:0;background:#060606;font-family:Inter,Segoe UI,Arial,sans-serif;">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">
      ${escapeHtml(preheader || title || 'Cardenas Labs')}
    </span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#060606;padding:22px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:linear-gradient(180deg,#0b0e14 0%,#090b10 100%);border:1px solid rgba(186,255,76,.2);border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:24px 22px 20px;background:radial-gradient(circle at top right,rgba(186,255,76,.16),transparent 55%);">
                <div style="display:flex;align-items:center;justify-content:center;background:#05070b;border:1px solid rgba(186,255,76,.28);border-radius:12px;padding:10px 14px;width:100%;box-sizing:border-box;">
                  <img src="${escapeHtml(logoUrl)}" alt="Cardenas Labs" style="width:100%;max-width:320px;max-height:32px;height:auto;display:block;object-fit:contain;" />
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:2px 22px 24px;position:relative;">
                <img src="${escapeHtml(
    statueUrl
  )}" alt="" aria-hidden="true" style="position:absolute;right:8px;bottom:6px;width:220px;max-width:44%;height:auto;opacity:.12;pointer-events:none;" />
                <div style="position:relative;z-index:1;">
                ${safeSubtitle}
                <h1 style="margin:0 0 16px;color:#ffffff;font-size:24px;line-height:1.22;font-weight:700;">${safeTitle}</h1>
                ${safeIntro}
                ${safeMessage}
                ${safeSummary}
                ${safeCta}
                ${safeFooterNote}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 22px 20px;border-top:1px solid rgba(255,255,255,.06);">
                <p style="margin:0;color:#7f8ba1;font-size:11px;line-height:1.55;">
                  Este correo fue generado por Cardenas Labs. Si no reconoces esta actividad, puedes ignorar el mensaje.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

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
    text: options.message || '',
    html:
      options.html ||
      renderEmailLayout({
        preheader: options.preheader || options.subject,
        title: options.title || options.subject,
        subtitle: options.subtitle,
        intro: options.intro,
        message: options.message,
        summaryLines: options.summaryLines || [],
        ctaLabel: options.ctaLabel,
        ctaUrl: options.ctaUrl,
        footerNote: options.footerNote,
      }),
  };

  await transporter.sendMail(message);
};

module.exports = sendEmail;
