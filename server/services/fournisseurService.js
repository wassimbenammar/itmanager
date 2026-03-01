const db = require('../config/db');
const audit = require('./auditService');

function list({ search } = {}) {
  const where = search ? `WHERE (f.nom LIKE '%' || @s || '%' OR f.contact_email LIKE '%' || @s || '%')` : '';
  const params = search ? { s: search } : {};
  return db.prepare(`
    SELECT f.*,
      (SELECT COUNT(*) FROM equipements WHERE fournisseur_id = f.id) as nb_equipements,
      (SELECT COUNT(*) FROM logiciels   WHERE fournisseur_id = f.id) as nb_logiciels
    FROM fournisseurs f ${where} ORDER BY f.nom
  `).all(params);
}

function getById(id) {
  return db.prepare(`
    SELECT f.*,
      (SELECT COUNT(*) FROM equipements WHERE fournisseur_id = f.id) as nb_equipements,
      (SELECT COUNT(*) FROM logiciels   WHERE fournisseur_id = f.id) as nb_logiciels
    FROM fournisseurs f WHERE f.id = ?
  `).get(id);
}

function create(data, userId) {
  const r = db.prepare(`
    INSERT INTO fournisseurs (nom, contact_nom, contact_email, contact_tel, site_web, notes)
    VALUES (@nom, @contact_nom, @contact_email, @contact_tel, @site_web, @notes)
  `).run({
    nom: data.nom, contact_nom: data.contact_nom || null, contact_email: data.contact_email || null,
    contact_tel: data.contact_tel || null, site_web: data.site_web || null, notes: data.notes || null,
  });
  const f = getById(r.lastInsertRowid);
  audit.log({ utilisateurId: userId, action: 'create', entiteType: 'fournisseur', entiteId: f.id, entiteLabel: f.nom, nouvellesValeurs: data });
  return f;
}

function update(id, data, userId) {
  const old = getById(id);
  if (!old) return null;
  db.prepare(`
    UPDATE fournisseurs SET nom=@nom, contact_nom=@contact_nom, contact_email=@contact_email,
      contact_tel=@contact_tel, site_web=@site_web, notes=@notes, updated_at=datetime('now')
    WHERE id=@id
  `).run({
    nom: data.nom, contact_nom: data.contact_nom || null, contact_email: data.contact_email || null,
    contact_tel: data.contact_tel || null, site_web: data.site_web || null, notes: data.notes || null, id,
  });
  const f = getById(id);
  audit.log({ utilisateurId: userId, action: 'update', entiteType: 'fournisseur', entiteId: id, entiteLabel: f.nom, anciennesValeurs: old, nouvellesValeurs: data });
  return f;
}

function remove(id, userId) {
  const f = getById(id);
  if (!f) return null;
  db.prepare('DELETE FROM fournisseurs WHERE id = ?').run(id);
  audit.log({ utilisateurId: userId, action: 'delete', entiteType: 'fournisseur', entiteId: id, entiteLabel: f.nom, anciennesValeurs: f });
  return f;
}

module.exports = { list, getById, create, update, remove };
