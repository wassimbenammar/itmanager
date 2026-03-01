const db = require('../config/db');

/**
 * Log an audit entry.
 * @param {object} opts
 * @param {number|null} opts.utilisateurId - Who performed the action
 * @param {string} opts.action - e.g. 'create', 'update', 'delete'
 * @param {string} opts.entiteType - e.g. 'equipement', 'logiciel', 'compte', 'utilisateur'
 * @param {number|null} opts.entiteId
 * @param {string|null} opts.entiteLabel - Human-readable name
 * @param {object|null} opts.anciennesValeurs
 * @param {object|null} opts.nouvellesValeurs
 */
function log({ utilisateurId = null, action, entiteType, entiteId = null, entiteLabel = null, anciennesValeurs = null, nouvellesValeurs = null }) {
  db.prepare(`
    INSERT INTO audit_logs (utilisateur_id, action, entite_type, entite_id, entite_label, anciennes_valeurs, nouvelles_valeurs)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    utilisateurId,
    action,
    entiteType,
    entiteId,
    entiteLabel,
    anciennesValeurs ? JSON.stringify(anciennesValeurs) : null,
    nouvellesValeurs ? JSON.stringify(nouvellesValeurs) : null
  );
}

module.exports = { log };
