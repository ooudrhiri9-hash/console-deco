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
  title: 'Back office — Atelier Omar',
  // Belt and braces with the Disallow in robots.ts: a page that is linked from
  // nowhere still gets found, and this is the rule a crawler honours.
  robots: { index: false, follow: false, nocache: true },
  icons: { icon: '/favicon.svg' },
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
