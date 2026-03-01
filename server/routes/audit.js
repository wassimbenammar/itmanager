const express = require('express');
const router = express.Router();
const { requireAuth } = require('../config/jwt');
const db = require('../config/db');

router.get('/', requireAuth, (req, res) => {
  const { entite_type, utilisateur_id, from, to, page, limit } = req.query;
  const p = +page || 1;
  const l = +limit || 50;
  const offset = (p - 1) * l;

  let where = [];
  let params = {};

  if (entite_type) { where.push('a.entite_type = @entite_type'); params.entite_type = entite_type; }
  if (utilisateur_id) { where.push('a.utilisateur_id = @utilisateur_id'); params.utilisateur_id = +utilisateur_id; }
  if (from) { where.push('a.created_at >= @from'); params.from = from; }
  if (to) { where.push('a.created_at <= @to'); params.to = to + 'T23:59:59'; }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(*) as n FROM audit_logs a ${whereClause}`).get(params).n;
  const rows = db.prepare(`
    SELECT a.*, u.nom || ' ' || u.prenom as utilisateur_nom, u.username
    FROM audit_logs a
    LEFT JOIN utilisateurs u ON a.utilisateur_id = u.id
    ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT @limit OFFSET @offset
  `).all({ ...params, limit: l, offset });

  res.json({ data: rows, total, page: p, limit: l });
});

module.exports = router;
