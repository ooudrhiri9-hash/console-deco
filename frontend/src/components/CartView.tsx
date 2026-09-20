'use client';

import Link from '@/components/Link';
import type { Locale } from '@/i18n/config';
import { getDict } from '@/i18n/dictionaries';
import { site } from '@/config/site';
import { routes } from '@/lib/routes';
import { formatPrice } from '@/lib/format';
import { choiceLabels } from '@/lib/options';
import { useCart } from './CartProvider';
import ProductImage from './ProductImage';

export default function CartView({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const { lines, subtotal, setQty, remove, ready } = useCart();

  // The cart lives in localStorage, so the statically exported HTML cannot know
  // it. Render a neutral block until hydration to avoid a flash of "empty".
  if (!ready) return <div className="empty-state">{t.common.loading}</div>;

  if (!lines.length) {
    return (
      <div className="empty-state stack">
        <p>{t.cart.empty}</p>
        <Link href={routes.products(locale)} className="btn btn--primary">
          {t.cart.emptyCta}
        </Link>
      </div>
    );
  }

  const threshold = site.freeShippingThreshold;
  const freeShipping = threshold > 0 && subtotal >= threshold;
  // Une pièce sur devis ne pèse rien dans le sous-total : le dire, plutôt que
  // de laisser croire à un panier moins cher qu'il ne sera.
  const quoted = lines.some((l) => l.price === 0);
  const missing = threshold > 0 ? Math.max(0, threshold - subtotal) : 0;

  return (
    <div className="cart-layout">
      <div>
        {lines.map(({ product, qty, choice, key, price }) => (
          <div className="cart-line" key={key}>
            <Link href={routes.product(locale, product)} className="cart-line__media">
              <ProductImage src={product.images[0]} alt={product.name[locale]} seed={product.slug} />
            </Link>

            <div>
              <Link href={routes.product(locale, product)} className="cart-line__name">
                {product.name[locale]}
              </Link>
              <div className="cart-line__ref">
                {t.common.reference} {product.id}
              </div>
              {/* Le cadre et la taille font la ligne : deux fois la même toile
                  avec deux cadres différents, ce sont deux lignes, et rien ne
                  les distinguerait sans ces libellés. */}
              {choiceLabels(product, choice, locale).map((o) => (
                <div className="cart-line__opt" key={o.name}>
                  {o.name} : <strong>{o.label}</strong>
                </div>
              ))}
              <div className="qty" style={{ marginTop: '.75rem' }}>
                <button onClick={() => setQty(key, qty - 1)} aria-label="-">
                  −
                </button>
                <span>{qty}</span>
                <button onClick={() => setQty(key, qty + 1)} aria-label="+">
                  +
                </button>
              </div>
            </div>

            <div className="cart-line__right">
              {/* Une pièce sans prix, ou faite à vos dimensions, se chiffre
                  à l'atelier : « 0 DH » serait un prix, et un prix faux. */}
              <strong>{price > 0 ? formatPrice(price * qty, locale) : t.common.onRequest}</strong>
              <button className="cart-line__remove" onClick={() => remove(key)}>
                {t.cart.remove}
              </button>
            </div>
          </div>
        ))}

        <Link href={routes.products(locale)} className="link-underline" style={{ marginTop: '2rem' }}>
          {t.cart.continue}
        </Link>
      </div>

      <aside className="summary">
        <div className="summary__row">
          <span>{t.cart.subtotal}</span>
          <span>{subtotal > 0 ? formatPrice(subtotal, locale) : t.common.onRequest}</span>
        </div>
        <div className="summary__row">
          <span>{t.cart.shipping}</span>
          <span>{freeShipping ? t.cart.shippingFree : t.cart.shippingQuote}</span>
        </div>

        {threshold > 0 && !freeShipping && subtotal > 0 && (
          <>
            <div className="progress">
              <i style={{ width: `${Math.min(100, (subtotal / threshold) * 100)}%` }} />
            </div>
            <p className="small muted">{t.cart.missingForFree(formatPrice(missing, locale))}</p>
          </>
        )}

        <div className="summary__row summary__row--total">
          <span>{t.cart.total}</span>
          <span>{subtotal > 0 ? formatPrice(subtotal, locale) : t.common.onRequest}</span>
        </div>

        {quoted && <p className="small muted">{t.cart.quoteNote}</p>}

        <Link href={routes.checkout(locale)} className="btn btn--primary btn--block" style={{ marginTop: '1.25rem' }}>
          {t.cart.checkout}
        </Link>
      </aside>
    </div>
  );
}
