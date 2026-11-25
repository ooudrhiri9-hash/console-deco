import { Router } from 'express';
import { requireAdmin, throttle } from '../auth.js';
import { store } from '../store/index.js';
import { buildOrder, STATUSES } from '../lib/order.js';
import { clean, int, reference } from '../lib/text.js';
import { readSettings } from '../lib/settings.js';
import { sendOrderConfirmation, whatsappEnabled } from '../lib/whatsapp.js';
import { capiEnabled, purchaseEvent, sendEvent } from '../lib/capi.js';
import { fbId, LEAD_REF } from './leads.js';

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

    // Meta's browser ids, read by the shop from its cookies. Kept on the order
    // so the server-side Purchase matches the same visitor as the pixel.
    const t = req.body?.tracking || {};
    order.tracking = {
      fbp: fbId(t.fbp),
      fbc: fbId(t.fbc),
      pageUrl: /^https:\/\/(www\.)?maisondeco\.ma\//.test(String(t.pageUrl || '')) ? clean(t.pageUrl, 300) : '',
    };

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

    // After the response: the customer never waits on Meta. A quote has no
    // price to confirm yet — the workshop calls first, then sends it by hand.
    // A quote has no value yet, and Meta requires one on a Purchase.
    if (!saved.quoteOnly) {
      await sendPurchase(saved, { source: 'website', ip: req.ip, userAgent: req.get('user-agent') });
      await notifyWhatsApp(saved);
    }
  } catch (e) {
    console.error('[orders POST]', e);
    if (!res.headersSent) res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * Sends the order to Meta's Conversions API and records the outcome on the
 * order (`capi.purchase`). Never throws.
 */
async function sendPurchase(order, options) {
  try {
    const purchase = await sendEvent(purchaseEvent(order, options));
    if (purchase.status === 'failed') console.error('[capi] %s — %s', order.reference, purchase.error);
    return await store.orders.update(order.reference, { capi: { ...(order.capi || {}), purchase } });
  } catch (e) {
    console.error('[capi] %s', order.reference, e);
    return null;
  }
}

/** A WhatsApp sale reaches Meta once, when it is delivered — i.e. paid. */
const shouldReportChatSale = (order) =>
  order.channel === 'whatsapp' && order.status === 'livree' && order.capi?.purchase?.status !== 'sent';

/**
 * Admin: record a sale closed on WhatsApp.
 *
 * The chat carries « [Réf. MD-XXXX] » when the customer came from a button on
 * the site; that reference pulls the visitor's Meta ids from the click.
 */
adminOrderRoutes.post('/orders/whatsapp', requireAdmin, async (req, res) => {
  try {
    const b = req.body || {};
    const c = b.customer || {};
    const customer = {
      name: clean(c.name, 120),
      phone: clean(c.phone, 40),
      email: '',
      city: clean(c.city, 80),
      address: clean(c.address, 400),
      notes: '',
    };
    if (!customer.name) return void res.status(400).json({ error: 'Le nom est obligatoire.' });
    if (customer.phone.replace(/\D/g, '').length < 9) {
      return void res.status(400).json({ error: 'Numéro de téléphone invalide.' });
    }
    const description = clean(b.description, 300);
    if (!description) return void res.status(400).json({ error: 'Décrivez ce qui a été commandé.' });
    const qty = int(b.qty, { min: 1, max: 99, fallback: 1 });
    const total = int(b.total, { min: 0, max: 1_000_000, fallback: 0 });
    if (!total) return void res.status(400).json({ error: 'Le montant est obligatoire.' });

    // Accepts « MD-7K2M », « Réf. MD-7K2M » or « [Réf. MD-7K2M] » pasted from the chat.
    const leadRef = (clean(b.leadRef, 30).toUpperCase().match(/MD-[A-Z0-9]{4}/) || [''])[0];
    if (clean(b.leadRef, 30) && !LEAD_REF.test(leadRef)) {
      return void res.status(400).json({ error: 'Référence WhatsApp invalide (format MD-XXXX).' });
    }
    const lead = leadRef ? await store.leads.get(leadRef) : null;

    const status = b.status === 'livree' ? 'livree' : 'confirmee';
    const now = new Date().toISOString();
    const order = {
      reference: reference('WA'),
      locale: 'fr',
      channel: 'whatsapp',
      customer,
      items: [{
        id: 'WHATSAPP',
        slug: '',
        name: { fr: description, en: description },
        qty,
        price: Math.round(total / qty),
        lineTotal: total,
      }],
      subtotal: total,
      shipping: 0,
      total,
      payment: 'cod',
      quoteOnly: false,
      rejected: [],
      status,
      adminNote: clean(b.adminNote, 1000),
      ...(leadRef ? { leadRef } : {}),
      tracking: lead ? { fbp: lead.fbp || '', fbc: lead.fbc || '', pageUrl: lead.page || '' } : {},
      createdAt: now,
      updatedAt: now,
    };

    let saved = await store.orders.create(order);
    console.log('[order] %s — WhatsApp — %d DH%s', saved.reference, saved.total, lead ? ` — réf. ${leadRef}` : '');
    if (shouldReportChatSale(saved)) {
      saved = (await sendPurchase(saved, { source: 'chat', eventTime: now })) || saved;
    }
    res.status(201).json({
      ok: true,
      order: saved,
      lead: leadRef ? { found: Boolean(lead), fromMetaAd: Boolean(lead?.fbc) } : null,
      capiEnabled: capiEnabled(),
    });
  } catch (e) {
    console.error('[orders WhatsApp POST]', e);
    if (!res.headersSent) res.status(500).json({ error: 'Erreur serveur' });
  }
});

/** Admin: retry sending a delivered WhatsApp sale to Meta after a failure. */
adminOrderRoutes.post('/orders/:reference/meta', requireAdmin, async (req, res) => {
  try {
    const order = await store.orders.get(req.params.reference);
    if (!order) return void res.status(404).json({ error: 'Commande introuvable' });
    if (!shouldReportChatSale(order)) {
      return void res.status(400).json({ error: 'Seule une vente WhatsApp livrée et pas encore envoyée peut partir chez Meta.' });
    }
    const updated = await sendPurchase(order, { source: 'chat', eventTime: new Date() });
    res.json({ ok: updated?.capi?.purchase?.status === 'sent', order: updated || order });
  } catch (e) {
    console.error('[order meta]', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/** Sends the confirmation template and records the outcome on the order. */
async function notifyWhatsApp(order) {
  try {
    const whatsapp = await sendOrderConfirmation(order);
    return await store.orders.update(order.reference, { whatsapp });
  } catch (e) {
    console.error('[whatsapp] %s', order.reference, e);
    return null;
  }
}

/** Admin: (re)send the WhatsApp confirmation, e.g. after fixing the phone number. */
adminOrderRoutes.post('/orders/:reference/whatsapp', requireAdmin, async (req, res) => {
  try {
    const order = await store.orders.get(req.params.reference);
    if (!order) {
      res.status(404).json({ error: 'Commande introuvable' });
      return;
    }
    if (!whatsappEnabled()) {
      res.status(400).json({ error: 'WhatsApp n\'est pas configuré sur le serveur.' });
      return;
    }
    if (order.status !== 'nouvelle') {
      res.status(400).json({ error: 'Seule une commande « nouvelle » peut être confirmée par WhatsApp.' });
      return;
    }
    const updated = await notifyWhatsApp(order);
    if (updated?.whatsapp?.status === 'failed') {
      res.status(502).json({ error: `Envoi WhatsApp échoué : ${updated.whatsapp.error}`, order: updated });
      return;
    }
    res.json({ ok: true, order: updated });
  } catch (e) {
    console.error('[order whatsapp]', e);
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
    let updated = await store.orders.update(req.params.reference, {
      status,
      adminNote: clean(req.body?.adminNote, 1000),
      updatedAt: new Date().toISOString(),
    });
    if (!updated) {
      res.status(404).json({ error: 'Commande introuvable' });
      return;
    }
    // Marking a WhatsApp sale « Livrée » is what reports it to Meta.
    if (shouldReportChatSale(updated)) {
      updated = (await sendPurchase(updated, { source: 'chat', eventTime: new Date() })) || updated;
    }
    res.json({ ok: true, order: updated });
  } catch (e) {
    console.error('[order PATCH]', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

adminOrderRoutes.delete('/orders/:reference', requireAdmin, async (req, res) => {
  try {
    const done = await store.orders.remove(req.params.reference);
    if (!done) {
      res.status(404).json({ error: 'Commande introuvable' });
      return;
    }
    console.log('[order] %s supprimée', req.params.reference);
    res.json({ ok: true });
  } catch (e) {
    console.error('[order DELETE]', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
