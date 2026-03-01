const express = require('express');
const router = express.Router();
const { requireAuth } = require('../config/jwt');
const svc = require('../services/equipementService');
const { lookupWarranty } = require('../services/warrantyService');
const docSvc = require('../services/documentService');
const mainSvc = require('../services/maintenanceService');
const tagSvc = require('../services/tagService');
const { toCsv } = require('../services/reportService');

router.use(requireAuth);

// ── Export CSV (must be before /:id routes) ───────────────────────────────────
router.get('/export/csv', (req, res) => {
  const { type, statut, search } = req.query;
  const result = svc.list({ type, statut, search, page: 1, limit: 99999 });
  const cols = ['id','nom','type','fabricant','modele','numero_serie','statut','localisation','hostname','adresse_ip','adresse_mac','utilisateur_nom','date_achat','prix_achat','date_garantie_fin','notes'];
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="equipements.csv"');
  res.send('\uFEFF' + toCsv(result.data, cols));
});

// ── Bulk Operations (must be before /:id routes) ──────────────────────────────
router.post('/bulk', (req, res) => {
  const { ids, action, statut } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'ids requis' });
  if (action === 'delete') {
    for (const id of ids) svc.remove(id, req.user.id);
    return res.json({ ok: true, affected: ids.length });
  }
  if (action === 'statut' && statut) {
    for (const id of ids) {
      const eq = svc.getById(id);
      if (eq) svc.update(id, { ...eq, statut }, req.user.id);
    }
    return res.json({ ok: true, affected: ids.length });
  }
  res.status(400).json({ error: 'Action inconnue' });
});

// GET /api/equipements
router.get('/', (req, res) => {
  const { type, statut, search, page, limit } = req.query;
  const result = svc.list({ type, statut, search, page: +page || 1, limit: +limit || 20 });
  res.json(result);
});

// POST /api/equipements
router.post('/', (req, res) => {
  try {
    const eq = svc.create(req.body, req.user.id);
    res.status(201).json(eq);
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return res.status(409).json({ error: 'Numéro de série déjà existant' });
    res.status(400).json({ error: err.message });
  }
});

// GET /api/equipements/:id
router.get('/:id', (req, res) => {
  const eq = svc.getById(+req.params.id);
  if (!eq) return res.status(404).json({ error: 'Équipement introuvable' });
  res.json(eq);
});

