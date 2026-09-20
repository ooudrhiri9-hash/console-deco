import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { site } from '@/config/site';
import { categories } from '@/lib/catalogue';
import { alternates, categoryBySlug, routes } from '@/lib/routes';
import CategoryView from '@/views/CategoryView';
import { buildMetadata, categoryMetaTitle, categoryMetaDescription } from '@/lib/seo';

const LOCALE = 'en' as const;

/** Static export: only these paths exist, nothing is generated on demand. */
export const dynamicParams = false;

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug[LOCALE] }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const c = categoryBySlug(LOCALE, category);
  if (!c) return {};
  return buildMetadata({
    locale: LOCALE,
    title: categoryMetaTitle(c.name[LOCALE], LOCALE),
    description: categoryMetaDescription(c.description[LOCALE]),
    path: routes.category(LOCALE, c),
    alternates: alternates(LOCALE, 'category', c),
  });
}

export default async function Page({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const c = categoryBySlug(LOCALE, category);
  if (!c) notFound();
  return <CategoryView category={c} locale={LOCALE} />;
}
