import type { Metadata } from 'next';
import CheckoutPageView from '@/views/CheckoutPageView';
import { buildMetadata } from '@/lib/seo';
import { alternates, routes } from '@/lib/routes';

const LOCALE = 'en' as const;

export const metadata: Metadata = {
  ...buildMetadata({
    locale: LOCALE,
    title: "Checkout | MAISON DÉCO",
    description: "Cash on delivery across Morocco.",
    path: routes.checkout(LOCALE),
    alternates: alternates(LOCALE, 'checkout'),
  }),
  robots: { index: false, follow: true },
};

export default function Page() {
  return <CheckoutPageView locale={LOCALE} />;
}
