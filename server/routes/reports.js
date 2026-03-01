const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { requireAuth } = require('../config/jwt');
const svc = require('../services/reportService');

router.use(requireAuth);

function sendCsv(res, filename, data) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\uFEFF' + data);
}

router.get('/inventory', (req, res) => {
  const rows = svc.inventoryReport();
  if (req.query.format === 'csv') {
    const cols = ['id','nom','type','fabricant','modele','numero_serie','statut','localisation','hostname','adresse_ip','adresse_mac','utilisateur_nom','fournisseur_nom','date_achat','prix_achat','date_garantie_fin','notes'];
    return sendCsv(res, 'inventaire.csv', svc.toCsv(rows, cols));
  }
  res.json(rows);
});

router.get('/warranty', (req, res) => {
  const rows = svc.warrantyReport();
  if (req.query.format === 'csv') return sendCsv(res, 'garanties.csv', svc.toCsv(rows));
  res.json(rows);
});

router.get('/licences', (req, res) => {
  const rows = svc.licenseReport();
  if (req.query.format === 'csv') return sendCsv(res, 'licences.csv', svc.toCsv(rows));
  res.json(rows);
});

router.get('/maintenances', (req, res) => {
  const rows = svc.maintenanceReport();
  if (req.query.format === 'csv') return sendCsv(res, 'maintenances.csv', svc.toCsv(rows));
  res.json(rows);
});

module.exports = router;
