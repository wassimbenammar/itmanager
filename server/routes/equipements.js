const express = require('express');
const router = express.Router();
const { requireAuth } = require('../config/jwt');
const svc = require('../services/equipementService');
const { lookupWarranty } = require('../services/warrantyService');

router.use(requireAuth);

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

module.exports = router;
