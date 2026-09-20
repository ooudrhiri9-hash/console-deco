/**
 * Order validation and pricing.
 *
 * The price of every line is read from the catalogue, never from the request.
 * The cart posts what it displayed; if it disagrees with the database the
 * database wins, and the discrepancy is recorded on the order so a support
 * call can explain what the customer saw.
 */
import { clean, int, reference } from './text.js';

export const STATUSES = ['nouvelle', 'confirmee', 'expediee', 'livree', 'annulee'];
export const OPEN_STATUSES = ['nouvelle', 'confirmee'];

const MAX_LINES = 50;

function customer(raw = {}) {
  const c = {
    name: clean(raw.name, 120),
    phone: clean(raw.phone, 40),
    email: clean(raw.email, 160),
    city: clean(raw.city, 80),
    address: clean(raw.address, 400),
    notes: clean(raw.notes, 1000),
  };
  if (!c.name) return { error: 'Le nom est obligatoire.' };
  // Moroccan mobiles are 10 digits locally, 12 with the country code.
  if (c.phone.replace(/\D/g, '').length < 9) return { error: 'Numéro de téléphone invalide.' };
  if (!c.city) return { error: 'La ville est obligatoire.' };
  if (c.email && !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(c.email)) {
    return { error: 'Adresse e-mail invalide.' };
  }
  return { customer: c };
}

/**
 * Résout les choix du client (cadre, dimensions…) contre la fiche.
 *
 * Le navigateur n'envoie que des identifiants ; le libellé et le supplément
 * sont relus ici, comme le prix. Un identifiant inconnu — panier resté ouvert
 * pendant qu'on modifiait la fiche, ou requête écrite à la main — retombe sur
 * la première valeur, celle que la page propose par défaut, et ce que le
 * panier réclamait est conservé à côté pour qu'un appel au client puisse
 * l'expliquer.
 */
/**
 * Les dimensions saisies par le client : « 120x80 », ou « 120x40x80 » pour un
 * meuble (largeur × profondeur × hauteur), en centimètres.
 *
 * Bornes volontairement larges — c'est un atelier, pas un catalogue de tailles
 * standard — mais bornes quand même : au-delà, la ligne repart sur les formats
 * de la fiche plutôt que d'ouvrir un devis sur un meuble de 90 mètres.
 */
export function parseCustomSize(raw) {
  const parts = String(raw ?? '').split('x');
  if (parts.length < 2 || parts.length > 3) return null;
  const nums = parts.map(Number);
  if (nums.some((n) => !Number.isFinite(n) || n < 10 || n > 500)) return null;
  const [width, second, third] = nums.map(Math.round);
  return parts.length === 2 ? { width, height: second } : { width, depth: second, height: third };
}

const CUSTOM_SIZE = 'sur-mesure';

const customLabel = (d) => `${[d.width, d.depth, d.height].filter((n) => typeof n === 'number').join(' × ')} cm`;

function chooseOptions(product, requested) {
  const wanted = requested && typeof requested === 'object' ? requested : {};
  const usable = (product.options || []).filter((o) => Array.isArray(o?.values) && o.values.length);
  // Des dimensions sur mesure remplacent le format de la fiche : la pièce
  // n'est plus faite dans une des tailles proposées, et aucun prix ne peut en
  // sortir tant que l'atelier n'a pas chiffré.
  const custom = parseCustomSize(wanted[CUSTOM_SIZE]);
  const pick = (option) => {
    const askedId = clean(wanted[option.id], 40);
    return { askedId, value: option.values.find((v) => v.id === askedId) || option.values[0] };
  };

  // Le format d'abord : le supplément d'un cadre peut en dépendre.
  const size = usable.find((o) => o.kind === 'size');
  const sizeId = size ? pick(size).value.id : undefined;

  const chosen = [];
  let extra = 0;

  for (const option of usable) {
    if (custom && option.kind === 'size') continue;
    const { askedId, value } = pick(option);
    const own = option.kind !== 'size' && sizeId ? value.extraBySize?.[sizeId] : undefined;
    const amount = int(own ?? value.extra, { fallback: 0 });
    chosen.push({
      id: option.id,
      name: option.name,
      valueId: value.id,
      label: value.label,
      extra: amount,
      ...(askedId && askedId !== value.id ? { requested: askedId } : {}),
    });
    extra += amount;
  }

  if (custom) {
    chosen.push({
      id: CUSTOM_SIZE,
      name: { fr: 'Sur mesure', en: 'Custom size' },
      valueId: packCustom(custom),
      label: { fr: customLabel(custom), en: customLabel(custom) },
      extra: 0,
      custom,
    });
  }

  return { chosen, extra, custom };
}

