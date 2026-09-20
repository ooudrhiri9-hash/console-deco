import { localePrefix, locales, type Locale } from '@/i18n/config';
import { categories } from '@/lib/catalogue';
import type { Category, Product } from '@/types';

/**
 * URL shape (trailingSlash is on, so every path ends with "/"):
 *   FR (default, no prefix)   EN
 *   /                         /en/
 *   /produits/                /en/products/
 *   /produits/consoles/       /en/products/consoles/
 *   /produits/consoles/xyz/   /en/products/consoles/xyz/
 *   /contact/                 /en/contact/
 *   /a-propos/                /en/about/
 *   /panier/                  /en/cart/
 *   /commande/                /en/checkout/
 *   /favoris/                 /en/favorites/
 */
const segment = {
  products: { fr: 'produits', en: 'products' },
  /** Client-rendered sheet for a piece that has no static page yet. */
  piece: { fr: 'piece', en: 'item' },
  contact: { fr: 'contact', en: 'contact' },
  about: { fr: 'a-propos', en: 'about' },
  cart: { fr: 'panier', en: 'cart' },
  checkout: { fr: 'commande', en: 'checkout' },
  favorites: { fr: 'favoris', en: 'favorites' },
} as const;

const base = (locale: Locale) => localePrefix[locale];

export const routes = {
  home: (l: Locale) => `${base(l)}/`,
  products: (l: Locale) => `${base(l)}/${segment.products[l]}/`,
  category: (l: Locale, c: Category) => `${base(l)}/${segment.products[l]}/${c.slug[l]}/`,
  product: (l: Locale, p: Product) => {
    const c = categories.find((x) => x.id === p.categoryId);
    const cat = c ? c.slug[l] : 'divers';
    return `${base(l)}/${segment.products[l]}/${cat}/${p.slug}/`;
  },
  /**
   * A piece created in /admin after the last build has no static page. This
   * route renders it in the browser from the live catalogue, so a new piece is
   * on sale immediately instead of 404-ing until the next deploy.
   */
  piece: (l: Locale, slug: string) =>
    `${base(l)}/${segment.products[l]}/${segment.piece[l]}/?slug=${encodeURIComponent(slug)}`,
  contact: (l: Locale) => `${base(l)}/${segment.contact[l]}/`,
  about: (l: Locale) => `${base(l)}/${segment.about[l]}/`,
  cart: (l: Locale) => `${base(l)}/${segment.cart[l]}/`,
  checkout: (l: Locale) => `${base(l)}/${segment.checkout[l]}/`,
  favorites: (l: Locale) => `${base(l)}/${segment.favorites[l]}/`,
};

/** Category slug -> category, for a given locale (used by generateStaticParams). */
export const categoryBySlug = (locale: Locale, slug: string) =>
  categories.find((c) => c.slug[locale] === slug);

/**
 * Same page in the other language — powers the FR/EN switch and hreflang.
 * Falls back to the home page when the current page has no counterpart.
 */
export function alternates(
  current: Locale,
  page: keyof typeof routes,
  entity?: Category | Product,
): Record<Locale, string> {
  const out = {} as Record<Locale, string>;
  for (const l of locales) {
    if (page === 'category' && entity) out[l] = routes.category(l, entity as Category);
    else if (page === 'product' && entity) out[l] = routes.product(l, entity as Product);
    else out[l] = (routes[page] as (x: Locale) => string)(l);
  }
  return out;
}

/* -------------------------------------------------------------------------- */

const SEGMENT_KEYS = ['products', 'contact', 'about', 'cart', 'checkout', 'favorites'] as const;
type SegmentKey = (typeof SEGMENT_KEYS)[number];

/** Reverse lookup: a URL segment in any locale -> its logical key. */
function segmentKey(token: string): { key: SegmentKey; locale: Locale } | null {
  for (const key of SEGMENT_KEYS) {
    for (const l of locales) {
      if (segment[key][l] === token) return { key, locale: l };
    }
  }
  return null;
}

/**
 * Translate the CURRENT url into the other language, keeping the visitor on the
 * same page. Used by the FR/EN switch and by the hreflang tags.
 * Falls back to that locale's home page when the path cannot be mapped.
 */
export function switchLocalePath(pathname: string, target: Locale): string {
  const clean = pathname.replace(/^\/+|\/+$/g, '');
  const tokens = clean ? clean.split('/') : [];

  // Drop the /en prefix if present.
  if (tokens[0] === 'en') tokens.shift();
  if (tokens.length === 0) return routes.home(target);

  const found = segmentKey(tokens[0]);
  if (!found) return routes.home(target);

  const from = found.locale;
  if (found.key !== 'products') {
    return `${base(target)}/${segment[found.key][target]}/`;
  }

  // /produits/
  if (tokens.length === 1) return routes.products(target);

  // /produits/<category>/
  const category = categories.find((c) => c.slug[from] === tokens[1]);
  if (!category) return routes.products(target);
  if (tokens.length === 2) return routes.category(target, category);

  // /produits/<category>/<product>/  — product slugs are locale-independent
  return `${base(target)}/${segment.products[target]}/${category.slug[target]}/${tokens[2]}/`;
}
