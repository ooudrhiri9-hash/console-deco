import { site } from '@/config/site';
import type { Locale } from '@/i18n/config';
import type { Product } from '@/types';

/**
 * Prices are whole dirhams. We format manually rather than with Intl so the
 * server-rendered HTML and the client hydration can never disagree about
 * spaces or currency placement (a classic React hydration mismatch).
 */
export function formatPrice(amount: number, locale: Locale = 'fr'): string {
  const rounded = Math.round(amount);
  const grouped = String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); // narrow nbsp
  return locale === 'fr'
    ? `${grouped} ${site.currencyLabel}`
    : `${grouped} ${site.currencyLabel}`;
}

export function dimensionsLabel(p: Product): string | null {
  const d = p.dimensions;
  if (!d) return null;
  const parts = [d.width, d.depth, d.height].filter((v): v is number => typeof v === 'number');
  if (!parts.length) return null;
  return `${parts.join(' × ')} ${d.unit}`;
}

/** Percentage off, or null when there is no promotion. */
export function discountPercent(p: Product): number | null {
  if (!p.compareAtPrice || !p.price || p.compareAtPrice <= p.price) return null;
  return Math.round((1 - p.price / p.compareAtPrice) * 100);
}

/** Turns blank-line-separated copy into paragraphs. */
export const paragraphs = (text: string): string[] =>
  text.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
