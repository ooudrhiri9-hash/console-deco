'use client';

import { useMemo, useState } from 'react';
import type { Locale } from '@/i18n/config';
import type { Product } from '@/types';
import { getDict } from '@/i18n/dictionaries';
import { discountPercent, formatPrice } from '@/lib/format';
import { routes } from '@/lib/routes';
import { site } from '@/config/site';
import { defaultChoice, unitPrice } from '@/lib/options';
import AddToCart from './AddToCart';
import Link from './Link';
import OptionPicker from './OptionPicker';
import { useLiveProduct } from './LiveCatalogue';

/**
 * Price, availability and the buy buttons — the part of a product page that
 * must never be stale.
 *
 * The static HTML carries the price from the last build (which is what a
 * crawler and a visitor with no JavaScript see); the live catalogue corrects it
 * in place a moment later. A piece withdrawn in /admin says so and stops
 * accepting orders, instead of selling something that no longer exists.
 */
export default function BuyBlock({ product: built, locale }: { product: Product; locale: Locale }) {
  const t = getDict(locale);
  const { product, removed } = useLiveProduct(built);
  const off = discountPercent(product);

  // La sélection part de la fiche construite : le HTML statique affiche donc le
  // même prix que le premier rendu du navigateur. Si le catalogue en direct
  // change les choix ensuite, resolveChoice() les ramène dans les clous.
  const [picked, setPicked] = useState<Record<string, string>>(() => defaultChoice(built));
  const choice = useMemo(() => {
    const out: Record<string, string> = { ...defaultChoice(product) };
    for (const [k, v] of Object.entries(picked)) if (k in out) out[k] = v;
    return out;
  }, [product, picked]);
  const price = unitPrice(product, choice);

  if (removed) {
    return (
      <div className="stack">
        <p className="alert alert--err">{t.common.unavailable}</p>
        <p className="muted">{t.common.unavailableHint}</p>
        <div className="buy-row">
          <Link href={routes.contact(locale)} className="btn btn--primary">
            {t.nav.contact}
          </Link>
          <a href={`tel:${site.phoneHref}`} className="btn btn--outline">
            {site.phone}
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="product__price">
        {product.price > 0 ? (
          <>
            <strong>{formatPrice(price, locale)}</strong>
            {product.compareAtPrice && <del>{formatPrice(product.compareAtPrice, locale)}</del>}
            {off !== null && <span className="off">-{off}%</span>}
          </>
        ) : (
          <strong>{t.common.onRequest}</strong>
        )}
      </div>

      <span className={`stock${product.madeToOrder ? ' stock--order' : ''}`}>
        {product.madeToOrder
          ? `${t.common.madeToOrder}${
              product.leadTimeDays ? ` · ${t.common.leadTime} ${product.leadTimeDays} ${t.common.days}` : ''
            }`
          : t.common.inStock}
      </span>

      <OptionPicker
        product={product}
        locale={locale}
        choice={choice}
        onChange={(optionId, valueId) => setPicked((c) => ({ ...c, [optionId]: valueId }))}
      />

      <AddToCart product={product} locale={locale} choice={choice} />
    </>
  );
}
