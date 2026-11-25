/**
 * WhatsApp order confirmation, through Meta's WhatsApp Cloud API.
 *
 * A new order triggers an approved template message with two quick-reply
 * buttons ("Confirmer" / "Annuler"). The customer's tap comes back on the
 * webhook (routes/whatsapp.js) carrying a payload like "CONFIRM:CMD-8F3K2Q",
 * which moves the order to "confirmee" or "annulee".
 *
 * Everything here is optional: with WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID
 * unset the module is disabled, orders are taken exactly as before, and the
 * admin shows "WhatsApp non configuré".
 */
import crypto from 'node:crypto';
import { env } from '../env.js';

const config = () => ({
  // Overridable only so tests can point at a fake Graph server.
  graph: env('WHATSAPP_GRAPH_URL', 'https://graph.facebook.com'),
  token: env('WHATSAPP_TOKEN'),
  phoneNumberId: env('WHATSAPP_PHONE_NUMBER_ID'),
  appSecret: env('WHATSAPP_APP_SECRET'),
  verifyToken: env('WHATSAPP_VERIFY_TOKEN'),
  version: env('WHATSAPP_API_VERSION', 'v21.0'),
  template: env('WHATSAPP_TEMPLATE_CONFIRM', 'confirmation_commande'),
  // Languages the template was approved in, e.g. "fr,en". The first is the fallback.
  languages: env('WHATSAPP_TEMPLATE_LANGS', 'fr').split(',').map((s) => s.trim()).filter(Boolean),
});

export const whatsappEnabled = () => {
  const c = config();
  return Boolean(c.token && c.phoneNumberId);
};

export const verifyToken = () => config().verifyToken;

/**
 * Moroccan numbers to the international digits WhatsApp expects.
 *   06 12 34 56 78 → 212612345678
 *   +212 6…, 00212 6… → 212612345678
 * Anything already international (another country code) is kept as digits.
 * Returns '' when the number cannot be a mobile.
 */
export function toWhatsAppNumber(raw) {
  let d = String(raw ?? '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 10 && d.startsWith('0')) d = `212${d.slice(1)}`;
  if (d.length === 9 && /^[5-7]/.test(d)) d = `212${d}`;
  return d.length >= 11 && d.length <= 15 ? d : '';
}

/** Constant-time check of Meta's X-Hub-Signature-256 header against the raw body. */
export function validSignature(rawBody, header) {
  const secret = config().appSecret;
  if (!secret || !rawBody || !header?.startsWith('sha256=')) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const given = header.slice(7);
  return given.length === expected.length
    && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

async function graph(body) {
  const c = config();
  const res = await fetch(`${c.graph}/${c.version}/${c.phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${c.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...body }),
    signal: AbortSignal.timeout(15_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data?.error;
    throw new Error(err ? `${err.code ?? res.status} ${err.message}` : `HTTP ${res.status}`);
  }
  return data;
}

const money = (n) => new Intl.NumberFormat('fr-MA').format(n);

/**
 * Sends the confirmation template for one order.
 *
 * Template body (see docs/WHATSAPP-CONFIRMATION.md):
 *   {{1}} customer name · {{2}} order reference · {{3}} total in DH
 * Buttons 0 and 1 are quick replies; their payload is set per message so the
 * webhook knows which order the tap belongs to.
 *
 * @returns the `whatsapp` sub-document to store on the order
 */
export async function sendOrderConfirmation(order) {
  const now = new Date().toISOString();
  if (!whatsappEnabled()) return { status: 'disabled', at: now };

  const to = toWhatsAppNumber(order.customer?.phone);
  if (!to) return { status: 'failed', at: now, error: 'Numéro non valide pour WhatsApp' };

  const { template, languages } = config();
  const language = languages.includes(order.locale) ? order.locale : languages[0] || 'fr';
  const firstName = String(order.customer?.name || '').split(/\s+/)[0] || 'Client';

  try {
    const data = await graph({
      to,
      type: 'template',
      template: {
        name: template,
        language: { code: language },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: firstName },
              { type: 'text', text: order.reference },
              { type: 'text', text: money(order.total) },
            ],
          },
          {
            type: 'button', sub_type: 'quick_reply', index: '0',
            parameters: [{ type: 'payload', payload: `CONFIRM:${order.reference}` }],
          },
          {
            type: 'button', sub_type: 'quick_reply', index: '1',
            parameters: [{ type: 'payload', payload: `CANCEL:${order.reference}` }],
          },
        ],
      },
    });
    return { status: 'sent', at: now, to, messageId: data?.messages?.[0]?.id || '' };
  } catch (e) {
    console.error('[whatsapp] %s — envoi échoué : %s', order.reference, e.message);
    return { status: 'failed', at: now, to, error: e.message.slice(0, 300) };
  }
}

/**
 * Free-form reply. Only allowed inside the 24 h window opened by the
 * customer's own message — which a button tap is, so the acknowledgement
 * after a confirmation always qualifies.
 */
export async function sendText(to, text) {
  if (!whatsappEnabled()) return null;
  try {
    return await graph({ to, type: 'text', text: { body: text, preview_url: false } });
  } catch (e) {
    console.error('[whatsapp] réponse à %s échouée : %s', to, e.message);
    return null;
  }
}

/** Customer-facing acknowledgements, in the order's language. */
export const REPLIES = {
  confirmed: {
    fr: (ref) => `Merci ! Votre commande ${ref} est confirmée. Nous vous préviendrons dès son expédition.`,
    en: (ref) => `Thank you! Your order ${ref} is confirmed. We will let you know as soon as it ships.`,
  },
  cancelled: {
    fr: (ref) => `Votre commande ${ref} a bien été annulée. N'hésitez pas à nous écrire si vous changez d'avis.`,
    en: (ref) => `Your order ${ref} has been cancelled. Feel free to message us if you change your mind.`,
  },
  already: {
    fr: (ref, label) => `Votre commande ${ref} est déjà ${label}. Pour toute modification, répondez à ce message.`,
    en: (ref, label) => `Your order ${ref} is already ${label}. To change anything, just reply to this message.`,
  },
};

export const STATE_LABEL = {
  fr: { confirmee: 'confirmée', expediee: 'expédiée', livree: 'livrée', annulee: 'annulée' },
  en: { confirmee: 'confirmed', expediee: 'shipped', livree: 'delivered', annulee: 'cancelled' },
};
