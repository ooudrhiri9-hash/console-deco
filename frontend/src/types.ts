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

/** Une valeur possible d'un choix, avec ce qu'elle ajoute au prix. */
export interface ProductOptionValue {
  id: string;
  label: Localized;
  /** Supplément en dirhams, 0 quand la valeur n'ajoute rien. */
  extra: number;
}

/**
 * Un choix offert sur la fiche : le cadre d'un tableau, ses dimensions.
 *
 * L'API en est la seule source : les libellés et les suppléments affichés ici
 * sont relus côté serveur au moment de la commande, à partir des seuls
 * identifiants. Le navigateur propose, la base dispose.
 */
export interface ProductOption {
  id: string;
  name: Localized;
  values: ProductOptionValue[];
}

/** Ce que le visiteur a choisi : id du choix -> id de la valeur. */
export type OptionChoice = Record<string, string>;

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
  /** Choix proposés sur la fiche : « Cadre », « Dimensions »… Vide = aucun. */
  options?: ProductOption[];
  /** Cochée dans /admin : sert de meilleures ventes tant que les commandes
   *  enregistrées ne suffisent pas à établir un classement. */
  bestSeller?: boolean;
}


/** Une pièce du classement des ventes, telle que l'API la renvoie. */
export interface BestSeller {
  slug: string;
  /** Quantité vendue sur la fenêtre retenue par l'API. 0 si la sélection est
   *  celle cochée à la main dans /admin. */
  sold: number;
}

/**
 * D'où vient le classement : `orders` = compté sur les commandes enregistrées,
 * `manual` = la sélection du patron dans /admin. La boutique ne numérote les
 * pièces que dans le premier cas — un rang chiffré sur un choix à la main
 * annoncerait un comptage qui n'a pas eu lieu.
 */
export type BestSellersSource = 'orders' | 'manual';
