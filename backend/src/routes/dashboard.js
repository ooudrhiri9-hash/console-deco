import { Router } from 'express';
import { requireAdmin } from '../auth.js';
import { store } from '../store/index.js';
import { OPEN_STATUSES } from '../lib/order.js';

export const dashboardRoutes = Router();

const DAYS = 14;

/** yyyy-mm-dd keys for the last N days, oldest first. */
function lastDays(n) {
  const out = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

/**
 * Ce qui attend quelqu'un, et rien d'autre.
 *
 * Le back-office interroge cette route toutes les 30 s. `/dashboard` calcule un
 * chiffre d'affaires, un panier moyen et quatorze jours d'histogramme : le
 * relancer en boucle pour savoir s'il y a une commande de plus serait payer
 * cher une question simple.
 *
 * `latest` sert a distinguer « une commande de plus » d'un simple rafraichissement :
 * le client compare la reference, pas seulement le compte, car une commande
 * confirmee dans un autre onglet fait baisser le compte sans qu'il se passe
 * rien de neuf.
 */
dashboardRoutes.get('/pending', requireAdmin, async (req, res) => {
  try {
    const [orders, messages] = await Promise.all([store.orders.all(), store.messages.all()]);
    const nouvelles = orders
      .filter((o) => o.status === 'nouvelle')
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

    res.json({
      orders: nouvelles.length,
      messages: messages.filter((m) => !m.read).length,
      latest: nouvelles[0]
        ? {
            reference: nouvelles[0].reference,
            name: nouvelles[0].customer?.name || '',
            total: nouvelles[0].total || 0,
            quoteOnly: Boolean(nouvelles[0].quoteOnly),
            createdAt: nouvelles[0].createdAt,
          }
        : null,
    });
  } catch (e) {
    console.error('[pending]', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

dashboardRoutes.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const [products, categories, orders, messages] = await Promise.all([
      store.products.all(),
      store.categories.all(),
      store.orders.all(),
      store.messages.all(),
    ]);

    const live = products.filter((p) => p.active !== false);
    const billable = orders.filter((o) => o.status !== 'annulee');
    const revenue = billable.reduce((n, o) => n + (o.total || 0), 0);

    // One bucket per day so the chart has a flat line where nothing sold,
    // instead of silently closing the gap and overstating the trend.
    const buckets = Object.fromEntries(lastDays(DAYS).map((d) => [d, { orders: 0, revenue: 0 }]));
    for (const o of billable) {
      const day = String(o.createdAt || '').slice(0, 10);
      if (buckets[day]) {
        buckets[day].orders += 1;
        buckets[day].revenue += o.total || 0;
      }
    }

    res.json({
      stats: {
        products: products.length,
        productsLive: live.length,
        productsWithoutPrice: live.filter((p) => !p.price).length,
        productsWithoutImage: live.filter((p) => !(p.images || []).length).length,
        categories: categories.length,
        orders: orders.length,
        ordersOpen: orders.filter((o) => OPEN_STATUSES.includes(o.status)).length,
        revenue,
        averageBasket: billable.length ? Math.round(revenue / billable.length) : 0,
        messagesUnread: messages.filter((m) => !m.read).length,
      },
      chart: Object.entries(buckets).map(([day, v]) => ({ day, ...v })),
      recentOrders: orders
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
        .slice(0, 6),
    });
  } catch (e) {
    console.error('[dashboard]', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
