const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { z } = require('zod');
const db = require('../config/db');
const { signToken, signRefreshToken, verifyToken, requireAuth } = require('../config/jwt');

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Identifiant et mot de passe requis' });

  const { username, password } = parsed.data;
  const user = db.prepare('SELECT * FROM utilisateurs WHERE username = ? AND actif = 1').get(username);

  if (!user) return res.status(401).json({ error: 'Identifiants invalides' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Identifiants invalides' });

  const payload = { id: user.id, username: user.username, role: user.role, nom: user.nom, prenom: user.prenom };
  const token = signToken(payload);
  const refreshToken = signRefreshToken(payload);

  const hash = await bcrypt.hash(refreshToken, 10);
  db.prepare("UPDATE utilisateurs SET refresh_token = ?, updated_at = datetime('now') WHERE id = ?").run(hash, user.id);

  res.json({
    token,
    refreshToken,
    user: { id: user.id, username: user.username, role: user.role, nom: user.nom, prenom: user.prenom, email: user.email },
  });
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken requis' });

  let decoded;
  try {
    decoded = verifyToken(refreshToken);
  } catch {
    return res.status(401).json({ error: 'Token de rafraîchissement invalide ou expiré' });
  }

  const user = db.prepare('SELECT * FROM utilisateurs WHERE id = ?').get(decoded.id);
  if (!user || !user.refresh_token) return res.status(401).json({ error: 'Token introuvable' });

  const valid = await bcrypt.compare(refreshToken, user.refresh_token);
  if (!valid) return res.status(401).json({ error: 'Token de rafraîchissement invalide' });

  const payload = { id: user.id, username: user.username, role: user.role, nom: user.nom, prenom: user.prenom };
  const newToken = signToken(payload);
  const newRefreshToken = signRefreshToken(payload);

  const hash = await bcrypt.hash(newRefreshToken, 10);
  db.prepare("UPDATE utilisateurs SET refresh_token = ?, updated_at = datetime('now') WHERE id = ?").run(hash, user.id);

  res.json({ token: newToken, refreshToken: newRefreshToken });
});

// POST /api/auth/logout
router.post('/logout', requireAuth, (req, res) => {
  db.prepare("UPDATE utilisateurs SET refresh_token = NULL, updated_at = datetime('now') WHERE id = ?").run(req.user.id);
  res.json({ ok: true });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, username, role, nom, prenom, email FROM utilisateurs WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  res.json(user);
});

module.exports = router;
