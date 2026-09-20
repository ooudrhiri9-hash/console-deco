'use client';

import { useState, type CSSProperties } from 'react';
import type { Product } from '@/types';
import type { Locale } from '@/i18n/config';
import ProductImage from './ProductImage';

/**
 * Photos de la pièce. `frame` : la teinte du cadre choisi sur la fiche — la
 * photo principale est alors entourée d'une moulure dessinée en CSS, sans
 * image de plus à charger. Sans teinte (« sans cadre », ou un meuble), rien
 * ne change.
 */
export default function ProductGallery({
  product,
  locale,
  frame,
}: {
  product: Product;
  locale: Locale;
  frame?: string;
}) {
  const [active, setActive] = useState(0);
  const images = product.images.length ? product.images : [undefined];
  const shown = Math.min(active, images.length - 1);

  return (
    <div className="product__gallery">
      <div
        className={`product__main${frame ? ' is-framed' : ''}`}
        style={frame ? ({ '--frame': frame } as CSSProperties) : undefined}
      >
        <ProductImage
          src={images[shown]}
          alt={product.name[locale]}
          seed={product.slug}
          priority
        />
      </div>

      {images.length > 1 && (
        <div className="product__thumbs">
          {images.map((src, i) => (
            <button
              key={src ?? i}
              onClick={() => setActive(i)}
              aria-current={i === shown}
              aria-label={`${product.name[locale]} — ${i + 1}`}
            >
              <ProductImage src={src} alt="" seed={`${product.slug}-${i}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
