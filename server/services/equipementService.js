const db = require('../config/db');
const audit = require('./auditService');

function list({ type, statut, search, page = 1, limit = 20 } = {}) {
  let where = [];
  let params = {};

  if (type) { where.push('e.type = @type'); params.type = type; }
  if (statut) { where.push('e.statut = @statut'); params.statut = statut; }
  if (search) {
    where.push('(e.nom LIKE @search OR e.numero_serie LIKE @search OR e.fabricant LIKE @search OR e.modele LIKE @search)');
    params.search = `%${search}%`;
  }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const offset = (page - 1) * limit;

  const total = db.prepare(`SELECT COUNT(*) as n FROM equipements e ${whereClause}`).get(params).n;
  const rows = db.prepare(`
    SELECT e.*, u.nom || ' ' || u.prenom as utilisateur_nom
    FROM equipements e
    LEFT JOIN utilisateurs u ON e.utilisateur_id = u.id
    ${whereClause}
    ORDER BY e.created_at DESC
    LIMIT @limit OFFSET @offset
  `).all({ ...params, limit, offset });

  return { data: rows, total, page, limit };
}

function getById(id) {
  return db.prepare(`
    SELECT e.*, u.nom || ' ' || u.prenom as utilisateur_nom, u.email as utilisateur_email
    FROM equipements e
    LEFT JOIN utilisateurs u ON e.utilisateur_id = u.id
    WHERE e.id = ?
  `).get(id);
}

function create(data, userId) {
  const stmt = db.prepare(`
    INSERT INTO equipements (
      nom, type, numero_serie, fabricant, modele, date_achat, statut,
      utilisateur_id, localisation, notes,
      date_garantie_debut, date_garantie_fin, garantie_fournisseur,
      date_fin_vie, numero_bon_commande
    )
    VALUES (
      @nom, @type, @numero_serie, @fabricant, @modele, @date_achat, @statut,
      @utilisateur_id, @localisation, @notes,
      @date_garantie_debut, @date_garantie_fin, @garantie_fournisseur,
      @date_fin_vie, @numero_bon_commande
    )
  `);
  const result = stmt.run({
    nom: data.nom, type: data.type, numero_serie: data.numero_serie || null,
    fabricant: data.fabricant || null, modele: data.modele || null,
    date_achat: data.date_achat || null, statut: data.statut || 'actif',
    utilisateur_id: data.utilisateur_id || null, localisation: data.localisation || null,
    notes: data.notes || null,
    date_garantie_debut: data.date_garantie_debut || null,
    date_garantie_fin: data.date_garantie_fin || null,
    garantie_fournisseur: data.garantie_fournisseur || null,
    date_fin_vie: data.date_fin_vie || null,
    numero_bon_commande: data.numero_bon_commande || null,
  });
  const eq = getById(result.lastInsertRowid);

  // First lifecycle event: null → statut
  db.prepare(`
    INSERT INTO lifecycle_events (equipement_id, statut_avant, statut_apres, notes, utilisateur_id)
    VALUES (?, NULL, ?, 'Création de l''équipement', ?)
  `).run(eq.id, eq.statut, userId || null);

  audit.log({ utilisateurId: userId, action: 'create', entiteType: 'equipement', entiteId: eq.id, entiteLabel: eq.nom, nouvellesValeurs: data });
  return eq;
}

function update(id, data, userId) {
  const old = getById(id);
  if (!old) return null;

  db.prepare(`
    UPDATE equipements SET
      nom = @nom, type = @type, numero_serie = @numero_serie, fabricant = @fabricant,
      modele = @modele, date_achat = @date_achat, statut = @statut,
      utilisateur_id = @utilisateur_id, localisation = @localisation, notes = @notes,
      date_garantie_debut = @date_garantie_debut, date_garantie_fin = @date_garantie_fin,
      garantie_fournisseur = @garantie_fournisseur, date_fin_vie = @date_fin_vie,
      numero_bon_commande = @numero_bon_commande,
      updated_at = datetime('now')
    WHERE id = @id
  `).run({
    nom: data.nom, type: data.type, numero_serie: data.numero_serie || null,
    fabricant: data.fabricant || null, modele: data.modele || null,
    date_achat: data.date_achat || null, statut: data.statut || old.statut,
    utilisateur_id: data.utilisateur_id || null, localisation: data.localisation || null,
    notes: data.notes || null,
    date_garantie_debut: data.date_garantie_debut || null,
    date_garantie_fin: data.date_garantie_fin || null,
    garantie_fournisseur: data.garantie_fournisseur || null,
    date_fin_vie: data.date_fin_vie || null,
    numero_bon_commande: data.numero_bon_commande || null,
    id,
  });

  // Auto lifecycle event on statut change
  if (data.statut && data.statut !== old.statut) {
    db.prepare(`
      INSERT INTO lifecycle_events (equipement_id, statut_avant, statut_apres, utilisateur_id)
      VALUES (?, ?, ?, ?)
    `).run(id, old.statut, data.statut, userId || null);
  }

  const updated = getById(id);
  audit.log({ utilisateurId: userId, action: 'update', entiteType: 'equipement', entiteId: id, entiteLabel: updated.nom, anciennesValeurs: old, nouvellesValeurs: data });
  return updated;
}

