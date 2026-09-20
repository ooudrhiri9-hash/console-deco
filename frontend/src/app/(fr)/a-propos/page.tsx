import type { Metadata } from 'next';
import AboutView from '@/views/AboutView';
import { buildMetadata } from '@/lib/seo';
import { alternates, routes } from '@/lib/routes';

const LOCALE = 'fr' as const;

export const metadata: Metadata = {
  ...buildMetadata({
    locale: LOCALE,
    title: "À propos — notre atelier au Maroc | MAISON DÉCO",
    description: "Un atelier marocain qui dessine, fabrique et finit chaque console, table et tableau à la main. Bois massif, laiton, pierre et toile, en séries limitées.",
    path: routes.about(LOCALE),
    alternates: alternates(LOCALE, 'about'),
  }),
};

export default function Page() {
  return <AboutView locale={LOCALE} />;
}
