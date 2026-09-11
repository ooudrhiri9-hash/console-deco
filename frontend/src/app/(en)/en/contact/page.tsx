import type { Metadata } from 'next';
import ContactView from '@/views/ContactView';
import { buildMetadata } from '@/lib/seo';
import { alternates, routes } from '@/lib/routes';

const LOCALE = 'en' as const;

export const metadata: Metadata = {
  ...buildMetadata({
    locale: LOCALE,
    title: "Contact — quotes and orders | ATELIER OMAR",
    description: "Get in touch with our workshop: bespoke quotes, availability, delivery times. Fast reply on WhatsApp, by phone or through the form.",
    path: routes.contact(LOCALE),
    alternates: alternates(LOCALE, 'contact'),
  }),
};

export default function Page() {
  return <ContactView locale={LOCALE} />;
}
