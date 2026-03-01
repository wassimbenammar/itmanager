const express = require('express');
const router = express.Router();
const { requireAuth } = require('../config/jwt');
const svc = require('../services/logicielService');

router.use(requireAuth);

router.get('/', (req, res) => {
  const { search, type_licence, page, limit } = req.query;
  res.json(svc.list({ search, type_licence, page: +page || 1, limit: +limit || 20 }));
});

router.post('/', (req, res) => {
  try {
    res.status(201).json(svc.create(req.body, req.user.id));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  const log = svc.getById(+req.params.id);
  if (!log) return res.status(404).json({ error: 'Logiciel introuvable' });
  res.json(log);
});

router.put('/:id', (req, res) => {
  const log = svc.update(+req.params.id, req.body, req.user.id);
  if (!log) return res.status(404).json({ error: 'Logiciel introuvable' });
  res.json(log);
});

router.delete('/:id', (req, res) => {
  const log = svc.remove(+req.params.id, req.user.id);
  if (!log) return res.status(404).json({ error: 'Logiciel introuvable' });
  res.json({ ok: true });
});

router.get('/:id/attributions', (req, res) => {
  res.json(svc.getAttributions(+req.params.id));
});

router.post('/:id/attributions', (req, res) => {
  const { utilisateur_id, notes } = req.body;
  if (!utilisateur_id) return res.status(400).json({ error: 'utilisateur_id requis' });
  try {
    svc.addAttribution(+req.params.id, utilisateur_id, notes, req.user.id);
    res.status(201).json({ ok: true });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return res.status(409).json({ error: 'Licence déjà attribuée à cet utilisateur' });
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id/attributions/:userId', (req, res) => {
  svc.removeAttribution(+req.params.id, +req.params.userId, req.user.id);
  res.json({ ok: true });
});

module.exports = router;
