const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const equipementsRoutes = require('./routes/equipements');
const logicielsRoutes = require('./routes/logiciels');
const comptesRoutes = require('./routes/comptes');
const utilisateursRoutes = require('./routes/utilisateurs');
const dashboardRoutes = require('./routes/dashboard');
const notificationsRoutes = require('./routes/notifications');
const auditRoutes = require('./routes/audit');
const searchRoutes = require('./routes/search');

function createApp() {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          fontSrc: ["'self'", 'data:'],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
        },
      },
    })
  );

  app.use(
    cors({
      origin: process.env.NODE_ENV === 'production'
        ? (process.env.CORS_ORIGIN || false)
        : true,
      credentials: true,
    })
  );

  app.use(express.json({ limit: '5mb' }));

  const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, message: { error: 'Trop de tentatives, réessayez dans une minute' } });
  const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 500 });

  app.use('/api', apiLimiter);
  app.use('/api/auth/login', authLimiter);

  app.use('/api/auth', authRoutes);
  app.use('/api/equipements', equipementsRoutes);
  app.use('/api/logiciels', logicielsRoutes);
  app.use('/api/comptes', comptesRoutes);
  app.use('/api/utilisateurs', utilisateursRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/audit', auditRoutes);
  app.use('/api/search', searchRoutes);

  if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    const clientDist = path.join(__dirname, '../client/dist');
    app.use(express.static(clientDist));
    app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  }

  app.use((err, req, res, _next) => {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  });

  return app;
}

module.exports = createApp;
