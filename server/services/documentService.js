const db = require('../config/db');

function getByEquipement(equipementId) {
  return db.prepare('SELECT id, nom, type_mime, taille, created_at FROM documents WHERE equipement_id = ? ORDER BY created_at DESC').all(equipementId);
}

function getById(id) {
  return db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
}

function add(equipementId, { nom, type_mime, data, taille }) {
  const r = db.prepare('INSERT INTO documents (equipement_id, nom, type_mime, data, taille) VALUES (?, ?, ?, ?, ?)').run(
    equipementId, nom, type_mime || null, data, taille || null
  );
  return db.prepare('SELECT id, nom, type_mime, taille, created_at FROM documents WHERE id = ?').get(r.lastInsertRowid);
}

function remove(id) {
  db.prepare('DELETE FROM documents WHERE id = ?').run(id);
}

module.exports = { getByEquipement, getById, add, remove };
