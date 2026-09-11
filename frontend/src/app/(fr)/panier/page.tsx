import type { Metadata } from 'next';
import CartPageView from '@/views/CartPageView';
import { buildMetadata } from '@/lib/seo';
import { alternates, routes } from '@/lib/routes';

const LOCALE = 'fr' as const;

export const metadata: Metadata = {
  ...buildMetadata({
    locale: LOCALE,
    title: "Votre panier | ATELIER OMAR",
    description: "Les pièces que vous avez sélectionnées.",
    path: routes.cart(LOCALE),
    alternates: alternates(LOCALE, 'cart'),
  }),
  robots: { index: false, follow: true },
};

export default function Page() {
  return <CartPageView locale={LOCALE} />;
}
