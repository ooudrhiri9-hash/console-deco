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
function chooseOptions(product, requested) {
  const wanted = requested && typeof requested === 'object' ? requested : {};
  const chosen = [];
  let extra = 0;

  for (const option of product.options || []) {
    if (!Array.isArray(option?.values) || !option.values.length) continue;
    const askedId = clean(wanted[option.id], 40);
    const value = option.values.find((v) => v.id === askedId) || option.values[0];
    chosen.push({
      id: option.id,
      name: option.name,
      valueId: value.id,
      label: value.label,
      extra: int(value.extra, { fallback: 0 }),
      ...(askedId && askedId !== value.id ? { requested: askedId } : {}),
    });
    extra += int(value.extra, { fallback: 0 });
  }

  return { chosen, extra };
}

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
    const { chosen, extra } = chooseOptions(product, line.options);
    // price 0 is the catalogue's "price on request" — a real, allowed state here.
    // Un supplément sur un prix sur demande n'en fait pas un prix : la pièce
    // reste un devis, et le cadre choisi est noté pour la personne qui rappelle.
    if (!product.price) quoteOnly = true;
    const unit = product.price ? product.price + extra : 0;
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
