const db = require('../config/db');
const { encrypt, decrypt } = require('../config/crypto');

const WARRANTY_KEYS = ['dell_client_id', 'dell_client_secret', 'hp_api_key', 'hp_api_secret', 'lenovo_client_id'];

function getSetting(key) {
  const row = db.prepare('SELECT value, encrypted FROM app_settings WHERE key = ?').get(key);
  if (!row) return null;
  return row.encrypted ? decrypt(row.value) : row.value;
}

function setSetting(key, value, encrypted = false) {
  const stored = encrypted ? encrypt(value) : value;
  db.prepare(`
    INSERT INTO app_settings (key, value, encrypted, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      encrypted = excluded.encrypted,
      updated_at = excluded.updated_at
  `).run(key, stored, encrypted ? 1 : 0);
}

function getWarrantySettings() {
  const result = {};
  for (const key of WARRANTY_KEYS) {
    const val = getSetting(key);
    result[key] = val ? true : false;
  }
  return result;
}

function setWarrantySettings(settings) {
  for (const key of WARRANTY_KEYS) {
    if (settings[key] !== undefined && settings[key] !== null && settings[key] !== '') {
      setSetting(key, settings[key], true);
    }
  }
}

function getWarrantyCredentials() {
  return Object.fromEntries(WARRANTY_KEYS.map(k => [k, getSetting(k)]));
}

module.exports = { getSetting, setSetting, getWarrantySettings, setWarrantySettings, getWarrantyCredentials };
