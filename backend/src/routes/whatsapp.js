/**
 * Meta WhatsApp Cloud API webhook.
 *
 * GET  /api/webhooks/whatsapp  — one-time subscription check from Meta
 * POST /api/webhooks/whatsapp  — button taps (customer replies) and delivery
 *                                statuses of the messages we sent
 *
 * Meta retries any non-2xx answer for days, so the POST always answers 200
 * once the signature is valid, even when the payload is something we ignore.
 */
import { Router } from 'express';
import { store } from '../store/index.js';
import {
  REPLIES, STATE_LABEL, sendText, validSignature, verifyToken,
} from '../lib/whatsapp.js';

export const whatsappRoutes = Router();

whatsappRoutes.get('/webhooks/whatsapp', (req, res) => {
  const expected = verifyToken();
  if (expected && req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === expected) {
    res.type('text/plain').send(String(req.query['hub.challenge'] ?? ''));
    return;
  }
  res.sendStatus(403);
});

// Order of WhatsApp delivery statuses: a late "delivered" must not overwrite "read".
const RANK = { sent: 1, delivered: 2, read: 3, failed: 4 };

async function onStatus(s) {
  if (!s?.id) return;
  const order = await store.orders.find((o) => o.whatsapp?.messageId === s.id);
  if (!order) return;
  const current = order.whatsapp?.status;
  if ((RANK[s.status] || 0) <= (RANK[current] || 0)) return;
  await store.orders.update(order.reference, {
    whatsapp: {
      ...order.whatsapp,
      status: s.status,
      [`${s.status}At`]: new Date(Number(s.timestamp) * 1000 || Date.now()).toISOString(),
      ...(s.status === 'failed' ? { error: s.errors?.[0]?.title || s.errors?.[0]?.message || 'Échec' } : {}),
    },
  });
}

/** Payload of a template quick-reply ("button") or an interactive button reply. */
const payloadOf = (m) => m?.button?.payload || m?.interactive?.button_reply?.id || '';

async function onMessage(m) {
  const match = /^(CONFIRM|CANCEL):([A-Z0-9-]{3,40})$/.exec(payloadOf(m));
  if (!match) return; // free text: left for a human to read in WhatsApp
  const [, action, reference] = match;

  const order = await store.orders.get(reference);
  // The tap must come from the number the confirmation was sent to.
  if (!order || (order.whatsapp?.to && order.whatsapp.to !== m.from)) {
    console.warn('[whatsapp] réponse ignorée : %s depuis %s', reference, m.from);
    return;
  }

  const lang = order.locale === 'en' ? 'en' : 'fr';
  if (order.status !== 'nouvelle') {
    const label = STATE_LABEL[lang][order.status] || order.status;
    await sendText(m.from, REPLIES.already[lang](reference, label));
    return;
  }

  const now = new Date().toISOString();
  const next = action === 'CONFIRM' ? 'confirmee' : 'annulee';
  await store.orders.update(reference, {
    status: next,
    confirmation: { by: 'whatsapp', result: next, at: now },
    updatedAt: now,
  });
  console.log('[whatsapp] %s %s par le client', reference, next);

  const reply = next === 'confirmee' ? REPLIES.confirmed : REPLIES.cancelled;
  await sendText(m.from, reply[lang](reference));
}

whatsappRoutes.post('/webhooks/whatsapp', async (req, res) => {
  if (!validSignature(req.rawBody, req.get('x-hub-signature-256'))) {
    res.sendStatus(401);
    return;
  }
  res.sendStatus(200); // acknowledge first: Meta times out after a few seconds

  try {
    for (const entry of req.body?.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value ?? {};
        for (const s of value.statuses ?? []) await onStatus(s);
        for (const m of value.messages ?? []) await onMessage(m);
      }
    }
  } catch (e) {
    console.error('[whatsapp webhook]', e);
  }
});
