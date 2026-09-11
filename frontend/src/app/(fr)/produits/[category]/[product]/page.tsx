import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { site } from '@/config/site';
import { categories, allProducts, productBySlug } from '@/lib/catalogue';
import { alternates, routes } from '@/lib/routes';
import LiveProductView from '@/components/LiveProductView';
import { buildMetadata, productMetaDescription } from '@/lib/seo';

const LOCALE = 'fr' as const;

export const dynamicParams = false;

export function generateStaticParams() {
  return allProducts.map((p) => {
    const c = categories.find((x) => x.id === p.categoryId);
    return { category: c ? c.slug[LOCALE] : 'divers', product: p.slug };
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; product: string }>;
}): Promise<Metadata> {
  const { product } = await params;
  const p = productBySlug(product);
  if (!p) return {};
  return buildMetadata({
    locale: LOCALE,
    title: `${p.name[LOCALE]} — ${site.brand}`,
    description: productMetaDescription(p, LOCALE),
    path: routes.product(LOCALE, p),
    alternates: alternates(LOCALE, 'product', p),
    image: p.images[0],
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ category: string; product: string }>;
}) {
  const { product } = await params;
  const p = productBySlug(product);
  if (!p) notFound();
  return <LiveProductView product={p} locale={LOCALE} />;
}
