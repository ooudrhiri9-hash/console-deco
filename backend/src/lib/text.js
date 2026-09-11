/** Shared text helpers: slugs and the bilingual `{ fr, en }` shape. */

export const LOCALES = ['fr', 'en'];

/** URL-safe slug: accents folded, punctuation dropped, single dashes. */
export function slugify(input) {
  return String(input ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export const clean = (v, max = 2000) => String(v ?? '').trim().slice(0, max);

/**
 * Normalises a bilingual field.
 *
 * The admin form has one box per language, so nothing is invented. The single
 * exception is a blank English box: it falls back to the French text rather
 * than rendering an empty heading on the /en pages. Fill it in to get real
 * English — the fallback is a safety net, not a translation.
 */
export function localized(value, { max = 4000 } = {}) {
  const raw = value && typeof value === 'object' ? value : { fr: value, en: value };
  const fr = clean(raw.fr, max);
  const en = clean(raw.en, max) || fr;
  return { fr, en };
}

export const isBlank = (loc) => !loc || !loc.fr;

/** Array of bilingual values (colours), de-duplicated on the French label. */
export function localizedList(value, { max = 12 } = {}) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const out = [];
  for (const item of value) {
    const loc = localized(item, { max: 60 });
    if (!loc.fr || seen.has(loc.fr.toLowerCase())) continue;
    seen.add(loc.fr.toLowerCase());
    out.push(loc);
    if (out.length >= max) break;
  }
  return out;
}

/** Bounded integer. Returns `fallback` for anything unparseable. */
export function int(value, { min = 0, max = Number.MAX_SAFE_INTEGER, fallback = 0 } = {}) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export const bool = (v) => v === true || v === 'true' || v === 1 || v === '1' || v === 'on';

/** Short human-readable reference, e.g. "CMD-8F3K2Q". Unique enough at this scale. */
export function reference(prefix = 'CMD') {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no I/L/O/0/1 — read aloud on the phone
  let out = '';
  for (let i = 0; i < 6; i += 1) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `${prefix}-${out}`;
}