function remove(id, userId) {
  const eq = getById(id);
  if (!eq) return null;
  db.prepare('DELETE FROM equipements WHERE id = ?').run(id);
  audit.log({ utilisateurId: userId, action: 'delete', entiteType: 'equipement', entiteId: id, entiteLabel: eq.nom, anciennesValeurs: eq });
  return eq;
}

// ── Photos ──────────────────────────────────────────────────────────────────
function getPhotos(equipementId) {
  return db.prepare('SELECT id, nom, created_at FROM photos_equipements WHERE equipement_id = ? ORDER BY created_at DESC').all(equipementId);
}

function getPhotoById(id) {
  return db.prepare('SELECT * FROM photos_equipements WHERE id = ?').get(id);
}

function addPhoto(equipementId, data, nom) {
  const result = db.prepare('INSERT INTO photos_equipements (equipement_id, data, nom) VALUES (?, ?, ?)').run(equipementId, data, nom || null);
  return db.prepare('SELECT id, nom, created_at FROM photos_equipements WHERE id = ?').get(result.lastInsertRowid);
}

function deletePhoto(id) {
  return db.prepare('DELETE FROM photos_equipements WHERE id = ?').run(id);
}

// ── Remises ─────────────────────────────────────────────────────────────────
function getRemises(equipementId) {
  return db.prepare(`
    SELECT r.*, u.nom || ' ' || u.prenom as utilisateur_nom
    FROM remises_equipements r
    LEFT JOIN utilisateurs u ON r.utilisateur_id = u.id
    WHERE r.equipement_id = ?
    ORDER BY r.created_at DESC
  `).all(equipementId);
}

function addRemise(equipementId, { utilisateur_id, type, signature, notes }) {
  const result = db.prepare(`
    INSERT INTO remises_equipements (equipement_id, utilisateur_id, type, signature, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(equipementId, utilisateur_id || null, type || 'attribution', signature || null, notes || null);
  return db.prepare(`
    SELECT r.*, u.nom || ' ' || u.prenom as utilisateur_nom
    FROM remises_equipements r
    LEFT JOIN utilisateurs u ON r.utilisateur_id = u.id
    WHERE r.id = ?
  `).get(result.lastInsertRowid);
}

// ── Logiciels liés ──────────────────────────────────────────────────────────
function getLogiciels(equipementId) {
  return db.prepare(`
    SELECT el.id, el.date_installation, el.notes, l.id as logiciel_id, l.nom, l.fournisseur, l.type_licence
    FROM equipement_logiciels el
    JOIN logiciels l ON el.logiciel_id = l.id
    WHERE el.equipement_id = ?
    ORDER BY l.nom
  `).all(equipementId);
}

function addLogiciel(equipementId, logicielId, date_installation, notes) {
  try {
    const result = db.prepare(`
      INSERT INTO equipement_logiciels (equipement_id, logiciel_id, date_installation, notes)
      VALUES (?, ?, ?, ?)
    `).run(equipementId, logicielId, date_installation || null, notes || null);
    return db.prepare(`
      SELECT el.id, el.date_installation, el.notes, l.id as logiciel_id, l.nom, l.fournisseur, l.type_licence
      FROM equipement_logiciels el
      JOIN logiciels l ON el.logiciel_id = l.id
      WHERE el.id = ?
    `).get(result.lastInsertRowid);
  } catch (err) {
    if (err.message?.includes('UNIQUE')) throw new Error('Ce logiciel est déjà lié à cet équipement');
    throw err;
  }
}

function removeLogiciel(equipementId, logicielId) {
  return db.prepare('DELETE FROM equipement_logiciels WHERE equipement_id = ? AND logiciel_id = ?').run(equipementId, logicielId);
}

// ── Lifecycle ────────────────────────────────────────────────────────────────
function getLifecycle(equipementId) {
  return db.prepare(`
    SELECT le.*, u.nom || ' ' || u.prenom as utilisateur_nom
    FROM lifecycle_events le
    LEFT JOIN utilisateurs u ON le.utilisateur_id = u.id
    WHERE le.equipement_id = ?
    ORDER BY le.created_at ASC
  `).all(equipementId);
}

// ── Warranty ─────────────────────────────────────────────────────────────────
function saveWarranty(id, { date_garantie_debut, date_garantie_fin, garantie_fournisseur }) {
  db.prepare(`
    UPDATE equipements SET date_garantie_debut = ?, date_garantie_fin = ?, garantie_fournisseur = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(date_garantie_debut || null, date_garantie_fin || null, garantie_fournisseur || null, id);
  return getById(id);
}

module.exports = {
  list, getById, create, update, remove,
  getPhotos, getPhotoById, addPhoto, deletePhoto,
  getRemises, addRemise,
  getLogiciels, addLogiciel, removeLogiciel,
  getLifecycle, saveWarranty,
};
