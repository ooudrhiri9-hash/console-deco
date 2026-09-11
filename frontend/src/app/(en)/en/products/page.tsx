import type { Metadata } from 'next';
import ProductsView from '@/views/ProductsView';
import { buildMetadata } from '@/lib/seo';
import { alternates, routes } from '@/lib/routes';

const LOCALE = 'en' as const;

export const metadata: Metadata = buildMetadata({
  locale: LOCALE,
  title: "Consoles, tables and wall art | ATELIER OMAR",
  description: "Every piece: consoles, console + artwork sets, coffee tables, side tables and wall art. Handmade in Morocco, delivered across the Kingdom.",
  path: routes.products(LOCALE),
  alternates: alternates(LOCALE, 'products'),
});

export default function Page() {
  return <ProductsView locale={LOCALE} />;
}
