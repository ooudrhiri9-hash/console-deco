/**
 * Shop settings — brand, contact details, delivery threshold.
 *
 * These were hard-coded in the front-end (src/config/site.ts). They now live in
 * the database so the owner changes a phone number without a developer, and the
 * front-end keeps the same values as its build-time fallback.
 */
import { store } from '../store/index.js';
import { clean, int, localized } from './text.js';

export const DEFAULT_SETTINGS = {
  brand: 'ATELIER OMAR',
  brandShort: 'Atelier Omar',
  baseline: {
    fr: "Mobilier d'art & tableaux, façonnés au Maroc",
    en: 'Art furniture & wall art, handcrafted in Morocco',
  },
  url: 'https://atelier-omar.ma',
  phone: '+212 6 65 20 24 95',
  phoneHref: '+212665202495',
  whatsapp: '212665202495',
  email: 'contact@atelier-omar.ma',
  address: {
    street: '',
    city: 'Casablanca',
    region: 'Casablanca-Settat',
    postalCode: '20000',
    country: 'MA',
  },
  hours: { fr: 'Lundi – Samedi, 9h – 19h', en: 'Monday – Saturday, 9am – 7pm' },
  social: { instagram: '', facebook: '', tiktok: '' },
  currency: 'MAD',
  currencyLabel: 'DH',
  freeShippingThreshold: 1500,
  shippingFlatRate: 0,
  announcement: { fr: '', en: '' },
};

/** Digits only, no "+", the shape wa.me expects. */
const phoneDigits = (v) => clean(v, 20).replace(/[^\d]/g, '');

/** '' keeps the icon hidden; anything else must be a real http(s) link. */
const link = (v) => {
  const s = clean(v, 300);
  return /^https?:\/\//i.test(s) ? s : '';
};

export function normaliseSettings(body = {}, base = DEFAULT_SETTINGS) {
  const m = { ...base, ...body };
  const address = { ...base.address, ...(body.address || {}) };
  const social = { ...base.social, ...(body.social || {}) };

  return {
    brand: clean(m.brand, 80) || base.brand,
    brandShort: clean(m.brandShort, 60) || base.brandShort,
    baseline: localized(m.baseline, { max: 160 }),
    url: link(m.url) || base.url,
    phone: clean(m.phone, 40),
    // Always derived, never typed: a mismatch here breaks every call button.
    phoneHref: `+${phoneDigits(m.phoneHref || m.phone)}`,
    whatsapp: phoneDigits(m.whatsapp),
    email: clean(m.email, 120),
    address: {
      street: clean(address.street, 160),
      city: clean(address.city, 80),
      region: clean(address.region, 80),
      postalCode: clean(address.postalCode, 20),
      country: clean(address.country, 2).toUpperCase() || 'MA',
    },
    hours: localized(m.hours, { max: 120 }),
    social: {
      instagram: link(social.instagram),
      facebook: link(social.facebook),
      tiktok: link(social.tiktok),
    },
    // Currency is not editable: it is baked into the price fields, the JSON-LD
    // and the PHP order mail. Changing it in one place only would misprice.
    currency: 'MAD',
    currencyLabel: 'DH',
    freeShippingThreshold: int(m.freeShippingThreshold, { min: 0, max: 1_000_000, fallback: 0 }),
    shippingFlatRate: int(m.shippingFlatRate, { min: 0, max: 100_000, fallback: 0 }),
    announcement: localized(m.announcement, { max: 200 }),
  };
}

/** Stored settings, with every missing key filled in from the defaults above. */
export async function readSettings() {
  const saved = await store.settings.read();
  return normaliseSettings(saved || {}, DEFAULT_SETTINGS);
}
