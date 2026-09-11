/**
 * Server-side shape and bounds for a product.
 *
 * The admin form is deliberately permissive — it posts whatever the shop owner
 * typed. Everything is decided here, so a hand-written request to the API is
 * held to exactly the same rules as the form.
 */
import { bool, clean, int, localized, localizedList, slugify } from './text.js';

const MAX_IMAGES = 10;

/** Accepts a /media/... path or an absolute http(s) URL. Rejects javascript:. */
function imagePath(value) {
  const v = clean(value, 500);
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith('/')) return v;
  return null;
}

function dimensions(value) {
  if (!value || typeof value !== 'object') return undefined;
  const out = {};
  for (const key of ['width', 'depth', 'height']) {
    const n = Number(value[key]);
    if (Number.isFinite(n) && n > 0) out[key] = Math.round(n * 10) / 10;
  }
  if (!Object.keys(out).length) return undefined;
  out.unit = 'cm';
  return out;
}

/**
 * @param body   raw request body
 * @param base   the stored product when editing, null when creating
 * @param known  Set of existing category ids
 * @returns {{ error?: string, product?: object }}
 */
export function normaliseProduct(body = {}, base = null, known = new Set()) {
  const merged = { ...(base || {}), ...body };

  const name = localized(merged.name, { max: 140 });
  if (!name.fr) return { error: 'Le nom en français est obligatoire.' };

  const categoryId = clean(merged.categoryId, 60);
  if (!categoryId) return { error: 'La catégorie est obligatoire.' };
  if (known.size && !known.has(categoryId)) {
    return { error: `Catégorie inconnue : ${categoryId}` };
  }

  const price = int(merged.price, { min: 0, max: 10_000_000, fallback: 0 });
  let compareAtPrice = int(merged.compareAtPrice, { min: 0, max: 10_000_000, fallback: 0 });
  // A crossed-out price at or below the real one would read as a price rise.
  if (compareAtPrice <= price) compareAtPrice = 0;

  const images = (Array.isArray(merged.images) ? merged.images : [])
    .map(imagePath)
    .filter(Boolean)
    .slice(0, MAX_IMAGES);

  const madeToOrder = bool(merged.madeToOrder);

  const product = {
    id: clean(merged.id, 40).toUpperCase() || `REF-${slugify(name.fr).slice(0, 12).toUpperCase()}`,
    categoryId,
    name,
    shortDescription: localized(merged.shortDescription, { max: 220 }),
    description: localized(merged.description, { max: 6000 }),
    price,
    images,
    materials: localized(merged.materials, { max: 240 }),
    colors: localizedList(merged.colors),
    inStock: merged.inStock === undefined ? true : bool(merged.inStock),
    madeToOrder,
    active: merged.active === undefined ? true : bool(merged.active),
    featured: bool(merged.featured),
  };

  if (compareAtPrice) product.compareAtPrice = compareAtPrice;

  const finish = localized(merged.finish, { max: 120 });
  if (finish.fr) product.finish = finish;

  const dim = dimensions(merged.dimensions);
  if (dim) product.dimensions = dim;

  // A lead time only means something on a made-to-order piece.
  const lead = int(merged.leadTimeDays, { min: 0, max: 365, fallback: 0 });
  if (madeToOrder && lead) product.leadTimeDays = lead;

  return { product };
}

/** Fields the list screen may flip without re-validating the whole sheet. */
export const TOGGLES = ['active', 'featured', 'inStock'];

export const isToggleOnly = (body) => {
  const keys = Object.keys(body || {});
  return keys.length > 0 && keys.every((k) => TOGGLES.includes(k));
};

/** What the shop is allowed to see: hidden products never leave the API. */
export const publicView = (p) => {
  const { active, ...rest } = p;
  return rest;
};
