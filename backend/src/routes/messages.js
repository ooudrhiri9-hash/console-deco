import { Router } from 'express';
import { requireAdmin, throttle } from '../auth.js';
import { store } from '../store/index.js';
import { clean, reference } from '../lib/text.js';

/** Public: the contact form only. */
export const messageRoutes = Router();

/** Admin: mounted under /api/admin. */
export const adminMessageRoutes = Router();

/** Public contact form. Replaces public/api/contact.php. */
messageRoutes.post('/messages', throttle({ tries: 6, windowMs: 60_000 }), async (req, res) => {
  try {
    const body = req.body || {};

    // Honeypot: a field hidden in the form. A human never fills it, a bot does.
    if (clean(body.company, 100)) {
      res.status(201).json({ ok: true });
      return;
    }

    const message = {
      id: reference('MSG'),
      name: clean(body.name, 120),
      email: clean(body.email, 160),
      phone: clean(body.phone, 40),
      subject: clean(body.subject, 160),
      body: clean(body.message, 4000),
      locale: body.locale === 'en' ? 'en' : 'fr',
      read: false,
      createdAt: new Date().toISOString(),
    };

    if (!message.name || !message.body) {
      res.status(400).json({ error: 'Le nom et le message sont obligatoires.' });
      return;
    }
    if (!message.email && !message.phone) {
      res.status(400).json({ error: 'Laissez un e-mail ou un téléphone pour la réponse.' });
      return;
    }

    await store.messages.create(message);
    res.status(201).json({ ok: true, id: message.id });
  } catch (e) {
    console.error('[messages POST]', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

adminMessageRoutes.get('/messages', requireAdmin, async (req, res) => {
  try {
    const messages = (await store.messages.all())
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    res.json({ messages });
  } catch (e) {
    console.error('[messages GET]', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

adminMessageRoutes.patch('/messages/:id', requireAdmin, async (req, res) => {
  const updated = await store.messages.update(req.params.id, { read: req.body?.read !== false });
  if (!updated) {
    res.status(404).json({ error: 'Message introuvable' });
    return;
  }
  res.json({ ok: true, message: updated });
});

adminMessageRoutes.delete('/messages/:id', requireAdmin, async (req, res) => {
  const done = await store.messages.remove(req.params.id);
  if (!done) {
    res.status(404).json({ error: 'Message introuvable' });
    return;
  }
  res.json({ ok: true });
});
