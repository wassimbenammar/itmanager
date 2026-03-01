const express = require('express');
const router = express.Router();
const { requireAuth } = require('../config/jwt');
const svc = require('../services/dashboardService');

router.get('/', requireAuth, (req, res) => {
  res.json(svc.getStats());
});

module.exports = router;