const packCustom = (d) => [d.width, d.depth, d.height].filter((n) => typeof n === 'number').join('x');

/**
 * @param body      raw request body
 * @param catalogue array of stored products
 * @param settings  normalised shop settings (delivery threshold, flat rate)
 */
export function buildOrder(body = {}, catalogue = [], settings = {}) {
  const who = customer(body.customer);
  if (who.error) return { error: who.error };

  const requested = Array.isArray(body.items) ? body.items.slice(0, MAX_LINES) : [];
  if (!requested.length) return { error: 'Le panier est vide.' };

  const bySku = new Map(catalogue.map((p) => [p.id, p]));
  const bySlug = new Map(catalogue.map((p) => [p.slug, p]));

  const items = [];
  const rejected = [];
  let quoteOnly = false;

  for (const line of requested) {
    const product = bySku.get(clean(line.id, 40).toUpperCase()) || bySlug.get(clean(line.slug, 90));
    if (!product || product.active === false) {
      rejected.push(clean(line.id || line.slug, 60));
      continue;
    }
    const qty = int(line.qty, { min: 1, max: 99, fallback: 1 });
    const { chosen, extra, custom } = chooseOptions(product, line.options);
    // price 0 is the catalogue's "price on request" — a real, allowed state here.
    // Un supplément sur un prix sur demande n'en fait pas un prix : la pièce
    // reste un devis, et le cadre choisi est noté pour la personne qui rappelle.
    // Des dimensions sur mesure se chiffrent à l'atelier : le prix du
    // catalogue ne vaut plus pour cette ligne.
    if (!product.price || custom) quoteOnly = true;
    const unit = product.price && !custom ? product.price + extra : 0;
    items.push({
      id: product.id,
      slug: product.slug,
      name: product.name,
      qty,
      price: unit,
      lineTotal: unit * qty,
      ...(chosen.length ? { options: chosen } : {}),
      // What the browser believed, kept only when it differs from the truth.
      ...(int(line.price, { fallback: -1 }) !== unit && line.price !== undefined
        ? { quotedPrice: int(line.price, { fallback: 0 }) }
        : {}),
    });
  }

  if (!items.length) return { error: 'Aucun article valide dans le panier.' };

  const subtotal = items.reduce((n, l) => n + l.lineTotal, 0);
  const threshold = int(settings.freeShippingThreshold, { fallback: 0 });
  const flat = int(settings.shippingFlatRate, { fallback: 0 });
  const shipping = !flat || (threshold && subtotal >= threshold) ? 0 : flat;

  const locale = body.locale === 'en' ? 'en' : 'fr';
  const now = new Date().toISOString();

  return {
    order: {
      reference: reference(),
      locale,
      customer: who.customer,
      items,
      subtotal,
      shipping,
      total: subtotal + shipping,
      // Only ever "cash on delivery" today; kept as a field so adding a card
      // processor later does not need a migration.
      payment: 'cod',
      quoteOnly,
      rejected,
      status: 'nouvelle',
      createdAt: now,
      updatedAt: now,
    },
  };
}
