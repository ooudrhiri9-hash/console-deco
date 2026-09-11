'use client';

import { useSearchParams } from 'next/navigation';
import type { Locale } from '@/i18n/config';
import { getDict } from '@/i18n/dictionaries';
import { routes } from '@/lib/routes';
import Link from './Link';
import ProductView from '@/views/ProductView';
import { useProductBySlug } from './LiveCatalogue';

/**
 * The sheet for a piece that has no page of its own yet.
 *
 * A piece added in /admin only gets a static page at the next build. Rather
 * than 404 until then, its cards link here and the same product view is
 * rendered in the browser from the live catalogue. The page is disallowed in
 * robots.txt: once the site is rebuilt, the real URL is the one to index.
 */
export default function PieceFallback({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const slug = (useSearchParams().get('slug') || '').trim();
  const { product, ready } = useProductBySlug(slug);

  if (product) return <ProductView product={product} locale={locale} />;

  return (
    <div className="container section">
      <div className="empty-state stack">
        <p>{ready ? t.common.notFound : t.common.loading}</p>
        {ready && (
          <Link href={routes.products(locale)} className="btn btn--primary">
            {t.cart.emptyCta}
          </Link>
        )}
      </div>
    </div>
  );
}
