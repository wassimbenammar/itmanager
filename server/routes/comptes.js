const express = require('express');
const router = express.Router();
const { requireAuth } = require('../config/jwt');
const svc = require('../services/compteService');

router.use(requireAuth);

router.get('/', (req, res) => {
  const { service, actif, search, utilisateur_id, page, limit } = req.query;
  res.json(svc.list({
    service, search, utilisateur_id: utilisateur_id ? +utilisateur_id : undefined,
    actif: actif !== undefined ? actif === 'true' : undefined,
    page: +page || 1, limit: +limit || 20
  }));
});

router.post('/', (req, res) => {
  try {
    res.status(201).json(svc.create({ ...req.body, actif: req.body.actif !== false ? 1 : 0 }, req.user.id));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  const c = svc.getById(+req.params.id);
  if (!c) return res.status(404).json({ error: 'Compte introuvable' });
  res.json(c);
});

router.put('/:id', (req, res) => {
  const c = svc.update(+req.params.id, { ...req.body, actif: req.body.actif ? 1 : 0 }, req.user.id);
  if (!c) return res.status(404).json({ error: 'Compte introuvable' });
  res.json(c);
});

router.delete('/:id', (req, res) => {
  const c = svc.remove(+req.params.id, req.user.id);
  if (!c) return res.status(404).json({ error: 'Compte introuvable' });
  res.json({ ok: true });
});

module.exports = router;
