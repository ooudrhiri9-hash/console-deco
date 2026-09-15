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

const MAX_OPTIONS = 4;
const MAX_VALUES = 12;

/**
 * Les choix proposés sur la fiche : « Cadre », « Dimensions »…
 *
 * Chaque valeur porte son supplément en dirhams. C'est la seule source de prix
 * qui compte : buildOrder() relit le supplément ici même à partir de l'id
 * envoyé par le navigateur, donc un panier trafiqué ne peut pas s'offrir un
 * cadre doré au prix du sans-cadre.
 *
 * Les ids sont dérivés des libellés français et figés à la création, comme les
 * slugs de pièces : renommer « Cadre doré » en « Cadre laiton » ne doit pas
 * transformer les commandes déjà passées en choix introuvables.
 */
function options(value) {
  if (!Array.isArray(value)) return [];
  const out = [];
  const seenOption = new Set();

  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue;
    const name = localized(raw.name, { max: 60 });
    if (!name.fr) continue;

    const id = clean(raw.id, 40) || slugify(name.fr).slice(0, 40);
    if (!id || seenOption.has(id)) continue;

    const values = [];
    const seenValue = new Set();
    for (const rawValue of Array.isArray(raw.values) ? raw.values : []) {
      if (!rawValue || typeof rawValue !== 'object') continue;
      const label = localized(rawValue.label, { max: 80 });
      if (!label.fr) continue;
      const valueId = clean(rawValue.id, 40) || slugify(label.fr).slice(0, 40);
      if (!valueId || seenValue.has(valueId)) continue;
      seenValue.add(valueId);
      values.push({
        id: valueId,
        label,
        // Un supplément négatif ferait baisser le prix : ce n'est pas une remise,
        // c'est une porte ouverte. Une vraie promotion passe par compareAtPrice.
        extra: int(rawValue.extra, { min: 0, max: 10_000_000, fallback: 0 }),
      });
      if (values.length >= MAX_VALUES) break;
    }

    // Un choix sans option à choisir n'est pas un choix.
    if (values.length < 2) continue;

    seenOption.add(id);
    out.push({ id, name, values });
    if (out.length >= MAX_OPTIONS) break;
  }

  return out;
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
    // Choix du patron, utilise seulement tant que les commandes enregistrees ne
    // suffisent pas a classer : voir lib/bestsellers.js.
    bestSeller: bool(merged.bestSeller),
    options: options(merged.options),
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
export const TOGGLES = ['active', 'featured', 'inStock', 'bestSeller'];

export const isToggleOnly = (body) => {
  const keys = Object.keys(body || {});
  return keys.length > 0 && keys.every((k) => TOGGLES.includes(k));
};

/** What the shop is allowed to see: hidden products never leave the API. */
export const publicView = (p) => {
  const { active, ...rest } = p;
  return rest;
};
