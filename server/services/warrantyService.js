const https = require('https');
const http = require('http');

// In-memory token cache: { dell: { token, expiresAt }, hp: { token, expiresAt } }
const tokenCache = {};

function fetchJson(options, body = null) {
  return new Promise((resolve, reject) => {
    const lib = options.protocol === 'http:' ? http : https;
    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function getDellToken() {
  const cached = tokenCache.dell;
  if (cached && cached.expiresAt > Date.now()) return cached.token;

  const clientId = process.env.DELL_CLIENT_ID;
  const clientSecret = process.env.DELL_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('DELL_CLIENT_ID / DELL_CLIENT_SECRET non configurés');

  const body = `client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&grant_type=client_credentials`;
  const res = await fetchJson({
    hostname: 'apigtwb2c.us.dell.com',
    path: '/auth/oauth/v2/token',
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) },
  }, body);

  if (!res.body.access_token) throw new Error('Échec de l\'authentification Dell');
  tokenCache.dell = { token: res.body.access_token, expiresAt: Date.now() + (res.body.expires_in - 60) * 1000 };
  return tokenCache.dell.token;
}

async function getHpToken() {
  const cached = tokenCache.hp;
  if (cached && cached.expiresAt > Date.now()) return cached.token;

  const apiKey = process.env.HP_API_KEY;
  const apiSecret = process.env.HP_API_SECRET;
  if (!apiKey || !apiSecret) throw new Error('HP_API_KEY / HP_API_SECRET non configurés');

  const body = `grant_type=client_credentials&client_id=${encodeURIComponent(apiKey)}&client_secret=${encodeURIComponent(apiSecret)}`;
  const res = await fetchJson({
    hostname: 'css.api.hp.com',
    path: '/oauth/v1/token',
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) },
  }, body);

  if (!res.body.access_token) throw new Error('Échec de l\'authentification HP');
  tokenCache.hp = { token: res.body.access_token, expiresAt: Date.now() + (res.body.expires_in - 60) * 1000 };
  return tokenCache.hp.token;
}

async function lookupDell(serial) {
  const token = await getDellToken();
  const res = await fetchJson({
    hostname: 'apigtwb2c.us.dell.com',
    path: `/PROD/sbil/eapi/v5/asset-entitlements?servicetags=${encodeURIComponent(serial)}`,
    method: 'GET',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });

  if (res.status !== 200 || !Array.isArray(res.body) || !res.body[0]) {
    throw new Error('Réponse Dell invalide ou équipement introuvable');
  }

  const asset = res.body[0];
  const entitlements = asset.entitlements || [];
  let dateDebut = null;
  let dateFin = null;

  for (const e of entitlements) {
    const start = e.startDate ? e.startDate.split('T')[0] : null;
    const end = e.endDate ? e.endDate.split('T')[0] : null;
    if (!dateDebut || (start && start < dateDebut)) dateDebut = start;
    if (!dateFin || (end && end > dateFin)) dateFin = end;
  }

  return {
    date_garantie_debut: dateDebut,
    date_garantie_fin: dateFin,
    garantie_fournisseur: 'Dell',
    produit: asset.productLineDescription || asset.productLine || null,
  };
}

async function lookupHp(serial) {
  const token = await getHpToken();
  const body = JSON.stringify({ query: `{ productWarranty(serialNumber: "${serial}") { warrantyStartDate warrantyEndDate productName } }` });
  const res = await fetchJson({
    hostname: 'css.api.hp.com',
    path: '/css/api/product-warranty-api/queries',
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
  }, body);

  const warranty = res.body?.data?.productWarranty;
  if (!warranty) throw new Error('Réponse HP invalide ou équipement introuvable');

  return {
    date_garantie_debut: warranty.warrantyStartDate ? warranty.warrantyStartDate.split('T')[0] : null,
    date_garantie_fin: warranty.warrantyEndDate ? warranty.warrantyEndDate.split('T')[0] : null,
    garantie_fournisseur: 'HP',
    produit: warranty.productName || null,
  };
}

async function lookupLenovo(serial) {
  const clientId = process.env.LENOVO_CLIENT_ID;
  if (!clientId) throw new Error('LENOVO_CLIENT_ID non configuré');

  const res = await fetchJson({
    hostname: 'supportapi.lenovo.com',
    path: `/v2.5/warranty?serial=${encodeURIComponent(serial)}`,
    method: 'GET',
    headers: { ClientID: clientId, Accept: 'application/json' },
  });

  if (res.status !== 200 || !res.body) throw new Error('Réponse Lenovo invalide');

  const warranties = res.body.warranties || res.body.Warranties || [];
  let dateFin = null;
  let dateDebut = null;

  for (const w of warranties) {
    const start = w.Start || w.start;
    const end = w.End || w.end;
    if (!dateDebut || (start && start < dateDebut)) dateDebut = start ? start.split('T')[0] : null;
    if (!dateFin || (end && end > dateFin)) dateFin = end ? end.split('T')[0] : null;
  }

  return {
    date_garantie_debut: dateDebut,
    date_garantie_fin: dateFin,
    garantie_fournisseur: 'Lenovo',
    produit: res.body.productName || res.body.ProductName || null,
  };
}

async function lookupWarranty(fabricant, serial) {
  if (!fabricant || !serial) throw new Error('Fabricant et numéro de série requis');

  const fab = fabricant.toLowerCase();

  if (fab.includes('dell')) return await lookupDell(serial);
  if (fab.includes('hp') || fab.includes('hewlett')) return await lookupHp(serial);
  if (fab.includes('lenovo')) return await lookupLenovo(serial);
  if (fab.includes('apple')) return { manual: true, message: "Apple ne propose pas d'API publique. Vérifiez sur https://checkcoverage.apple.com" };

  return { unsupported: true, message: `Pas d'API de garantie disponible pour ${fabricant}` };
}

module.exports = { lookupWarranty };
