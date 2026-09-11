import type { Locale } from '@/i18n/config';

/** A string that exists in every supported language. */
export type Localized = Record<Locale, string>;

export interface Category {
  /** Stable internal id — never appears in a URL, safe to keep forever. */
  id: string;
  /** URL segment, translated per locale (SEO: real French/English words). */
  slug: Localized;
  name: Localized;
  /** One line under the title on listing cards. */
  tagline: Localized;
  /** Intro paragraph on the category page — carries the SEO keywords. */
  description: Localized;
  /** Path under /public, e.g. /media/categories/consoles.webp. '' = placeholder. */
  image: string;
  order: number;
}

export interface Product {
  /** Client-facing reference (SKU). Shown on the product sheet. */
  id: string;
  /** URL segment — identical in both locales so links never break on switch. */
  slug: string;
  categoryId: string;
  name: Localized;
  /** 1 sentence, used on cards, meta description and WhatsApp messages. */
  shortDescription: Localized;
  /** Full copy. Blank lines separate paragraphs. */
  description: Localized;
  /** Price in MAD, tax included. 0 = "price on request". */
  price: number;
  /** Optional crossed-out reference price for promotions. */
  compareAtPrice?: number;
  /** Paths under /public. Empty array renders an elegant SVG placeholder. */
  images: string[];
  dimensions?: { width?: number; depth?: number; height?: number; unit: 'cm' };
  materials: Localized;
  finish?: Localized;
  /** Free-text colour names, used for the colour filter. */
  colors: Localized[];
  inStock: boolean;
  /** Made to order — shows a lead-time notice instead of "in stock". */
  madeToOrder?: boolean;
  leadTimeDays?: number;
  featured?: boolean;
}


/** Une pièce du classement des ventes, telle que l'API la renvoie. */
export interface BestSeller {
  slug: string;
  /** Quantité vendue sur la fenêtre retenue par l'API. */
  sold: number;
}
