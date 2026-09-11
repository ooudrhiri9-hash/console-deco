import type { Metadata } from 'next';
import HomeView from '@/views/HomeView';
import { buildMetadata } from '@/lib/seo';
import { alternates, routes } from '@/lib/routes';

const LOCALE = 'fr' as const;

export const metadata: Metadata = buildMetadata({
  locale: LOCALE,
  title: "Mobilier d'art et tableaux au Maroc | ATELIER OMAR",
  description: "Consoles, tables basses, tables d'appoint et tableaux faits main au Maroc. Séries limitées, sur mesure possible, paiement à la livraison.",
  path: routes.home(LOCALE),
  alternates: alternates(LOCALE, 'home'),
});

export default function Page() {
  return <HomeView locale={LOCALE} />;
}
