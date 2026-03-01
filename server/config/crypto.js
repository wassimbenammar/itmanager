const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';

function getKey() {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error('ENCRYPTION_KEY environment variable is not set');
  return crypto.createHash('sha256').update(raw).digest();
}

function encrypt(plaintext) {
  if (!plaintext) return null;
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  return iv.toString('base64') + ':' + encrypted.toString('base64');
}

function decrypt(stored) {
  if (!stored) return null;
  const key = getKey();
  const [ivB64, dataB64] = stored.split(':');
  if (!ivB64 || !dataB64) return null;
  const iv = Buffer.from(ivB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

module.exports = { encrypt, decrypt };
