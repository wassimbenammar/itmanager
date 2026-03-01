const express = require('express');
const router = express.Router();
const { requireAuth } = require('../config/jwt');
const db = require('../config/db');

router.get('/', requireAuth, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const in30days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Licences expirées
  const licencesExpirees = db.prepare(`
    SELECT id, nom, fournisseur, date_expiration,
      (SELECT COUNT(*) FROM attributions_licences WHERE logiciel_id = logiciels.id) as licences_utilisees,
      nombre_licences
    FROM logiciels
    WHERE date_expiration IS NOT NULL AND date_expiration < ?
    ORDER BY date_expiration
  `).all(today);

  // Licences expirant dans 30 jours
  const licencesExpirantBientot = db.prepare(`
    SELECT id, nom, fournisseur, date_expiration,
      (SELECT COUNT(*) FROM attributions_licences WHERE logiciel_id = logiciels.id) as licences_utilisees,
      nombre_licences
    FROM logiciels
    WHERE date_expiration IS NOT NULL AND date_expiration >= ? AND date_expiration <= ?
    ORDER BY date_expiration
  `).all(today, in30days);

  // Licences saturées (utilisees >= nombre_licences)
  const licencesSaturees = db.prepare(`
    SELECT l.id, l.nom, l.nombre_licences,
      COUNT(al.id) as licences_utilisees
    FROM logiciels l
    LEFT JOIN attributions_licences al ON al.logiciel_id = l.id
    GROUP BY l.id
    HAVING licences_utilisees >= l.nombre_licences AND l.nombre_licences > 0
    ORDER BY l.nom
  `).all();

  // Équipements en maintenance
  const equipementsMaintenance = db.prepare(`
    SELECT e.*, u.nom || ' ' || u.prenom as utilisateur_nom
    FROM equipements e
    LEFT JOIN utilisateurs u ON e.utilisateur_id = u.id
    WHERE e.statut = 'maintenance'
    ORDER BY e.updated_at DESC
  `).all();

  // Comptes inactifs (pas utilisés depuis 90 jours)
  const in90days = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const comptesInactifs = db.prepare(`
    SELECT c.*, u.nom || ' ' || u.prenom as utilisateur_nom
    FROM comptes_externes c
    LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
    WHERE c.actif = 1 AND c.derniere_utilisation IS NOT NULL AND c.derniere_utilisation < ?
    ORDER BY c.derniere_utilisation
  `).all(in90days);

  const alertes = [
    ...licencesExpirees.map(l => ({ type: 'licence_expiree', severity: 'error', entite: 'logiciel', id: l.id, message: `Licence expirée : ${l.nom}`, detail: l })),
    ...licencesExpirantBientot.map(l => ({ type: 'licence_expire_bientot', severity: 'warning', entite: 'logiciel', id: l.id, message: `Licence expire bientôt : ${l.nom}`, detail: l })),
    ...licencesSaturees.map(l => ({ type: 'licence_saturee', severity: 'warning', entite: 'logiciel', id: l.id, message: `Licences épuisées : ${l.nom}`, detail: l })),
    ...equipementsMaintenance.map(e => ({ type: 'equipement_maintenance', severity: 'info', entite: 'equipement', id: e.id, message: `En maintenance : ${e.nom}`, detail: e })),
    ...comptesInactifs.map(c => ({ type: 'compte_inactif', severity: 'info', entite: 'compte', id: c.id, message: `Compte inactif : ${c.nom_service} (${c.identifiant})`, detail: c })),
  ];

  res.json({ alertes, count: alertes.length });
});

module.exports = router;
