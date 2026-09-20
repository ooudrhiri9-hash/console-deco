import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { fontClass } from '@/lib/fonts';
import '@/styles/globals.css';
import '@/styles/admin.css';

/**
 * The back office has its own <html>: it must not inherit the shop's header,
 * footer, cart provider or WhatsApp button.
 *
 * Its pages are client-only — they hold no catalogue data at build time, they
 * read everything from the API once the owner has signed in — so exporting them
 * as static HTML leaks nothing.
 */
export const metadata: Metadata = {
  title: 'Back office — Maison Déco',
  // Belt and braces with the Disallow in robots.ts: a page that is linked from
  // nowhere still gets found, and this is the rule a crawler honours.
  robots: { index: false, follow: false, nocache: true },
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
  width: 'device-width',
  initialScale: 1,
  themeColor: '#14120f',
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={fontClass}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
