'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { OptionChoice, Product } from '@/types';
import type { Locale } from '@/i18n/config';
import { getDict } from '@/i18n/dictionaries';
import { site } from '@/config/site';
import { routes } from '@/lib/routes';
import { productMessage, waLink } from '@/lib/whatsapp';
import { useCart } from './CartProvider';
import { WhatsappIcon } from './Icons';

export default function AddToCart({
  product,
  locale,
  choice,
}: {
  product: Product;
  locale: Locale;
  /** Cadre, dimensions… choisis juste au-dessus. */
  choice?: OptionChoice;
}) {
  const t = getDict(locale);
  const router = useRouter();
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const onAdd = () => {
    add(product, qty, choice);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  const wa = waLink(
    productMessage(product, locale, qty, `${site.url}${routes.product(locale, product)}`, choice),
  );

  return (
    <>
      <div className="buy-row">
        <div className="qty" role="group" aria-label={t.products.quantity}>
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="-">
            −
          </button>
          <span aria-live="polite">{qty}</span>
          <button onClick={() => setQty((q) => Math.min(99, q + 1))} aria-label="+">
            +
          </button>
        </div>

        <button className="btn btn--primary" onClick={onAdd}>
          {added ? t.products.added : t.products.addToCart}
        </button>
      </div>

      <div className="buy-row" style={{ marginTop: '-0.5rem' }}>
        <a className="btn btn--whatsapp" href={wa} target="_blank" rel="noopener noreferrer">
          <WhatsappIcon size={18} />
          {t.products.orderWhatsapp}
        </a>
        <button className="btn btn--outline" onClick={() => router.push(routes.cart(locale))}>
          {t.cart.checkout}
        </button>
      </div>
    </>
  );
}
