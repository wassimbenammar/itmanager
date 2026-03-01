const express = require('express');
const router = express.Router();
const { requireAuth } = require('../config/jwt');
const svc = require('../services/fournisseurService');

router.use(requireAuth);

router.get('/', (req, res) => res.json(svc.list({ search: req.query.search })));

router.post('/', (req, res) => {
  try { res.status(201).json(svc.create(req.body, req.user.id)); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

router.get('/:id', (req, res) => {
  const f = svc.getById(+req.params.id);
  if (!f) return res.status(404).json({ error: 'Fournisseur introuvable' });
  res.json(f);
});

router.put('/:id', (req, res) => {
  try {
    const f = svc.update(+req.params.id, req.body, req.user.id);
    if (!f) return res.status(404).json({ error: 'Fournisseur introuvable' });
    res.json(f);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', (req, res) => {
  const f = svc.remove(+req.params.id, req.user.id);
  if (!f) return res.status(404).json({ error: 'Fournisseur introuvable' });
  res.json({ ok: true });
});

module.exports = router;
