'use client';

import Link from '@/components/Link';
import type { Category, Product } from '@/types';
import type { Locale } from '@/i18n/config';
import { getDict } from '@/i18n/dictionaries';
import { routes } from '@/lib/routes';
import { discountPercent, formatPrice } from '@/lib/format';
import { priceRange } from '@/lib/options';
import { countByCategory, priceFrom } from '@/lib/catalogue';
import { hasStaticPage, useLiveProduct } from './LiveCatalogue';
import ProductImage from './ProductImage';

/**
 * Client component on purpose: the price and the badges follow the live
 * catalogue, so a price changed in /admin is right on the card before the site
 * is rebuilt. It is still server-rendered into the static HTML, so the built-in
 * price is what a crawler reads.
 */
export function ProductCard({
  product: built,
  locale,
  priority = false,
}: {
  product: Product;
  locale: Locale;
  priority?: boolean;
}) {
  const t = getDict(locale);
  const { product } = useLiveProduct(built);
  const off = discountPercent(product);

  // A piece added since the last build has no static page yet.
  const href = hasStaticPage(product.slug)
    ? routes.product(locale, product)
    : routes.piece(locale, product.slug);

  return (
    <Link href={href} className="card">
      <div className="card__media">
        {off !== null && <span className="badge badge--sale">-{off}%</span>}
        {off === null && product.madeToOrder && (
          <span className="badge badge--order">{t.common.madeToOrder}</span>
        )}
        <ProductImage
          src={product.images[0]}
          alt={product.name[locale]}
          seed={product.slug}
          priority={priority}
        />
      </div>
      <div className="card__body">
        <h3 className="card__title">{product.name[locale]}</h3>
        <p className="card__meta">{product.shortDescription[locale]}</p>
        <div className="card__price">
          {product.price > 0 ? (
            <>
              {/* Un tableau en plusieurs formats n'a pas un prix mais un point de départ. */}
              {priceRange(product).high > product.price && <span className="card__from">{t.common.from}</span>}
              <strong>{formatPrice(priceRange(product).low, locale)}</strong>
              {product.compareAtPrice ? <del>{formatPrice(product.compareAtPrice, locale)}</del> : null}
            </>
          ) : (
            <strong>{t.common.onRequest}</strong>
          )}
        </div>
      </div>
    </Link>
  );
}

export function CategoryCard({ category, locale }: { category: Category; locale: Locale }) {
  const t = getDict(locale);
  const from = priceFrom(category.id);
  const n = countByCategory(category.id);

  return (
    <Link href={routes.category(locale, category)} className="card cat-card">
      <div className="card__media">
        <ProductImage
          src={category.image}
          alt={category.name[locale]}
          seed={category.id}
          {...(category.image?.includes('/categories/')
            ? { width: 800, height: 587, sizes: '(min-width: 1080px) 520px, (min-width: 640px) 50vw, 100vw' }
            : {})}
        />
      </div>
      <div className="card__body">
        <h3 className="card__title">{category.name[locale]}</h3>
        <p className="card__meta">{category.tagline[locale]}</p>
        <div className="card__price">
          <span className="small muted">{t.products.count(n)}</span>
          {from !== null && (
            <span className="small muted">
              · {t.common.from} {formatPrice(from, locale)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
