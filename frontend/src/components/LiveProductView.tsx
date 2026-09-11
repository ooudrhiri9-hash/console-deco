'use client';

import type { Locale } from '@/i18n/config';
import type { Product } from '@/types';
import ProductView from '@/views/ProductView';
import { useLiveProduct } from './LiveCatalogue';

/**
 * The product page, re-rendered from the live catalogue.
 *
 * The server output — what a crawler indexes and what a visitor sees first — is
 * built from the snapshot frozen at build time. Once the live catalogue lands,
 * the same sheet is redrawn with the current texts, photos and specs, so an
 * edit made in /admin is visible without waiting for a deploy.
 */
export default function LiveProductView({ product, locale }: { product: Product; locale: Locale }) {
  const { product: live } = useLiveProduct(product);
  return <ProductView product={live} locale={locale} />;
}
