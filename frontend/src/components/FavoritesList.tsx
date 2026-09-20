'use client';

import type { Locale } from '@/i18n/config';
import { getDict } from '@/i18n/dictionaries';
import { allProducts } from '@/lib/catalogue';
import { routes } from '@/lib/routes';
import { ProductCard } from './Cards';
import { useFavorites } from './FavoritesProvider';
import { HeartIcon } from './Icons';
import { useLiveCatalogue } from './LiveCatalogue';
import Link from './Link';

/**
 * Les pièces gardées, lues dans le catalogue en direct quand il est arrivé,
 * sinon dans l'instantané du build. Une pièce retirée depuis disparaît sans
 * bruit : il n'y a rien à acheter derrière sa carte.
 */
export default function FavoritesList({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const { slugs, ready } = useFavorites();
  const live = useLiveCatalogue();
  const source = live ? live.products : allProducts;

  if (!ready) return <p className="muted">{t.common.loading}</p>;

  const list = slugs
    .map((slug) => source.find((p) => p.slug === slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  if (!list.length) {
    return (
      <div className="empty-state stack">
        <HeartIcon size={36} />
        <p>
          <strong>{t.favorites.empty}</strong>
        </p>
        <p className="muted">{t.favorites.emptyText}</p>
        <Link href={routes.products(locale)} className="btn btn--primary">
          {t.cart.emptyCta}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid--4">
      {list.map((p) => (
        <ProductCard key={p.id} product={p} locale={locale} />
      ))}
    </div>
  );
}
