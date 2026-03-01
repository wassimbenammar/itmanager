const express = require('express');
const router = express.Router();
const { requireAuth } = require('../config/jwt');
const db = require('../config/db');

router.use(requireAuth);

// GET /api/search?q=...
router.get('/', (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q || q.length < 2) return res.json({ equipements: [], logiciels: [], utilisateurs: [], comptes: [] });

  const like = `%${q}%`;

  const equipements = db.prepare(`
    SELECT id, nom, type, statut, numero_serie, fabricant
    FROM equipements
    WHERE nom LIKE ? OR numero_serie LIKE ? OR fabricant LIKE ? OR modele LIKE ?
    LIMIT 5
  `).all(like, like, like, like);

  const logiciels = db.prepare(`
    SELECT id, nom, fournisseur, type_licence
    FROM logiciels
    WHERE nom LIKE ? OR fournisseur LIKE ?
    LIMIT 5
  `).all(like, like);

  const utilisateurs = db.prepare(`
    SELECT id, nom, prenom, email, departement, role
    FROM utilisateurs
    WHERE nom LIKE ? OR prenom LIKE ? OR email LIKE ?
    LIMIT 5
  `).all(like, like, like);

  const comptes = db.prepare(`
    SELECT id, nom_service, identifiant, service, type_compte
    FROM comptes_externes
    WHERE nom_service LIKE ? OR identifiant LIKE ? OR service LIKE ?
    LIMIT 5
  `).all(like, like, like);

  res.json({ equipements, logiciels, utilisateurs, comptes });
});

module.exports = router;
