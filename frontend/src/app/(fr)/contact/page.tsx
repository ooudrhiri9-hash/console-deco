import type { Metadata } from 'next';
import ContactView from '@/views/ContactView';
import { buildMetadata } from '@/lib/seo';
import { alternates, routes } from '@/lib/routes';

const LOCALE = 'fr' as const;

export const metadata: Metadata = {
  ...buildMetadata({
    locale: LOCALE,
    title: "Contact — devis et commandes | MAISON DÉCO",
    description: "Contactez notre atelier : devis sur mesure, disponibilité, délais de livraison. Réponse rapide par WhatsApp, téléphone ou formulaire.",
    path: routes.contact(LOCALE),
    alternates: alternates(LOCALE, 'contact'),
  }),
};

export default function Page() {
  return <ContactView locale={LOCALE} />;
}
