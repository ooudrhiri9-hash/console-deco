import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import RootShell from '@/components/RootShell';
import { site } from '@/config/site';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: `${site.brand} — ${site.baseline.fr}`,
  description: site.baseline.fr,
  applicationName: site.brand,
  formatDetection: { telephone: true, address: true, email: true },
  icons: { icon: '/favicon.svg' },
};

export const viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
};

export default function FrRootLayout({ children }: { children: ReactNode }) {
  return <RootShell locale="fr">{children}</RootShell>;
}
