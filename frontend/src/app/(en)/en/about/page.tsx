import type { Metadata } from 'next';
import AboutView from '@/views/AboutView';
import { buildMetadata } from '@/lib/seo';
import { alternates, routes } from '@/lib/routes';

const LOCALE = 'en' as const;

export const metadata: Metadata = {
  ...buildMetadata({
    locale: LOCALE,
    title: "About — our workshop in Morocco | MAISON DÉCO",
    description: "A Moroccan workshop that designs, builds and finishes every console, table and artwork by hand. Solid wood, brass, stone and canvas, in limited runs.",
    path: routes.about(LOCALE),
    alternates: alternates(LOCALE, 'about'),
  }),
};

export default function Page() {
  return <AboutView locale={LOCALE} />;
}
