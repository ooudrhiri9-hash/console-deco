import { Router } from 'express';
import { requireAdmin } from '../auth.js';
import { store } from '../store/index.js';
import { normaliseSettings, readSettings } from '../lib/settings.js';

export const settingsRoutes = Router();

settingsRoutes.get('/settings', requireAdmin, async (req, res) => {
  try {
    res.json({ settings: await readSettings() });
  } catch (e) {
    console.error('[settings GET]', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

settingsRoutes.put('/settings', requireAdmin, async (req, res) => {
  try {
    const next = normaliseSettings(req.body || {}, await readSettings());
    await store.settings.write(next);
    res.json({ ok: true, settings: next });
  } catch (e) {
    console.error('[settings PUT]', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
