import type { Metadata } from 'next';
import HomeView from '@/views/HomeView';
import { buildMetadata } from '@/lib/seo';
import { alternates, routes } from '@/lib/routes';

const LOCALE = 'en' as const;

export const metadata: Metadata = buildMetadata({
  locale: LOCALE,
  title: "Art furniture and wall art made in Morocco | ATELIER OMAR",
  description: "Consoles, coffee tables, side tables and wall art handmade in Morocco. Limited runs, made to measure, cash on delivery across the country.",
  path: routes.home(LOCALE),
  alternates: alternates(LOCALE, 'home'),
});

export default function Page() {
  return <HomeView locale={LOCALE} />;
}
