import type { Metadata } from 'next';
import CheckoutPageView from '@/views/CheckoutPageView';
import { buildMetadata } from '@/lib/seo';
import { alternates, routes } from '@/lib/routes';

const LOCALE = 'fr' as const;

export const metadata: Metadata = {
  ...buildMetadata({
    locale: LOCALE,
    title: "Finaliser la commande | ATELIER OMAR",
    description: "Paiement à la livraison partout au Maroc.",
    path: routes.checkout(LOCALE),
    alternates: alternates(LOCALE, 'checkout'),
  }),
  robots: { index: false, follow: true },
};

export default function Page() {
  return <CheckoutPageView locale={LOCALE} />;
}
