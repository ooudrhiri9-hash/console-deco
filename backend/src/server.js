/**
 * Atelier Omar API.
 *
 * Back office for a shop that is published as static HTML on shared hosting.
 * No page is rendered here: the API serves the catalogue, takes orders and
 * contact messages, and backs the /admin screens.
 */
import './env.js';

import express from 'express';
import cors from 'cors';

import { env, envInt } from './env.js';
import { connectStore } from './store/index.js';
import { authRoutes } from './routes/auth.js';
import { catalogueRoutes } from './routes/catalogue.js';
import { productRoutes } from './routes/products.js';
import { categoryRoutes } from './routes/categories.js';
import { adminOrderRoutes, orderRoutes } from './routes/orders.js';
import { adminMessageRoutes, messageRoutes } from './routes/messages.js';
import { settingsRoutes } from './routes/settings.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { uploadRoutes, UPLOAD_DIR } from './routes/uploads.js';

const app = express();

// Behind a hosting proxy req.ip is the proxy for everyone, which would turn
// the per-IP throttles into one global limit shared by all visitors.
app.set('trust proxy', 1);
app.disable('x-powered-by');

/**
 * The shop is served from another domain, so without an allow-list the browser
 * blocks every call. ALLOWED_ORIGINS is comma-separated; a missing production
 * domain here is the first thing to check when the live site shows no products.
 */
const allowed = env('ALLOWED_ORIGINS')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(cors({
  origin(origin, done) {
    // No Origin header: server-to-server (the build script, curl). Allowed —
    // these carry no browser credentials for CORS to protect.
    if (!origin) return done(null, true);
    if (allowed.includes(origin.replace(/\/$/, ''))) return done(null, true);
    return done(new Error(`Origine non autorisée : ${origin}`));
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

app.use(express.json({ limit: '1mb' }));

// Uploaded photos. Long cache: the filename carries a timestamp, so a changed
// photo is a new URL and never a stale one.
app.use('/uploads', express.static(UPLOAD_DIR, {
  maxAge: '30d',
  immutable: true,
  fallthrough: true,
}));

/** Health probe for the host. Deliberately does not touch the database. */
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'atelier-omar-api', time: new Date().toISOString() });
});

app.use('/api/admin', authRoutes);
app.use('/api/admin', productRoutes);
app.use('/api/admin', categoryRoutes);
app.use('/api/admin', settingsRoutes);
app.use('/api/admin', dashboardRoutes);
app.use('/api/admin', adminOrderRoutes);
app.use('/api/admin', adminMessageRoutes);
app.use('/api/admin', uploadRoutes);

app.use('/api', catalogueRoutes);
app.use('/api', orderRoutes);
app.use('/api', messageRoutes);

app.use((req, res) => res.status(404).json({ error: 'Route inconnue' }));

// Last net: an uncaught throw must leave as JSON. Express' default HTML error
// page would be parsed as a response body by the admin app and reported as
// "unexpected token <".
app.use((err, req, res, next) => {
  console.error('[error]', err);
  const corsRefusal = /Origine non autoris/.test(err?.message || '');
  res.status(corsRefusal ? 403 : 500)
    .json({ error: corsRefusal ? err.message : 'Erreur serveur' });
});

const PORT = envInt('PORT', 4400);

connectStore()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API Atelier Omar — http://localhost:${PORT}`);
      console.log(allowed.length
        ? `Origines autorisées : ${allowed.join(', ')}`
        : 'Aucune origine déclarée : seuls les appels sans en-tête Origin passeront.');
    });
  })
  .catch((e) => {
    console.error('[boot] impossible de joindre la base :', e.message);
    process.exit(1);
  });
