'use strict';

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const apiRouter = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 4000;
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || '*';
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false })); // CSP left to a reverse proxy/CDN in real deployments
app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json({ limit: '50kb' })); // small, fixed-shape payloads only - guards against oversized bodies
app.use(express.static(FRONTEND_DIR)); // serves index.html, styles.css, app.js as one deployable unit

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // generous for a calculator used interactively, tight enough to deter abuse
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', limiter, apiRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Centralized error handler - never leak stack traces to clients.
app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Carbon Footprint API listening on port ${PORT}`);
  });
}

module.exports = app;
