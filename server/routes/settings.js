const express = require('express');
const path = require('path');
const fs = require('fs');
const { requireAuth } = require('../config/jwt');
const { getWarrantySettings, setWarrantySettings, getSetting, setSetting } = require('../services/settingsService');
const emailSvc = require('../services/emailService');

const router = express.Router();

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  next();
}

// ── Warranty API keys ─────────────────────────────────────────────────────────

router.get('/warranty', requireAuth, requireAdmin, (req, res) => {
  res.json(getWarrantySettings());
});

router.post('/warranty', requireAuth, requireAdmin, (req, res) => {
  try {
    setWarrantySettings(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── SMTP ──────────────────────────────────────────────────────────────────────

const SMTP_PLAIN_KEYS = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_from'];

router.get('/smtp', requireAuth, requireAdmin, (req, res) => {
  const result = {};
  for (const key of SMTP_PLAIN_KEYS) result[key] = getSetting(key) || '';
  result.smtp_pass = getSetting('smtp_pass') ? true : false; // masked
  res.json(result);
});

router.post('/smtp', requireAuth, requireAdmin, (req, res) => {
  try {
    const { smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from } = req.body;
    if (smtp_host !== undefined) setSetting('smtp_host', smtp_host || '', false);
    if (smtp_port !== undefined) setSetting('smtp_port', smtp_port || '587', false);
    if (smtp_user !== undefined) setSetting('smtp_user', smtp_user || '', false);
    if (smtp_from !== undefined) setSetting('smtp_from', smtp_from || '', false);
    if (smtp_pass && smtp_pass !== '') setSetting('smtp_pass', smtp_pass, true);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/smtp/test', requireAuth, requireAdmin, async (req, res) => {
  try {
    await emailSvc.testSmtp();
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ── DB Backup ─────────────────────────────────────────────────────────────────

router.get('/backup', requireAuth, requireAdmin, (req, res) => {
  const dbPath = process.env.DB_PATH
    ? path.resolve(__dirname, '../../', process.env.DB_PATH)
    : path.resolve(__dirname, '../../data/itmanager.db');
  if (!fs.existsSync(dbPath)) return res.status(404).json({ error: 'Fichier DB introuvable' });
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  res.download(dbPath, `itmanager-backup-${ts}.db`);
});

module.exports = router;
