'use client';

import { useMemo, useState } from 'react';
import type { Product } from '@/types';
import type { Locale } from '@/i18n/config';
import { getDict } from '@/i18n/dictionaries';
import { ProductCard } from './Cards';
import { useLiveList } from './LiveCatalogue';

type Sort = 'default' | 'asc' | 'desc';

/**
 * Grid + client-side sort. Category filtering is deliberately NOT done here:
 * the category chips are real links to /produits/<category>/ so every
 * collection is a crawlable page with its own copy and its own meta tags.
 */
export default function CatalogueGrid({
  products: built,
  locale,
  categoryId,
}: {
  products: Product[];
  locale: Locale;
  /** Limits the live refresh to one family; omit on the full catalogue. */
  categoryId?: string;
}) {
  const t = getDict(locale);
  const [sort, setSort] = useState<Sort>('default');
  // Pieces put on sale since the last build appear here without a rebuild;
  // pieces hidden in /admin drop out.
  const products = useLiveList(built, categoryId);

  const sorted = useMemo(() => {
    if (sort === 'default') return products;
    const withPrice = [...products];
    withPrice.sort((a, b) => (sort === 'asc' ? a.price - b.price : b.price - a.price));
    return withPrice;
  }, [products, sort]);

  if (!products.length) {
    return <p className="empty-state">{t.products.empty}</p>;
  }

  return (
    <>
      <div className="filters" style={{ borderTop: 0 }}>
        <span className="small muted">{t.products.count(products.length)}</span>
        <div className="filters__spacer" />
        <label className="sr-only" htmlFor="sort">
          {t.products.sort}
        </label>
        <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="default">{t.products.sortDefault}</option>
          <option value="asc">{t.products.sortPriceAsc}</option>
          <option value="desc">{t.products.sortPriceDesc}</option>
        </select>
      </div>

      <div className="grid grid--3">
        {sorted.map((p, i) => (
          <ProductCard key={p.id} product={p} locale={locale} priority={i < 3} />
        ))}
      </div>
    </>
  );
}
