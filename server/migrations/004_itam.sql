-- Vendor management
CREATE TABLE fournisseurs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nom           TEXT NOT NULL,
  contact_nom   TEXT,
  contact_email TEXT,
  contact_tel   TEXT,
  site_web      TEXT,
  notes         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

ALTER TABLE equipements ADD COLUMN fournisseur_id INTEGER REFERENCES fournisseurs(id) ON DELETE SET NULL;
ALTER TABLE logiciels   ADD COLUMN fournisseur_id INTEGER REFERENCES fournisseurs(id) ON DELETE SET NULL;

-- Network and financial fields
ALTER TABLE equipements ADD COLUMN adresse_ip              TEXT;
ALTER TABLE equipements ADD COLUMN adresse_mac             TEXT;
ALTER TABLE equipements ADD COLUMN hostname                TEXT;
ALTER TABLE equipements ADD COLUMN prix_achat              REAL;
ALTER TABLE equipements ADD COLUMN duree_amortissement_ans INTEGER;

-- Maintenance scheduling
CREATE TABLE maintenances (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  equipement_id  INTEGER NOT NULL REFERENCES equipements(id) ON DELETE CASCADE,
  titre          TEXT NOT NULL,
  type           TEXT NOT NULL DEFAULT 'preventif',
  statut         TEXT NOT NULL DEFAULT 'planifie',
  date_planifiee TEXT,
  date_realisee  TEXT,
  cout           REAL,
  prestataire    TEXT,
  notes          TEXT,
  utilisateur_id INTEGER REFERENCES utilisateurs(id) ON DELETE SET NULL,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tags
CREATE TABLE tags (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  nom     TEXT NOT NULL UNIQUE,
  couleur TEXT NOT NULL DEFAULT '#6366f1'
);

CREATE TABLE equipement_tags (
  equipement_id INTEGER NOT NULL REFERENCES equipements(id) ON DELETE CASCADE,
  tag_id        INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (equipement_id, tag_id)
);

-- Document attachments
CREATE TABLE documents (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  equipement_id INTEGER NOT NULL REFERENCES equipements(id) ON DELETE CASCADE,
  nom           TEXT NOT NULL,
  type_mime     TEXT,
  data          TEXT NOT NULL,
  taille        INTEGER,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
