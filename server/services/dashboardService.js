const db = require('../config/db');

function getStats() {
  const totalEquipements = db.prepare('SELECT COUNT(*) as n FROM equipements').get().n;
  const equipementsActifs = db.prepare("SELECT COUNT(*) as n FROM equipements WHERE statut = 'actif'").get().n;

  const today = new Date().toISOString().split('T')[0];
  const in30days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const licencesTotal = db.prepare('SELECT COUNT(*) as n FROM logiciels').get().n;
  const licencesExpirees = db.prepare("SELECT COUNT(*) as n FROM logiciels WHERE date_expiration IS NOT NULL AND date_expiration < ?").get(today).n;
  const licencesExpirantBientot = db.prepare("SELECT COUNT(*) as n FROM logiciels WHERE date_expiration IS NOT NULL AND date_expiration >= ? AND date_expiration <= ?").get(today, in30days).n;

  const comptesActifs = db.prepare("SELECT COUNT(*) as n FROM comptes_externes WHERE actif = 1").get().n;
  const comptesTotal = db.prepare("SELECT COUNT(*) as n FROM comptes_externes").get().n;

  const utilisateursActifs = db.prepare("SELECT COUNT(*) as n FROM utilisateurs WHERE actif = 1").get().n;

  // Equipements par type
  const equipementsParType = db.prepare(`
    SELECT type, COUNT(*) as count FROM equipements GROUP BY type ORDER BY count DESC
  `).all();

  // Statuts des équipements
  const equipementsParStatut = db.prepare(`
    SELECT statut, COUNT(*) as count FROM equipements GROUP BY statut
  `).all();

  // Licences actives vs expirées
  const licencesParStatut = [
    { name: 'Actives', count: licencesTotal - licencesExpirees },
    { name: 'Expirées', count: licencesExpirees },
  ];

  // Comptes par service
  const comptesParService = db.prepare(`
    SELECT service, COUNT(*) as count FROM comptes_externes GROUP BY service ORDER BY count DESC
  `).all();

  return {
    kpis: {
      totalEquipements,
      equipementsActifs,
      licencesTotal,
      licencesExpirees,
      licencesExpirantBientot,
      comptesActifs,
      comptesTotal,
      utilisateursActifs,
    },
    charts: {
      equipementsParType,
      equipementsParStatut,
      licencesParStatut,
      comptesParService,
    },
  };
}

module.exports = { getStats };
