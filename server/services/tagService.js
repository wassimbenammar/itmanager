const db = require('../config/db');

function getAll() {
  return db.prepare('SELECT * FROM tags ORDER BY nom').all();
}

function create(data) {
  const r = db.prepare("INSERT INTO tags (nom, couleur) VALUES (?, ?)").run(data.nom, data.couleur || '#6366f1');
  return db.prepare('SELECT * FROM tags WHERE id = ?').get(r.lastInsertRowid);
}

function update(id, data) {
  db.prepare("UPDATE tags SET nom=?, couleur=? WHERE id=?").run(data.nom, data.couleur || '#6366f1', id);
  return db.prepare('SELECT * FROM tags WHERE id = ?').get(id);
}

function remove(id) {
  db.prepare('DELETE FROM tags WHERE id = ?').run(id);
}

function getByEquipement(equipementId) {
  return db.prepare(`
    SELECT t.* FROM tags t
    JOIN equipement_tags et ON t.id = et.tag_id
    WHERE et.equipement_id = ?
    ORDER BY t.nom
  `).all(equipementId);
}

function addTag(equipementId, tagId) {
  db.prepare('INSERT OR IGNORE INTO equipement_tags (equipement_id, tag_id) VALUES (?, ?)').run(equipementId, tagId);
}

function removeTag(equipementId, tagId) {
  db.prepare('DELETE FROM equipement_tags WHERE equipement_id = ? AND tag_id = ?').run(equipementId, tagId);
}

module.exports = { getAll, create, update, remove, getByEquipement, addTag, removeTag };
