import type { Metadata } from 'next';
import CartPageView from '@/views/CartPageView';
import { buildMetadata } from '@/lib/seo';
import { alternates, routes } from '@/lib/routes';

const LOCALE = 'en' as const;

export const metadata: Metadata = {
  ...buildMetadata({
    locale: LOCALE,
    title: "Your cart | ATELIER OMAR",
    description: "The pieces you have selected.",
    path: routes.cart(LOCALE),
    alternates: alternates(LOCALE, 'cart'),
  }),
  robots: { index: false, follow: true },
};

export default function Page() {
  return <CartPageView locale={LOCALE} />;
}
