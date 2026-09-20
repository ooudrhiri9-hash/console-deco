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
  // Le SVG d'abord, net a toute taille ; le .ico derriere, pour les navigateurs
  // qui ne le lisent pas et pour ceux qui demandent /favicon.ico sans regarder
  // la page. Le fichier est fabrique par scripts/prepare-favicon.mjs.
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
    ],
    // Le site ajoute a l'ecran d'accueil d'un iPhone : sans cette icone, iOS
    // met une capture de la page, illisible a cette taille.
    apple: '/apple-touch-icon.png',
  },
};

export const viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
};

export default function FrRootLayout({ children }: { children: ReactNode }) {
  return <RootShell locale="fr">{children}</RootShell>;
}
