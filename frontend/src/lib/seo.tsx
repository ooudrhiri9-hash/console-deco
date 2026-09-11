import type { Metadata } from 'next';
import { site } from '@/config/site';
import { htmlLang, locales, type Locale } from '@/i18n/config';
import type { Category, Product } from '@/types';
import { routes } from './routes';
import { dimensionsLabel } from './format';

const abs = (path: string) => `${site.url}${path}`;

/**
 * One place that builds canonical + hreflang + Open Graph for every page.
 * `alternates` maps each locale to the equivalent URL of THIS page.
 */
export function buildMetadata({
  locale,
  title,
  description,
  path,
  alternates,
  image,
  type = 'website',
}: {
  locale: Locale;
  title: string;
  description: string;
  path: string;
  alternates: Record<Locale, string>;
  image?: string;
  type?: 'website' | 'article';
}): Metadata {
  const languages: Record<string, string> = {};
  for (const l of locales) languages[htmlLang[l]] = abs(alternates[l]);
  languages['x-default'] = abs(alternates.fr);

  const ogImage = image ? abs(image) : abs('/og-default.png');

  return {
    title,
    description,
    alternates: { canonical: abs(path), languages },
    openGraph: {
      type,
      title,
      description,
      url: abs(path),
      siteName: site.brand,
      locale: locale === 'fr' ? 'fr_MA' : 'en_US',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  };
}

/**
 * Trim to a word boundary. Google truncates around 160 characters, and a
 * description cut mid-word looks broken in the result page.
 */
function clamp(text: string, max: number): string {
  const s = text.replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.]$/, '') + '…';
}

/**
 * A product's own one-liner runs 30–60 characters — too thin to be a useful
 * snippet. Compose it with the material, the size and the delivery promise so
 * every product page lands in the 120–160 band with real information.
 */
export function productMetaDescription(product: Product, locale: Locale): string {
  const dims = dimensionsLabel(product);
  const parts = [product.shortDescription[locale]];

  if (product.materials[locale]) parts.push(product.materials[locale]);
  if (dims) parts.push(dims);

  parts.push(
    locale === 'fr'
      ? 'Fait main au Maroc, livraison et paiement à la livraison.'
      : 'Handmade in Morocco, delivery and cash on delivery.',
  );

  return clamp(parts.join(' · '), 158);
}

/** Category pages: the family name alone is identical in FR and EN for
 *  "Consoles", which would ship two pages with the same <title>. */
export function categoryMetaTitle(name: string, locale: Locale): string {
  const suffix = locale === 'fr' ? 'fait main au Maroc' : 'handmade in Morocco';
  return clamp(`${name} ${suffix} | ${site.brand}`, 60);
}

/* -------------------------------------------------------------------------- */
/*  JSON-LD                                                                    */
/* -------------------------------------------------------------------------- */

/** Emitted once, on the home page: who the business is. */
export function organizationJsonLd(locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'HomeGoodsStore'],
    '@id': `${site.url}/#organization`,
    name: site.brand,
    url: site.url,
    description: site.baseline[locale],
    telephone: site.phone,
    email: site.email,
    priceRange: 'MAD',
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    areaServed: { '@type': 'Country', name: 'Morocco' },
    sameAs: [site.social.instagram, site.social.facebook, site.social.tiktok].filter(Boolean),
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${site.url}/#website`,
    url: site.url,
    name: site.brand,
    inLanguage: ['fr-MA', 'en'],
    publisher: { '@id': `${site.url}/#organization` },
  };
}

/** Product rich result: price, availability, condition. */
export function productJsonLd(product: Product, locale: Locale, category?: Category) {
  const dims = dimensionsLabel(product);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name[locale],
    sku: product.id,
    description: product.shortDescription[locale],
    url: `${site.url}${routes.product(locale, product)}`,
    ...(product.images.length ? { image: product.images.map((i) => `${site.url}${i}`) } : {}),
    brand: { '@type': 'Brand', name: site.brand },
    ...(category ? { category: category.name[locale] } : {}),
    material: product.materials[locale],
    ...(dims ? { size: dims } : {}),
    ...(product.price > 0
      ? {
          offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: site.currency,
            availability: product.inStock
              ? 'https://schema.org/InStock'
              : 'https://schema.org/PreOrder',
            itemCondition: 'https://schema.org/NewCondition',
            url: `${site.url}${routes.product(locale, product)}`,
            seller: { '@id': `${site.url}/#organization` },
          },
        }
      : {}),
  };
}

/** Collection page: helps Google understand the listing. */
export function itemListJsonLd(products: Product[], locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: products.length,
    // Google requires the URL under `item`, not `url` — a ListItem with `url`
    // is silently ignored.
    itemListElement: products.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: `${site.url}${routes.product(locale, p)}`,
      name: p.name[locale],
    })),
  };
}

/**
 * FAQ de l'accueil, au format que Google sait lire.
 *
 * Les réponses partent en texte brut : toute balise ici ferait rejeter le bloc
 * entier par le validateur, et la page perdrait aussi ses autres données
 * structurées.
 */
export function faqJsonLd(entries: ReadonlyArray<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

/** Small helper so pages stay readable. */
export const JsonLd = ({ data }: { data: object }) => (
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
);
