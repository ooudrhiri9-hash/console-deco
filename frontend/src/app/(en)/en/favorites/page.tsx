import type { Metadata } from 'next';
import FavoritesPageView from '@/views/FavoritesPageView';
import { buildMetadata } from '@/lib/seo';
import { alternates, routes } from '@/lib/routes';

const LOCALE = 'en' as const;

export const metadata: Metadata = {
  ...buildMetadata({
    locale: LOCALE,
    title: "Your favourites | MAISON DÉCO",
    description: "The pieces you have set aside.",
    path: routes.favorites(LOCALE),
    alternates: alternates(LOCALE, 'favorites'),
  }),
  robots: { index: false, follow: true },
};

export default function Page() {
  return <FavoritesPageView locale={LOCALE} />;
}
