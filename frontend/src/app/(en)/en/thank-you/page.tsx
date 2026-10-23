import type { Metadata } from 'next';
import ThanksPageView from '@/views/ThanksPageView';
import { buildMetadata } from '@/lib/seo';
import { alternates, routes } from '@/lib/routes';

const LOCALE = 'en' as const;

export const metadata: Metadata = {
  ...buildMetadata({
    locale: LOCALE,
    title: "Thank you for your order | MAISON DÉCO",
    description: "Your order has reached us. We will call you to confirm it.",
    path: routes.thanks(LOCALE),
    alternates: alternates(LOCALE, 'thanks'),
  }),
  robots: { index: false, follow: true },
};

export default function Page() {
  return <ThanksPageView locale={LOCALE} />;
}
