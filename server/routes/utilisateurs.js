const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../config/jwt');
const svc = require('../services/utilisateurService');

router.use(requireAuth);

router.get('/', (req, res) => {
  const { search, departement, role, actif, page, limit } = req.query;
  res.json(svc.list({
    search, departement, role,
    actif: actif !== undefined ? actif === 'true' : undefined,
    page: +page || 1, limit: +limit || 20
  }));
});

router.post('/', requireRole('admin', 'it_staff'), async (req, res) => {
  try {
    const u = await svc.create(req.body, req.user.id);
    res.status(201).json(u);
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return res.status(409).json({ error: 'Nom d\'utilisateur ou email déjà existant' });
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  const u = svc.getById(+req.params.id);
  if (!u) return res.status(404).json({ error: 'Utilisateur introuvable' });
  res.json(u);
});

router.put('/:id', requireRole('admin', 'it_staff'), async (req, res) => {
  try {
    const u = await svc.update(+req.params.id, req.body, req.user.id);
    if (!u) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(u);
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return res.status(409).json({ error: 'Nom d\'utilisateur ou email déjà existant' });
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  if (+req.params.id === req.user.id) return res.status(400).json({ error: 'Impossible de supprimer votre propre compte' });
  const u = svc.remove(+req.params.id, req.user.id);
  if (!u) return res.status(404).json({ error: 'Utilisateur introuvable' });
  res.json({ ok: true });
});

router.get('/:id/equipements', (req, res) => {
  res.json(svc.getEquipements(+req.params.id));
});

router.get('/:id/licences', (req, res) => {
  res.json(svc.getLicences(+req.params.id));
});

router.get('/:id/comptes', (req, res) => {
  res.json(svc.getComptes(+req.params.id));
});

module.exports = router;
