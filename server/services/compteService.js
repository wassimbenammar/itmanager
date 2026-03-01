const db = require('../config/db');
const audit = require('./auditService');

function list({ service, actif, search, utilisateur_id, page = 1, limit = 20 } = {}) {
  let where = [];
  let params = {};

  if (service) { where.push('c.service = @service'); params.service = service; }
  if (actif !== undefined) { where.push('c.actif = @actif'); params.actif = actif ? 1 : 0; }
  if (utilisateur_id) { where.push('c.utilisateur_id = @utilisateur_id'); params.utilisateur_id = utilisateur_id; }
  if (search) {
    where.push('(c.nom_service LIKE @search OR c.identifiant LIKE @search)');
    params.search = `%${search}%`;
  }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const offset = (page - 1) * limit;

  const total = db.prepare(`SELECT COUNT(*) as n FROM comptes_externes c ${whereClause}`).get(params).n;
  const rows = db.prepare(`
    SELECT c.*, u.nom || ' ' || u.prenom as utilisateur_nom, u.email as utilisateur_email
    FROM comptes_externes c
    LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
    ${whereClause}
    ORDER BY c.created_at DESC
    LIMIT @limit OFFSET @offset
  `).all({ ...params, limit, offset });

  return { data: rows, total, page, limit };
}

function getById(id) {
  return db.prepare(`
    SELECT c.*, u.nom || ' ' || u.prenom as utilisateur_nom, u.email as utilisateur_email
    FROM comptes_externes c
    LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
    WHERE c.id = ?
  `).get(id);
}

function create(data, userId) {
  const result = db.prepare(`
    INSERT INTO comptes_externes (service, nom_service, identifiant, type_compte, utilisateur_id, date_creation, derniere_utilisation, niveau_acces, actif, notes)
    VALUES (@service, @nom_service, @identifiant, @type_compte, @utilisateur_id, @date_creation, @derniere_utilisation, @niveau_acces, @actif, @notes)
  `).run(data);
  const created = getById(result.lastInsertRowid);
  audit.log({ utilisateurId: userId, action: 'create', entiteType: 'compte', entiteId: created.id, entiteLabel: created.nom_service, nouvellesValeurs: data });
  return created;
}

function update(id, data, userId) {
  const old = getById(id);
  if (!old) return null;
  db.prepare(`
    UPDATE comptes_externes SET
      service = @service, nom_service = @nom_service, identifiant = @identifiant,
      type_compte = @type_compte, utilisateur_id = @utilisateur_id,
      date_creation = @date_creation, derniere_utilisation = @derniere_utilisation,
      niveau_acces = @niveau_acces, actif = @actif, notes = @notes,
      updated_at = datetime('now')
    WHERE id = @id
  `).run({ ...data, id });
  const updated = getById(id);
  audit.log({ utilisateurId: userId, action: 'update', entiteType: 'compte', entiteId: id, entiteLabel: updated.nom_service, anciennesValeurs: old, nouvellesValeurs: data });
  return updated;
}

function remove(id, userId) {
  const compte = getById(id);
  if (!compte) return null;
  db.prepare('DELETE FROM comptes_externes WHERE id = ?').run(id);
  audit.log({ utilisateurId: userId, action: 'delete', entiteType: 'compte', entiteId: id, entiteLabel: compte.nom_service, anciennesValeurs: compte });
  return compte;
}

module.exports = { list, getById, create, update, remove };
