import type { MetadataRoute } from 'next';
import { site } from '@/config/site';
import { locales } from '@/i18n/config';
import { categories, allProducts } from '@/lib/catalogue';
import { alternates, routes } from '@/lib/routes';

/** Required by `output: export` — the file is written once at build time. */
export const dynamic = 'force-static';

/**
 * Static sitemap.xml with hreflang alternates on every entry.
 * Cart and checkout are intentionally excluded (they are noindex).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const abs = (p: string) => `${site.url}${p}`;
  const entries: MetadataRoute.Sitemap = [];
  const now = new Date();

  const push = (
    page: 'home' | 'products' | 'about' | 'contact',
    priority: number,
    changeFrequency: 'weekly' | 'monthly',
  ) => {
    const alt = alternates('fr', page);
    for (const l of locales) {
      entries.push({
        url: abs(routes[page](l)),
        lastModified: now,
        changeFrequency,
        priority,
        alternates: { languages: { 'fr-MA': abs(alt.fr), en: abs(alt.en) } },
      });
    }
  };

  push('home', 1, 'weekly');
  push('products', 0.9, 'weekly');
  push('about', 0.5, 'monthly');
  push('contact', 0.6, 'monthly');

  for (const c of categories) {
    const alt = alternates('fr', 'category', c);
    for (const l of locales) {
      entries.push({
        url: abs(routes.category(l, c)),
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: { languages: { 'fr-MA': abs(alt.fr), en: abs(alt.en) } },
      });
    }
  }

  for (const p of allProducts) {
    const alt = alternates('fr', 'product', p);
    for (const l of locales) {
      entries.push({
        url: abs(routes.product(l, p)),
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.7,
        alternates: { languages: { 'fr-MA': abs(alt.fr), en: abs(alt.en) } },
      });
    }
  }

  return entries;
}
