import type { Metadata } from 'next';
import FavoritesPageView from '@/views/FavoritesPageView';
import { buildMetadata } from '@/lib/seo';
import { alternates, routes } from '@/lib/routes';

const LOCALE = 'fr' as const;

export const metadata: Metadata = {
  ...buildMetadata({
    locale: LOCALE,
    title: "Vos favoris | MAISON DÉCO",
    description: "Les pièces que vous avez mises de côté.",
    path: routes.favorites(LOCALE),
    alternates: alternates(LOCALE, 'favorites'),
  }),
  robots: { index: false, follow: true },
};

export default function Page() {
  return <FavoritesPageView locale={LOCALE} />;
}
