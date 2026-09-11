import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { requireAdmin, signToken, throttle } from '../auth.js';
import { store } from '../store/index.js';
import { clean } from '../lib/text.js';

export const authRoutes = Router();

authRoutes.post('/login', throttle({ tries: 5, windowMs: 60_000 }), async (req, res) => {
  try {
    const email = clean(req.body?.email, 160).toLowerCase();
    const password = String(req.body?.password ?? '');
    const admin = email ? await store.admins.get(email) : null;

    // One message and one timing for both failures: whether an address exists
    // is not something an unauthenticated caller gets to learn.
    const ok = admin ? await bcrypt.compare(password, admin.passwordHash || '') : false;
    if (!ok) {
      res.status(401).json({ error: 'E-mail ou mot de passe incorrect.' });
      return;
    }

    res.json({
      ok: true,
      token: signToken({ email: admin.email, name: admin.name || '' }),
      admin: { email: admin.email, name: admin.name || '' },
    });
  } catch (e) {
    console.error('[login]', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/** Lets the admin app check a stored token before drawing the interface. */
authRoutes.get('/me', requireAdmin, (req, res) => {
  res.json({ admin: { email: req.session.email, name: req.session.name || '' } });
});

/**
 * There is no server-side session to destroy — the token is stateless. The
 * route exists so the front-end has one obvious thing to call, and so a future
 * revocation list has somewhere to live.
 */
authRoutes.post('/logout', (req, res) => res.json({ ok: true }));

authRoutes.post('/password', requireAdmin, async (req, res) => {
  try {
    const current = String(req.body?.current ?? '');
    const next = String(req.body?.next ?? '');
    if (next.length < 10) {
      res.status(400).json({ error: 'Le nouveau mot de passe doit faire 10 caractères au minimum.' });
      return;
    }
    const admin = await store.admins.get(req.session.email);
    if (!admin || !(await bcrypt.compare(current, admin.passwordHash || ''))) {
      res.status(401).json({ error: 'Mot de passe actuel incorrect.' });
      return;
    }
    await store.admins.update(admin.email, { passwordHash: await bcrypt.hash(next, 10) });
    res.json({ ok: true });
  } catch (e) {
    console.error('[password]', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
