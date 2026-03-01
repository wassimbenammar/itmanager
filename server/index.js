require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const createApp = require('./app');
const db = require('./config/db');
const bcrypt = require('bcrypt');
const os = require('os');

const PORT = process.env.PORT || 3002;

async function seedAdminUser() {
  const count = db.prepare('SELECT COUNT(*) as n FROM utilisateurs').get().n;
  if (count === 0) {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'changeme123';
    const hash = await bcrypt.hash(password, 12);
    db.prepare(`
      INSERT INTO utilisateurs (nom, prenom, email, role, username, password)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('Administrateur', 'IT', 'admin@itmanager.local', 'admin', username, hash);
    console.log(`[SETUP] Compte admin créé : ${username}`);
    console.log('[SETUP] IMPORTANT : Changez le mot de passe après la première connexion !');
  }
}

function getLocalIPs() {
  const ifaces = os.networkInterfaces();
  const ips = [];
  for (const iface of Object.values(ifaces)) {
    for (const addr of iface) {
      if (addr.family === 'IPv4' && !addr.internal) ips.push(addr.address);
    }
  }
  return ips;
}

function advertiseBonjour(port) {
  try {
    const { Bonjour } = require('bonjour-service');
    const bonjour = new Bonjour();
    bonjour.publish({ name: 'ITManager', type: 'http', port: +port, host: 'itmanager.local' });
    console.log(`[mDNS] Service annoncé → http://itmanager.local:${port}`);
    process.on('SIGINT', () => { bonjour.unpublishAll(() => process.exit()); });
    process.on('SIGTERM', () => { bonjour.unpublishAll(() => process.exit()); });
  } catch (err) {
    console.warn('[mDNS] Annonce mDNS non disponible:', err.message);
  }
}

async function start() {
  await seedAdminUser();
  const app = createApp();
  const hostname = os.hostname();

  app.listen(PORT, '0.0.0.0', () => {
    const ips = getLocalIPs();
    console.log(`[SERVER] ITManager démarré — port ${PORT}`);
    console.log(`[SERVER] Environnement : ${process.env.NODE_ENV || 'development'}`);
    console.log(`[SERVER] Local        : http://localhost:${PORT}`);
    console.log(`[SERVER] Nom machine  : http://${hostname}.local:${PORT}`);
    for (const ip of ips) console.log(`[SERVER] IP réseau    : http://${ip}:${PORT}`);
    advertiseBonjour(PORT);
  });
}

start().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