// PUT /api/equipements/:id
router.put('/:id', (req, res) => {
  try {
    const eq = svc.update(+req.params.id, req.body, req.user.id);
    if (!eq) return res.status(404).json({ error: 'Équipement introuvable' });
    res.json(eq);
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return res.status(409).json({ error: 'Numéro de série déjà existant' });
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/equipements/:id
router.delete('/:id', (req, res) => {
  const eq = svc.remove(+req.params.id, req.user.id);
  if (!eq) return res.status(404).json({ error: 'Équipement introuvable' });
  res.json({ ok: true });
});

// ── Photos ────────────────────────────────────────────────────────────────────

// GET /api/equipements/:id/photos
router.get('/:id/photos', (req, res) => {
  const eq = svc.getById(+req.params.id);
  if (!eq) return res.status(404).json({ error: 'Équipement introuvable' });
  res.json(svc.getPhotos(+req.params.id));
});

// GET /api/equipements/:id/photos/:pid (full data)
router.get('/:id/photos/:pid', (req, res) => {
  const photo = svc.getPhotoById(+req.params.pid);
  if (!photo) return res.status(404).json({ error: 'Photo introuvable' });
  res.json(photo);
});

// POST /api/equipements/:id/photos
router.post('/:id/photos', (req, res) => {
  const eq = svc.getById(+req.params.id);
  if (!eq) return res.status(404).json({ error: 'Équipement introuvable' });
  const { data, nom } = req.body;
  if (!data) return res.status(400).json({ error: 'data (base64) requis' });
  const photo = svc.addPhoto(+req.params.id, data, nom);
  res.status(201).json(photo);
});

// DELETE /api/equipements/:id/photos/:pid
router.delete('/:id/photos/:pid', (req, res) => {
  const result = svc.deletePhoto(+req.params.pid);
  if (!result.changes) return res.status(404).json({ error: 'Photo introuvable' });
  res.json({ ok: true });
});

// ── Remises ───────────────────────────────────────────────────────────────────

// GET /api/equipements/:id/remises
router.get('/:id/remises', (req, res) => {
  const eq = svc.getById(+req.params.id);
  if (!eq) return res.status(404).json({ error: 'Équipement introuvable' });
  res.json(svc.getRemises(+req.params.id));
});

// POST /api/equipements/:id/remises
router.post('/:id/remises', (req, res) => {
  const eq = svc.getById(+req.params.id);
  if (!eq) return res.status(404).json({ error: 'Équipement introuvable' });
  const remise = svc.addRemise(+req.params.id, req.body);
  res.status(201).json(remise);
});

// ── Logiciels ─────────────────────────────────────────────────────────────────

// GET /api/equipements/:id/logiciels
router.get('/:id/logiciels', (req, res) => {
  const eq = svc.getById(+req.params.id);
  if (!eq) return res.status(404).json({ error: 'Équipement introuvable' });
  res.json(svc.getLogiciels(+req.params.id));
});

// POST /api/equipements/:id/logiciels
router.post('/:id/logiciels', (req, res) => {
  try {
    const eq = svc.getById(+req.params.id);
    if (!eq) return res.status(404).json({ error: 'Équipement introuvable' });
    const { logiciel_id, date_installation, notes } = req.body;
    if (!logiciel_id) return res.status(400).json({ error: 'logiciel_id requis' });
    const link = svc.addLogiciel(+req.params.id, +logiciel_id, date_installation, notes);
    res.status(201).json(link);
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

// DELETE /api/equipements/:id/logiciels/:lid
router.delete('/:id/logiciels/:lid', (req, res) => {
  const result = svc.removeLogiciel(+req.params.id, +req.params.lid);
  if (!result.changes) return res.status(404).json({ error: 'Lien introuvable' });
  res.json({ ok: true });
});

// ── Lifecycle ─────────────────────────────────────────────────────────────────

// GET /api/equipements/:id/lifecycle
router.get('/:id/lifecycle', (req, res) => {
  const eq = svc.getById(+req.params.id);
  if (!eq) return res.status(404).json({ error: 'Équipement introuvable' });
  res.json(svc.getLifecycle(+req.params.id));
});

// ── Warranty ──────────────────────────────────────────────────────────────────

// POST /api/equipements/:id/warranty/lookup
router.post('/:id/warranty/lookup', async (req, res) => {
  try {
    const eq = svc.getById(+req.params.id);
    if (!eq) return res.status(404).json({ error: 'Équipement introuvable' });
    if (!eq.fabricant || !eq.numero_serie) {
      return res.status(400).json({ error: 'Fabricant et numéro de série requis sur l\'équipement' });
    }
    const result = await lookupWarranty(eq.fabricant, eq.numero_serie);
    if (result.unsupported || result.manual) return res.json(result);
    const updated = svc.saveWarranty(+req.params.id, result);
    res.json({ ...result, equipement: updated });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// ── Documents ─────────────────────────────────────────────────────────────────

router.get('/:id/documents', (req, res) => {
  if (!svc.getById(+req.params.id)) return res.status(404).json({ error: 'Équipement introuvable' });
  res.json(docSvc.getByEquipement(+req.params.id));
});

router.post('/:id/documents', (req, res) => {
  if (!svc.getById(+req.params.id)) return res.status(404).json({ error: 'Équipement introuvable' });
  const { nom, type_mime, data, taille } = req.body;
  if (!nom || !data) return res.status(400).json({ error: 'nom et data requis' });
  res.status(201).json(docSvc.add(+req.params.id, { nom, type_mime, data, taille }));
});

router.get('/:id/documents/:did', (req, res) => {
  const doc = docSvc.getById(+req.params.did);
  if (!doc || doc.equipement_id !== +req.params.id) return res.status(404).json({ error: 'Document introuvable' });
  res.json(doc);
});

router.delete('/:id/documents/:did', (req, res) => {
  const doc = docSvc.getById(+req.params.did);
  if (!doc || doc.equipement_id !== +req.params.id) return res.status(404).json({ error: 'Document introuvable' });
  docSvc.remove(+req.params.did);
  res.json({ ok: true });
});

// ── Maintenances ──────────────────────────────────────────────────────────────

router.get('/:id/maintenances', (req, res) => {
  if (!svc.getById(+req.params.id)) return res.status(404).json({ error: 'Équipement introuvable' });
  res.json(mainSvc.getByEquipement(+req.params.id));
});

router.post('/:id/maintenances', (req, res) => {
  if (!svc.getById(+req.params.id)) return res.status(404).json({ error: 'Équipement introuvable' });
  res.status(201).json(mainSvc.create(+req.params.id, req.body));
});

router.put('/:id/maintenances/:mid', (req, res) => {
  res.json(mainSvc.update(+req.params.mid, req.body));
});

router.delete('/:id/maintenances/:mid', (req, res) => {
  mainSvc.remove(+req.params.mid);
  res.json({ ok: true });
});

// ── Tags ──────────────────────────────────────────────────────────────────────

router.get('/:id/tags', (req, res) => {
  res.json(tagSvc.getByEquipement(+req.params.id));
});

router.post('/:id/tags/:tid', (req, res) => {
  tagSvc.addTag(+req.params.id, +req.params.tid);
  res.json({ ok: true });
});

router.delete('/:id/tags/:tid', (req, res) => {
  tagSvc.removeTag(+req.params.id, +req.params.tid);
  res.json({ ok: true });
});

// ── Clone ─────────────────────────────────────────────────────────────────────

router.post('/:id/clone', (req, res) => {
  const eq = svc.getById(+req.params.id);
  if (!eq) return res.status(404).json({ error: 'Équipement introuvable' });
  const { id, created_at, updated_at, utilisateur_nom, utilisateur_email, ...data } = eq;
  data.nom = `${eq.nom} (copie)`;
  data.numero_serie = null;
  const clone = svc.create(data, req.user.id);
  res.status(201).json(clone);
});

module.exports = router;
