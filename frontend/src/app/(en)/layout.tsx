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
  // Propriete Google Search Console. Next l'ecrit en
  // <meta name="google-site-verification">. A garder tant que la propriete
  // existe : Google la reverifie, la retirer fait perdre l'acces.
  verification: { google: 'pZLGxVZ7GOqUKJdp7QVsPuPWNIDqAa3HYOFEvxlqOu4' },
  // Le SVG d'abord, net a toute taille ; le .ico derriere, pour les navigateurs
  // qui ne le lisent pas et pour ceux qui demandent /favicon.ico sans regarder
  // la page. Le fichier est fabrique par scripts/prepare-favicon.mjs.
  icons: {
    // Plus de SVG : les navigateurs le preferent quand il est declare, et
    // c'etait encore l'icone provisoire dessinee avant le vrai logo. Les
    // fichiers sont produits par scripts/prepare-logo.mjs a partir de
    // src/brand/logo.jpg.
    icon: [{ url: '/favicon.ico', sizes: '16x16 32x32 48x48' }],
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

export default function EnRootLayout({ children }: { children: ReactNode }) {
  return <RootShell locale="en">{children}</RootShell>;
}
