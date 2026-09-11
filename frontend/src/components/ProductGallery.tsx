'use client';

import { useState } from 'react';
import type { Product } from '@/types';
import type { Locale } from '@/i18n/config';
import ProductImage from './ProductImage';

export default function ProductGallery({ product, locale }: { product: Product; locale: Locale }) {
  const [active, setActive] = useState(0);
  const images = product.images.length ? product.images : [undefined];

  return (
    <div className="product__gallery">
      <div className="product__main">
        <ProductImage
          src={images[active]}
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
              aria-current={i === active}
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
