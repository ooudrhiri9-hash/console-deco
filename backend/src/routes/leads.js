import { Router } from 'express';
import { requireAdmin, throttle } from '../auth.js';
import { store } from '../store/index.js';
import { clean } from '../lib/text.js';

/**
 * WhatsApp clicks from the shop.
 *
 * Every WhatsApp button adds « [Réf. MD-XXXX] » to the pre-filled message and
 * posts that reference here with Meta's browser ids (_fbp, _fbc). When the
 * chat turns into a sale, Omar types the reference in /admin and the order
 * inherits those ids — the only link between an ad click and a WhatsApp sale.
 */
export const leadRoutes = Router();
export const adminLeadRoutes = Router();

export const LEAD_REF = /^MD-[A-HJ-NP-Z2-9]{4}$/;

const CHANNELS = ['whatsapp_float', 'whatsapp_checkout', 'whatsapp_contact', 'whatsapp_other'];

/** _fbp / _fbc as the pixel writes them: fb.<n>.<timestamp>.<value>. */
export const fbId = (v) => {
  const s = clean(v, 300);
  return /^fb\.\d\.\d{10,13}\.[\w.-]{1,250}$/.test(s) ? s : '';
};

leadRoutes.post('/leads', throttle({ tries: 20, windowMs: 60_000 }), async (req, res) => {
  try {
    const ref = clean(req.body?.ref, 12).toUpperCase();
    if (!LEAD_REF.test(ref)) {
      res.status(400).json({ error: 'Référence invalide' });
      return;
    }
    // A second click with the same reference (double tap) keeps the first.
    if (await store.leads.get(ref)) {
      res.status(200).json({ ok: true });
      return;
    }
    const channel = CHANNELS.includes(req.body?.channel) ? req.body.channel : 'whatsapp_other';
    await store.leads.create({
      ref,
      channel,
      page: clean(req.body?.page, 300),
      fbp: fbId(req.body?.fbp),
      fbc: fbId(req.body?.fbc),
      ip: req.ip || '',
      userAgent: clean(req.get('user-agent'), 400),
      createdAt: new Date().toISOString(),
    });
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error('[leads POST]', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/** Admin: look a reference up while typing it in the WhatsApp order form. */
adminLeadRoutes.get('/leads/:ref', requireAdmin, async (req, res) => {
  try {
    const lead = await store.leads.get(clean(req.params.ref, 12).toUpperCase());
    if (!lead) {
      res.status(404).json({ error: 'Référence inconnue' });
      return;
    }
    res.json({
      lead: {
        ref: lead.ref,
        channel: lead.channel,
        page: lead.page,
        createdAt: lead.createdAt,
        // What the admin needs to know, not the ids themselves.
        fromMetaAd: Boolean(lead.fbc),
        hasBrowserId: Boolean(lead.fbp),
      },
    });
  } catch (e) {
    console.error('[lead GET]', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
