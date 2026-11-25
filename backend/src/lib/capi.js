/**
 * Meta Conversions API — the server half of the Maison Deco pixel.
 *
 * Two jobs:
 *   1. Website orders: the browser already sends Purchase with eventID
 *      `order-<ref>`. The server sends the same event with the same event_id,
 *      so Meta keeps one, but gains the customer's phone/city for matching and
 *      still counts the sale when an ad blocker stopped the browser pixel.
 *   2. WhatsApp orders: a sale closed in a chat never reaches the pixel. When
 *      the order is marked « Livrée » in /admin, the server sends Purchase with
 *      action_source "chat", matched on the phone number and, when the chat
 *      began with a tagged WhatsApp click, on the _fbp/_fbc saved at that click.
 *
 * Switched off until META_CAPI_TOKEN is set (Events Manager → the pixel →
 * Settings → Conversions API → Generate access token). Every call records its
 * outcome on the order instead of throwing: Meta being down never blocks an
 * order or a status change.
 */
import crypto from 'node:crypto';
import { env } from '../env.js';
import { toWhatsAppNumber } from './whatsapp.js';

const config = () => ({
  pixelId: env('META_PIXEL_ID', '1002544429577867'),
  token: env('META_CAPI_TOKEN'),
  version: env('META_GRAPH_VERSION', 'v25.0'),
  graph: env('META_GRAPH_URL', 'https://graph.facebook.com').replace(/\/+$/, ''),
  // Set while testing: events then show under « Test events » in Events
  // Manager and do not count in Ads Manager. Empty it to go live.
  testCode: env('META_TEST_EVENT_CODE'),
});

export const capiEnabled = () => Boolean(config().token);

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

/** Meta's normalisation for names and cities: lowercase, no accents, letters only. */
const plainLetters = (s) => String(s ?? '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z]/g, '');

/**
 * user_data for one customer. Personal fields are hashed (SHA-256) as Meta
 * requires; the browser ids, IP and user agent are sent as they are.
 */
export function userData({ customer = {}, tracking = {}, ip, userAgent } = {}) {
  const u = {};
  const phone = toWhatsAppNumber(customer.phone);
  if (phone) {
    u.ph = [sha256(phone)];
    // One stable id per customer across website and WhatsApp orders.
    u.external_id = [sha256(phone)];
  }
  const email = String(customer.email ?? '').trim().toLowerCase();
  if (email) u.em = [sha256(email)];
  const parts = String(customer.name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length) u.fn = [sha256(plainLetters(parts[0]))];
  if (parts.length > 1) u.ln = [sha256(plainLetters(parts.slice(1).join('')))];
  const city = plainLetters(customer.city);
  if (city) u.ct = [sha256(city)];
  u.country = [sha256('ma')];
  if (tracking.fbp) u.fbp = tracking.fbp;
  if (tracking.fbc) u.fbc = tracking.fbc;
  if (ip) u.client_ip_address = ip;
  if (userAgent) u.client_user_agent = userAgent;
  return u;
}

/** custom_data for a Purchase: amount in MAD, the pieces, our reference. */
function purchaseData(order) {
  const ids = (order.items || []).map((i) => i.id).filter((id) => id && id !== 'WHATSAPP');
  return {
    currency: 'MAD',
    value: order.total,
    order_id: order.reference,
    num_items: (order.items || []).reduce((n, i) => n + (i.qty || 0), 0),
    ...(ids.length ? { content_ids: ids, content_type: 'product' } : {}),
  };
}

/**
 * Builds the Purchase event for an order.
 *  - website: same event_id as the browser (`order-<ref>`) so Meta deduplicates.
 *  - chat:    a WhatsApp sale, timed when it was delivered (paid).
 */
export function purchaseEvent(order, { source, ip, userAgent, eventTime } = {}) {
  const chat = source === 'chat';
  const time = eventTime ? new Date(eventTime) : new Date(order.createdAt);
  return {
    event_name: 'Purchase',
    event_time: Math.floor(time.getTime() / 1000),
    event_id: chat ? `wa-${order.reference}` : `order-${order.reference}`,
    action_source: chat ? 'chat' : 'website',
    ...(chat ? {} : { event_source_url: order.tracking?.pageUrl || undefined }),
    user_data: userData({ customer: order.customer, tracking: order.tracking, ip, userAgent }),
    custom_data: purchaseData(order),
  };
}

/**
 * Sends one event. Never throws: returns what to store on the order.
 *   { status: 'sent' | 'failed' | 'disabled', at, eventId, ... }
 */
export async function sendEvent(event) {
  const at = new Date().toISOString();
  const c = config();
  if (!c.token) return { status: 'disabled', at, eventId: event.event_id };

  const body = { data: [event], ...(c.testCode ? { test_event_code: c.testCode } : {}) };
  try {
    const res = await fetch(
      `${c.graph}/${c.version}/${c.pixelId}/events?access_token=${encodeURIComponent(c.token)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10_000),
      },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        status: 'failed',
        at,
        eventId: event.event_id,
        error: data?.error?.error_user_msg || data?.error?.message || `HTTP ${res.status}`,
      };
    }
    return {
      status: 'sent',
      at,
      eventId: event.event_id,
      received: data.events_received ?? null,
      ...(c.testCode ? { test: true } : {}),
    };
  } catch (e) {
    return { status: 'failed', at, eventId: event.event_id, error: e.name === 'TimeoutError' ? 'Délai dépassé' : e.message };
  }
}
