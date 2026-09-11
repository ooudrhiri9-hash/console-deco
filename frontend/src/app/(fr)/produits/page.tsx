import type { Metadata } from 'next';
import ProductsView from '@/views/ProductsView';
import { buildMetadata } from '@/lib/seo';
import { alternates, routes } from '@/lib/routes';

const LOCALE = 'fr' as const;

export const metadata: Metadata = buildMetadata({
  locale: LOCALE,
  title: "Consoles, tables et tableaux | ATELIER OMAR",
  description: "Toutes nos pièces : consoles, ensembles console + tableau, tables basses, tables d'appoint et tableaux. Fabrication artisanale au Maroc.",
  path: routes.products(LOCALE),
  alternates: alternates(LOCALE, 'products'),
});

export default function Page() {
  return <ProductsView locale={LOCALE} />;
}
