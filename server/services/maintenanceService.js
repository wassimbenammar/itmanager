const db = require('../config/db');

function getByEquipement(equipementId) {
  return db.prepare(`
    SELECT m.*, u.nom || ' ' || u.prenom as utilisateur_nom
    FROM maintenances m
    LEFT JOIN utilisateurs u ON m.utilisateur_id = u.id
    WHERE m.equipement_id = ?
    ORDER BY COALESCE(m.date_planifiee, m.created_at) DESC
  `).all(equipementId);
}

function getById(id) {
  return db.prepare(`
    SELECT m.*, u.nom || ' ' || u.prenom as utilisateur_nom
    FROM maintenances m LEFT JOIN utilisateurs u ON m.utilisateur_id = u.id
    WHERE m.id = ?
  `).get(id);
}

function create(equipementId, data) {
  const r = db.prepare(`
    INSERT INTO maintenances (equipement_id, titre, type, statut, date_planifiee, date_realisee, cout, prestataire, notes, utilisateur_id)
    VALUES (@equipement_id, @titre, @type, @statut, @date_planifiee, @date_realisee, @cout, @prestataire, @notes, @utilisateur_id)
  `).run({
    equipement_id: equipementId, titre: data.titre, type: data.type || 'preventif',
    statut: data.statut || 'planifie', date_planifiee: data.date_planifiee || null,
    date_realisee: data.date_realisee || null, cout: data.cout ? +data.cout : null,
    prestataire: data.prestataire || null, notes: data.notes || null,
    utilisateur_id: data.utilisateur_id || null,
  });
  return getById(r.lastInsertRowid);
}

function update(id, data) {
  db.prepare(`
    UPDATE maintenances SET titre=@titre, type=@type, statut=@statut, date_planifiee=@date_planifiee,
      date_realisee=@date_realisee, cout=@cout, prestataire=@prestataire, notes=@notes,
      utilisateur_id=@utilisateur_id, updated_at=datetime('now')
    WHERE id=@id
  `).run({
    titre: data.titre, type: data.type || 'preventif', statut: data.statut || 'planifie',
    date_planifiee: data.date_planifiee || null, date_realisee: data.date_realisee || null,
    cout: data.cout ? +data.cout : null, prestataire: data.prestataire || null,
    notes: data.notes || null, utilisateur_id: data.utilisateur_id || null, id,
  });
  return getById(id);
}

function remove(id) {
  db.prepare('DELETE FROM maintenances WHERE id = ?').run(id);
}

function getUpcoming(days = 30) {
  const future = new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
  return db.prepare(`
    SELECT m.*, e.nom as equipement_nom, u.nom || ' ' || u.prenom as utilisateur_nom
    FROM maintenances m
    JOIN equipements e ON m.equipement_id = e.id
    LEFT JOIN utilisateurs u ON m.utilisateur_id = u.id
    WHERE m.statut IN ('planifie','en_cours') AND m.date_planifiee <= ?
    ORDER BY m.date_planifiee
  `).all(future);
}

module.exports = { getByEquipement, getById, create, update, remove, getUpcoming };
