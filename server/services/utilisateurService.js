const db = require('../config/db');
const bcrypt = require('bcrypt');
const audit = require('./auditService');

function list({ search, departement, role, actif, page = 1, limit = 20 } = {}) {
  let where = [];
  let params = {};

  if (departement) { where.push('departement = @departement'); params.departement = departement; }
  if (role) { where.push('role = @role'); params.role = role; }
  if (actif !== undefined) { where.push('actif = @actif'); params.actif = actif ? 1 : 0; }
  if (search) {
    where.push('(nom LIKE @search OR prenom LIKE @search OR email LIKE @search OR username LIKE @search)');
    params.search = `%${search}%`;
  }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const offset = (page - 1) * limit;

  const total = db.prepare(`SELECT COUNT(*) as n FROM utilisateurs ${whereClause}`).get(params).n;
  const rows = db.prepare(`
    SELECT id, nom, prenom, email, departement, role, username, actif, created_at, updated_at
    FROM utilisateurs
    ${whereClause}
    ORDER BY nom, prenom
    LIMIT @limit OFFSET @offset
  `).all({ ...params, limit, offset });

  return { data: rows, total, page, limit };
}

function getById(id) {
  return db.prepare(`
    SELECT id, nom, prenom, email, departement, role, username, actif, created_at, updated_at
    FROM utilisateurs WHERE id = ?
  `).get(id);
}

async function create(data, userId) {
  const hash = await bcrypt.hash(data.password, 12);
  const result = db.prepare(`
    INSERT INTO utilisateurs (nom, prenom, email, departement, role, username, password, actif)
    VALUES (@nom, @prenom, @email, @departement, @role, @username, @password, @actif)
  `).run({ ...data, password: hash, actif: data.actif !== false ? 1 : 0 });
  const created = getById(result.lastInsertRowid);
  audit.log({ utilisateurId: userId, action: 'create', entiteType: 'utilisateur', entiteId: created.id, entiteLabel: `${created.prenom} ${created.nom}` });
  return created;
}

async function update(id, data, userId) {
  const old = getById(id);
  if (!old) return null;
  const updates = { ...data, id, actif: data.actif !== undefined ? (data.actif ? 1 : 0) : old.actif };

  if (data.password) {
    updates.password = await bcrypt.hash(data.password, 12);
    db.prepare(`
      UPDATE utilisateurs SET
        nom = @nom, prenom = @prenom, email = @email, departement = @departement,
        role = @role, username = @username, password = @password, actif = @actif,
        updated_at = datetime('now')
      WHERE id = @id
    `).run(updates);
  } else {
    db.prepare(`
      UPDATE utilisateurs SET
        nom = @nom, prenom = @prenom, email = @email, departement = @departement,
        role = @role, username = @username, actif = @actif,
        updated_at = datetime('now')
      WHERE id = @id
    `).run(updates);
  }

  const updated = getById(id);
  audit.log({ utilisateurId: userId, action: 'update', entiteType: 'utilisateur', entiteId: id, entiteLabel: `${updated.prenom} ${updated.nom}` });
  return updated;
}

function remove(id, userId) {
  const u = getById(id);
  if (!u) return null;
  db.prepare('DELETE FROM utilisateurs WHERE id = ?').run(id);
  audit.log({ utilisateurId: userId, action: 'delete', entiteType: 'utilisateur', entiteId: id, entiteLabel: `${u.prenom} ${u.nom}` });
  return u;
}

function getEquipements(id) {
  return db.prepare('SELECT * FROM equipements WHERE utilisateur_id = ? ORDER BY nom').all(id);
}

function getLicences(id) {
  return db.prepare(`
    SELECT al.*, l.nom, l.fournisseur, l.type_licence, l.date_expiration
    FROM attributions_licences al
    JOIN logiciels l ON al.logiciel_id = l.id
    WHERE al.utilisateur_id = ?
    ORDER BY l.nom
  `).all(id);
}

function getComptes(id) {
  return db.prepare('SELECT * FROM comptes_externes WHERE utilisateur_id = ? ORDER BY nom_service').all(id);
}

module.exports = { list, getById, create, update, remove, getEquipements, getLicences, getComptes };
