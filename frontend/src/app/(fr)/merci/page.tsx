import type { Metadata } from 'next';
import ThanksPageView from '@/views/ThanksPageView';
import { buildMetadata } from '@/lib/seo';
import { alternates, routes } from '@/lib/routes';

const LOCALE = 'fr' as const;

export const metadata: Metadata = {
  ...buildMetadata({
    locale: LOCALE,
    title: "Merci pour votre commande | MAISON DÉCO",
    description: "Votre commande est bien arrivée. Nous vous appelons pour la confirmer.",
    path: routes.thanks(LOCALE),
    alternates: alternates(LOCALE, 'thanks'),
  }),
  robots: { index: false, follow: true },
};

export default function Page() {
  return <ThanksPageView locale={LOCALE} />;
}
