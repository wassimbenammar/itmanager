require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const createApp = require('./app');
const db = require('./config/db');
const bcrypt = require('bcrypt');

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

async function start() {
  await seedAdminUser();
  const app = createApp();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] ITManager démarré sur http://localhost:${PORT}`);
    console.log(`[SERVER] Environnement : ${process.env.NODE_ENV || 'development'}`);
  });
}

start().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
