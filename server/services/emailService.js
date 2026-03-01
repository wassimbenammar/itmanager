let nodemailer;
try { nodemailer = require('nodemailer'); } catch { nodemailer = null; }

function getTransporter() {
  if (!nodemailer) throw new Error('nodemailer non installé — relancez npm install');
  const { getSetting } = require('./settingsService');
  const host = getSetting('smtp_host');
  const port = parseInt(getSetting('smtp_port') || '587', 10);
  const user = getSetting('smtp_user');
  const pass = getSetting('smtp_pass');
  if (!host) throw new Error('SMTP non configuré. Allez dans Paramètres → SMTP.');
  return nodemailer.createTransport({
    host, port, secure: port === 465,
    auth: user ? { user, pass: pass || '' } : undefined,
    tls: { rejectUnauthorized: false },
  });
}

async function sendMail({ to, subject, html }) {
  const { getSetting } = require('./settingsService');
  const from = getSetting('smtp_from') || getSetting('smtp_user') || 'itmanager@localhost';
  const transporter = getTransporter();
  return transporter.sendMail({ from, to, subject, html });
}

async function testSmtp() {
  const transporter = getTransporter();
  await transporter.verify();
  return { ok: true };
}

module.exports = { sendMail, testSmtp };
