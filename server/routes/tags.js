const express = require('express');
const router = express.Router();
const { requireAuth } = require('../config/jwt');
const svc = require('../services/tagService');

router.use(requireAuth);

router.get('/', (req, res) => res.json(svc.getAll()));

router.post('/', (req, res) => {
  try { res.status(201).json(svc.create(req.body)); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id', (req, res) => {
  try { res.json(svc.update(+req.params.id, req.body)); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', (req, res) => {
  svc.remove(+req.params.id);
  res.json({ ok: true });
});

module.exports = router;
