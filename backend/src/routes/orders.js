import { Router } from 'express';
import { requireAdmin, throttle } from '../auth.js';
import { store } from '../store/index.js';
import { buildOrder, STATUSES } from '../lib/order.js';
import { clean } from '../lib/text.js';
import { readSettings } from '../lib/settings.js';

/** Public: the checkout form only. */
export const orderRoutes = Router();

/** Admin: mounted under /api/admin, so every back-office URL shares one prefix. */
export const adminOrderRoutes = Router();

/**
 * Public checkout. The body is treated as untrusted: only the product
 * references and quantities survive, every price is read back from the
 * catalogue in buildOrder().
 */
orderRoutes.post('/orders', throttle({ tries: 6, windowMs: 60_000 }), async (req, res) => {
  try {
    const [catalogue, settings] = await Promise.all([store.products.all(), readSettings()]);
    const { error, order } = buildOrder(req.body, catalogue, settings);
    if (error) {
      res.status(400).json({ error });
      return;
    }

    const saved = await store.orders.create(order);
    console.log('[order] %s — %s — %d DH', saved.reference, saved.customer.name, saved.total);

    // The shop is told the reference and the total the server actually
    // charged, so a stale cart price is corrected on the confirmation screen.
    res.status(201).json({
      ok: true,
      reference: saved.reference,
      total: saved.total,
      shipping: saved.shipping,
      quoteOnly: saved.quoteOnly,
      rejected: saved.rejected,
    });
  } catch (e) {
    console.error('[orders POST]', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

adminOrderRoutes.get('/orders', requireAdmin, async (req, res) => {
  try {
    const status = clean(req.query.status, 20);
    const search = clean(req.query.q, 80).toLowerCase();

    let orders = (await store.orders.all())
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

    if (STATUSES.includes(status)) orders = orders.filter((o) => o.status === status);
    if (search) {
      orders = orders.filter((o) => [o.reference, o.customer?.name, o.customer?.phone, o.customer?.city]
        .some((v) => String(v ?? '').toLowerCase().includes(search)));
    }

    res.json({ orders, statuses: STATUSES });
  } catch (e) {
    console.error('[orders GET]', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

adminOrderRoutes.patch('/orders/:reference', requireAdmin, async (req, res) => {
  try {
    const status = clean(req.body?.status, 20);
    if (!STATUSES.includes(status)) {
      res.status(400).json({ error: `Statut inconnu. Attendu : ${STATUSES.join(', ')}.` });
      return;
    }
    const updated = await store.orders.update(req.params.reference, {
      status,
      adminNote: clean(req.body?.adminNote, 1000),
      updatedAt: new Date().toISOString(),
    });
    if (!updated) {
      res.status(404).json({ error: 'Commande introuvable' });
      return;
    }
    res.json({ ok: true, order: updated });
  } catch (e) {
    console.error('[order PATCH]', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
