const db = require('../config/db');

function inventoryReport() {
  return db.prepare(`
    SELECT e.id, e.nom, e.type, e.fabricant, e.modele, e.numero_serie, e.statut, e.localisation,
      e.hostname, e.adresse_ip, e.adresse_mac, e.date_achat, e.prix_achat, e.duree_amortissement_ans,
      e.date_garantie_debut, e.date_garantie_fin, e.garantie_fournisseur, e.date_fin_vie,
      e.numero_bon_commande, e.notes, e.created_at,
      u.nom || ' ' || u.prenom as utilisateur_nom, u.email as utilisateur_email,
      f.nom as fournisseur_nom
    FROM equipements e
    LEFT JOIN utilisateurs u ON e.utilisateur_id = u.id
    LEFT JOIN fournisseurs f ON e.fournisseur_id = f.id
    ORDER BY e.nom
  `).all();
}

function warrantyReport() {
  return db.prepare(`
    SELECT e.nom, e.fabricant, e.modele, e.numero_serie, e.statut,
      e.date_garantie_debut, e.date_garantie_fin, e.garantie_fournisseur,
      u.nom || ' ' || u.prenom as utilisateur_nom
    FROM equipements e
    LEFT JOIN utilisateurs u ON e.utilisateur_id = u.id
    WHERE e.date_garantie_fin IS NOT NULL
    ORDER BY e.date_garantie_fin
  `).all();
}

function licenseReport() {
  return db.prepare(`
    SELECT l.id, l.nom, l.fournisseur, l.type_licence, l.nombre_licences, l.date_expiration,
      COUNT(al.utilisateur_id) as licences_attribuees,
      l.nombre_licences - COUNT(al.utilisateur_id) as licences_disponibles,
      CASE WHEN l.date_expiration < date('now') THEN 'expiré'
           WHEN l.date_expiration <= date('now','+30 days') THEN 'expire_bientot'
           ELSE 'actif' END as etat
    FROM logiciels l
    LEFT JOIN attributions_licences al ON l.id = al.logiciel_id
    GROUP BY l.id
    ORDER BY l.nom
  `).all();
}

function maintenanceReport() {
  return db.prepare(`
    SELECT m.titre, m.type, m.statut, m.date_planifiee, m.date_realisee, m.cout, m.prestataire,
      e.nom as equipement_nom, e.numero_serie,
      u.nom || ' ' || u.prenom as utilisateur_nom
    FROM maintenances m
    JOIN equipements e ON m.equipement_id = e.id
    LEFT JOIN utilisateurs u ON m.utilisateur_id = u.id
    ORDER BY COALESCE(m.date_planifiee, m.created_at) DESC
  `).all();
}

function toCsv(rows, columns) {
  if (!rows || rows.length === 0) return '';
  const cols = columns || Object.keys(rows[0]);
  const header = cols.join(',');
  const lines = rows.map(row =>
    cols.map(c => {
      const val = row[c] ?? '';
      const str = String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(',')
  );
  return [header, ...lines].join('\n');
}

module.exports = { inventoryReport, warrantyReport, licenseReport, maintenanceReport, toCsv };
