import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import RootShell from '@/components/RootShell';
import { site } from '@/config/site';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: `${site.brand} — ${site.baseline.en}`,
  description: site.baseline.en,
  applicationName: site.brand,
  formatDetection: { telephone: true, address: true, email: true },
  // Le SVG d'abord, net a toute taille ; le .ico derriere, pour les navigateurs
  // qui ne le lisent pas et pour ceux qui demandent /favicon.ico sans regarder
  // la page. Le fichier est fabrique par scripts/prepare-favicon.mjs.
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
    ],
  },
};

export const viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
};

export default function EnRootLayout({ children }: { children: ReactNode }) {
  return <RootShell locale="en">{children}</RootShell>;
}
