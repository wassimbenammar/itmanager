CREATE TABLE photos_equipements (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  equipement_id INTEGER NOT NULL REFERENCES equipements(id) ON DELETE CASCADE,
  data          TEXT NOT NULL,
  nom           TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE remises_equipements (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  equipement_id  INTEGER NOT NULL REFERENCES equipements(id) ON DELETE CASCADE,
  utilisateur_id INTEGER REFERENCES utilisateurs(id) ON DELETE SET NULL,
  type           TEXT NOT NULL DEFAULT 'attribution',
  signature      TEXT,
  notes          TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE equipement_logiciels (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  equipement_id     INTEGER NOT NULL REFERENCES equipements(id) ON DELETE CASCADE,
  logiciel_id       INTEGER NOT NULL REFERENCES logiciels(id) ON DELETE CASCADE,
  date_installation TEXT,
  notes             TEXT,
  UNIQUE(equipement_id, logiciel_id)
);

CREATE TABLE lifecycle_events (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  equipement_id  INTEGER NOT NULL REFERENCES equipements(id) ON DELETE CASCADE,
  statut_avant   TEXT,
  statut_apres   TEXT NOT NULL,
  notes          TEXT,
  utilisateur_id INTEGER REFERENCES utilisateurs(id) ON DELETE SET NULL,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

ALTER TABLE equipements ADD COLUMN date_garantie_debut TEXT;
ALTER TABLE equipements ADD COLUMN date_garantie_fin    TEXT;
ALTER TABLE equipements ADD COLUMN garantie_fournisseur TEXT;
ALTER TABLE equipements ADD COLUMN date_fin_vie         TEXT;
ALTER TABLE equipements ADD COLUMN numero_bon_commande  TEXT;
