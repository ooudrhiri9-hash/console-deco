/**
 * WhatsApp clicks tagged with a reference, so a sale closed in the chat can be
 * traced back to the ad that brought the visitor.
 *
 * On click: a reference « MD-7K2M » is added to the pre-filled message, and
 * posted to the API with Meta's browser ids (_fbp, _fbc). When Omar records the
 * sale in /admin with that reference, the server reports it to Meta with the
 * same ids (backend/src/lib/capi.js).
 */
import { apiUrl } from '@/config/api';
import type { Locale } from '@/i18n/config';
import { track } from './pixel';
import { waLink } from './whatsapp';

export type LeadChannel = 'whatsapp_float' | 'whatsapp_checkout' | 'whatsapp_contact';

// No I, O, 0, 1: the reference is read off a phone screen and typed by hand.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function newLeadRef(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return `MD-${Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')}`;
}

const cookie = (name: string) =>
  document.cookie.split('; ').find((c) => c.startsWith(`${name}=`))?.slice(name.length + 1) || '';

/**
 * Meta's browser ids. The pixel writes _fbp on every visit and _fbc when the
 * visitor arrived from an ad (fbclid in the URL); if the pixel was blocked or
 * slow, _fbc is rebuilt from the fbclid itself.
 */
export function metaIds(): { fbp: string; fbc: string } {
  if (typeof document === 'undefined') return { fbp: '', fbc: '' };
  let fbc = cookie('_fbc');
  if (!fbc) {
    const fbclid = new URLSearchParams(window.location.search).get('fbclid');
    if (fbclid) fbc = `fb.1.${Date.now()}.${fbclid}`;
  }
  return { fbp: cookie('_fbp'), fbc };
}

/** The message as sent, with the reference on its own last line. */
export const withRef = (message: string, ref: string, locale: Locale) =>
  `${message}\n\n[${locale === 'fr' ? 'Réf.' : 'Ref.'} ${ref}]`;

/**
 * Click handler for a WhatsApp link: tags the message, records the click and
 * sends a Contact event. The href is rewritten before the browser follows it,
 * so the reference is in the chat the customer opens.
 */
export function onWhatsappClick(channel: LeadChannel, message: string, locale: Locale, contact: Record<string, unknown> = {}) {
  return (e: { currentTarget: HTMLAnchorElement }) => {
    const ref = newLeadRef();
    e.currentTarget.href = waLink(withRef(message, ref, locale));
    track('Contact', { content_name: channel, ...contact });
    const body = JSON.stringify({ ref, channel, page: window.location.href, ...metaIds() });
    try {
      // keepalive: the request survives the tab switching to WhatsApp.
      fetch(apiUrl('/api/leads'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* the chat still opens; only the ad link is lost */
    }
  };
}
