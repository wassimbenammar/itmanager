const db = require('../config/db');
const { encrypt, decrypt } = require('../config/crypto');
const audit = require('./auditService');

function list({ search, type_licence, page = 1, limit = 20 } = {}) {
  let where = [];
  let params = {};

  if (type_licence) { where.push('type_licence = @type_licence'); params.type_licence = type_licence; }
  if (search) {
    where.push('(nom LIKE @search OR fournisseur LIKE @search)');
    params.search = `%${search}%`;
  }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const offset = (page - 1) * limit;

  const total = db.prepare(`SELECT COUNT(*) as n FROM logiciels ${whereClause}`).get(params).n;
  const rows = db.prepare(`
    SELECT l.*,
      (SELECT COUNT(*) FROM attributions_licences WHERE logiciel_id = l.id) as licences_utilisees
    FROM logiciels l
    ${whereClause}
    ORDER BY l.created_at DESC
    LIMIT @limit OFFSET @offset
  `).all({ ...params, limit, offset });

  return { data: rows.map(maskCle), total, page, limit };
}

function getById(id) {
  const row = db.prepare(`
    SELECT l.*,
      (SELECT COUNT(*) FROM attributions_licences WHERE logiciel_id = l.id) as licences_utilisees
    FROM logiciels l WHERE l.id = ?
  `).get(id);
  if (!row) return null;
  return { ...row, cle_licence: decrypt(row.cle_licence) };
}

function maskCle(row) {
  return { ...row, cle_licence: row.cle_licence ? '••••••••' : null };
}

function create(data, userId) {
  const toStore = { ...data, cle_licence: encrypt(data.cle_licence) };
  const result = db.prepare(`
    INSERT INTO logiciels (nom, fournisseur, type_licence, nombre_licences, date_expiration, cle_licence, notes)
    VALUES (@nom, @fournisseur, @type_licence, @nombre_licences, @date_expiration, @cle_licence, @notes)
  `).run(toStore);
  const created = getById(result.lastInsertRowid);
  audit.log({ utilisateurId: userId, action: 'create', entiteType: 'logiciel', entiteId: created.id, entiteLabel: created.nom });
  return created;
}

function update(id, data, userId) {
  const old = getById(id);
  if (!old) return null;
  const toStore = { ...data, cle_licence: data.cle_licence !== '••••••••' ? encrypt(data.cle_licence) : old.cle_licence ? encrypt(old.cle_licence) : null, id };
  // If cle_licence is the mask placeholder, keep the existing encrypted value
  const existingRaw = db.prepare('SELECT cle_licence FROM logiciels WHERE id = ?').get(id);
  const cleFinal = data.cle_licence && data.cle_licence !== '••••••••' ? encrypt(data.cle_licence) : existingRaw.cle_licence;

  db.prepare(`
    UPDATE logiciels SET
      nom = @nom, fournisseur = @fournisseur, type_licence = @type_licence,
      nombre_licences = @nombre_licences, date_expiration = @date_expiration,
      cle_licence = @cle_licence, notes = @notes, updated_at = datetime('now')
    WHERE id = @id
  `).run({ ...data, cle_licence: cleFinal, id });
  const updated = getById(id);
  audit.log({ utilisateurId: userId, action: 'update', entiteType: 'logiciel', entiteId: id, entiteLabel: updated.nom });
  return updated;
}

function remove(id, userId) {
  const log = getById(id);
  if (!log) return null;
  db.prepare('DELETE FROM logiciels WHERE id = ?').run(id);
  audit.log({ utilisateurId: userId, action: 'delete', entiteType: 'logiciel', entiteId: id, entiteLabel: log.nom });
  return log;
}

function getAttributions(logicielId) {
  return db.prepare(`
    SELECT al.*, u.nom, u.prenom, u.email, u.departement
    FROM attributions_licences al
    JOIN utilisateurs u ON al.utilisateur_id = u.id
    WHERE al.logiciel_id = ?
    ORDER BY al.date_attribution DESC
  `).all(logicielId);
}

function addAttribution(logicielId, utilisateurId, notes, userId) {
  const logiciel = db.prepare('SELECT * FROM logiciels WHERE id = ?').get(logicielId);
  const utilisees = db.prepare('SELECT COUNT(*) as n FROM attributions_licences WHERE logiciel_id = ?').get(logicielId).n;
  if (utilisees >= logiciel.nombre_licences) {
    throw new Error('Nombre maximum de licences atteint');
  }
  db.prepare(`
    INSERT INTO attributions_licences (logiciel_id, utilisateur_id, notes)
    VALUES (?, ?, ?)
  `).run(logicielId, utilisateurId, notes || null);
  const u = db.prepare('SELECT nom, prenom FROM utilisateurs WHERE id = ?').get(utilisateurId);
  audit.log({ utilisateurId: userId, action: 'attribuer_licence', entiteType: 'logiciel', entiteId: logicielId, entiteLabel: logiciel.nom, nouvellesValeurs: { utilisateur: u } });
}

function removeAttribution(logicielId, utilisateurId, userId) {
  const logiciel = db.prepare('SELECT nom FROM logiciels WHERE id = ?').get(logicielId);
  db.prepare('DELETE FROM attributions_licences WHERE logiciel_id = ? AND utilisateur_id = ?').run(logicielId, utilisateurId);
  audit.log({ utilisateurId: userId, action: 'retirer_licence', entiteType: 'logiciel', entiteId: logicielId, entiteLabel: logiciel?.nom });
}

module.exports = { list, getById, create, update, remove, getAttributions, addAttribution, removeAttribution };
