-- ─── Utilisateurs (profil RH + auth) ────────────────────────────────────────
CREATE TABLE utilisateurs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nom           TEXT NOT NULL,
  prenom        TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  departement   TEXT,
  role          TEXT NOT NULL DEFAULT 'viewer',
  username      TEXT UNIQUE NOT NULL,
  password      TEXT NOT NULL,
  refresh_token TEXT,
  actif         INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Équipements ─────────────────────────────────────────────────────────────
CREATE TABLE equipements (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  nom            TEXT NOT NULL,
  type           TEXT NOT NULL DEFAULT 'autre',
  numero_serie   TEXT UNIQUE,
  fabricant      TEXT,
  modele         TEXT,
  date_achat     TEXT,
  statut         TEXT NOT NULL DEFAULT 'actif',
  utilisateur_id INTEGER REFERENCES utilisateurs(id) ON DELETE SET NULL,
  localisation   TEXT,
  notes          TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Logiciels / Licences ────────────────────────────────────────────────────
CREATE TABLE logiciels (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  nom              TEXT NOT NULL,
  fournisseur      TEXT,
  type_licence     TEXT DEFAULT 'perpetuelle',
  nombre_licences  INTEGER NOT NULL DEFAULT 1,
  date_expiration  TEXT,
  cle_licence      TEXT,
  notes            TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Attributions de licences ────────────────────────────────────────────────
CREATE TABLE attributions_licences (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  logiciel_id      INTEGER NOT NULL REFERENCES logiciels(id) ON DELETE CASCADE,
  utilisateur_id   INTEGER NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  date_attribution TEXT NOT NULL DEFAULT (datetime('now')),
  notes            TEXT,
  UNIQUE(logiciel_id, utilisateur_id)
);

-- ─── Comptes externes ────────────────────────────────────────────────────────
CREATE TABLE comptes_externes (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  service              TEXT NOT NULL DEFAULT 'autre',
  nom_service          TEXT NOT NULL,
  identifiant          TEXT NOT NULL,
  type_compte          TEXT,
  utilisateur_id       INTEGER REFERENCES utilisateurs(id) ON DELETE SET NULL,
  date_creation        TEXT,
  derniere_utilisation TEXT,
  niveau_acces         TEXT DEFAULT 'lecture',
  actif                INTEGER NOT NULL DEFAULT 1,
  notes                TEXT,
  created_at           TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at           TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Journal d'audit ─────────────────────────────────────────────────────────
CREATE TABLE audit_logs (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  utilisateur_id   INTEGER REFERENCES utilisateurs(id) ON DELETE SET NULL,
  action           TEXT NOT NULL,
  entite_type      TEXT NOT NULL,
  entite_id        INTEGER,
  entite_label     TEXT,
  anciennes_valeurs TEXT,
  nouvelles_valeurs TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);
