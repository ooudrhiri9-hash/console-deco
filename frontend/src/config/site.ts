/**
 * SINGLE SOURCE OF TRUTH for brand + contact details.
 *
 * The owner edits these in /admin; `npm run sync` freezes them into
 * src/data/catalogue.json at build time. The literals below are the fallback
 * used when that snapshot is missing — keep them in step with
 * backend/src/lib/settings.js (DEFAULT_SETTINGS).
 */
import snapshot from '@/data/catalogue.json';

type Localized = { fr: string; en: string };

const DEFAULTS = {
  brand: 'MAISON DÉCO',
  brandShort: 'Maison Déco',
  baseline: {
    fr: "Mobilier d'art & tableaux, façonnés au Maroc",
    en: 'Art furniture & wall art, handcrafted in Morocco',
  } as Localized,

  /** Final domain — used for canonicals, sitemap, JSON-LD, OG tags. */
  url: 'https://maisondeco.ma',

  phone: '+212 6 65 20 24 95',
  phoneHref: '+212665202495',
  /** Digits only, international format, no "+" — used to build wa.me links */
  whatsapp: '212665202495',
  email: 'contact@maisondeco.ma',

  address: {
    street: '',
    city: 'Casablanca',
    region: 'Casablanca-Settat',
    postalCode: '20000',
    country: 'MA',
  },

  hours: { fr: 'Lundi – Samedi, 9h – 19h', en: 'Monday – Saturday, 9am – 7pm' } as Localized,

  /** '' hides the icon. */
  social: { instagram: '', facebook: '', tiktok: '' },

  currency: 'MAD',
  currencyLabel: 'DH',

  /** Free delivery above this amount (MAD). 0 disables the banner. */
  freeShippingThreshold: 1500,
  /** Delivery charged below the threshold. 0 = delivery always free. */
  shippingFlatRate: 0,

  /** Optional strip above the header. '' hides it. */
  announcement: { fr: '', en: '' } as Localized,
};

type Settings = typeof DEFAULTS;

const saved = (snapshot as { settings?: Partial<Settings> | null }).settings;

/**
 * Shallow merge, one level deep for the three nested objects. A blank field in
 * the back office means "not filled in", so it falls back rather than erasing
 * the address or hiding the phone number.
 */
function merge(base: Settings, over?: Partial<Settings> | null): Settings {
  if (!over) return base;
  const pick = <T extends object>(a: T, b?: Partial<T>): T => {
    const out = { ...a };
    for (const [k, v] of Object.entries(b || {})) {
      if (v !== undefined && v !== null && v !== '') (out as Record<string, unknown>)[k] = v;
    }
    return out;
  };
  return {
    ...pick(base, over),
    baseline: pick(base.baseline, over.baseline),
    hours: pick(base.hours, over.hours),
    address: pick(base.address, over.address),
    // Unlike the rest, a social link cleared in the admin must really disappear.
    social: { ...base.social, ...(over.social || {}) },
    // 0 is a meaningful value here: "no free-delivery threshold".
    freeShippingThreshold: over.freeShippingThreshold ?? base.freeShippingThreshold,
    shippingFlatRate: over.shippingFlatRate ?? base.shippingFlatRate,
    announcement: { ...base.announcement, ...(over.announcement || {}) },
  };
}

export const site = merge(DEFAULTS, saved);

/**
 * La livraison est-elle offerte quoi qu'il arrive ?
 *
 * C'est exactement ce que calcule l'API : sans tarif forfaitaire, le port vaut
 * zero sur toutes les commandes, seuil ou pas. La question se pose partout —
 * bandeau, fiche, panier — et y repondre trois fois avec trois formulations
 * est precisement ce qui avait fait diverger les messages.
 */
export const deliveryAlwaysFree = site.shippingFlatRate === 0;

export type Site = typeof site;
