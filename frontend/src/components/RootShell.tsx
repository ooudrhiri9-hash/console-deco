import type { ReactNode } from 'react';
import { htmlLang, type Locale } from '@/i18n/config';
import { getDict } from '@/i18n/dictionaries';
import { fontClass } from '@/lib/fonts';
import { CartProvider } from './CartProvider';
import { LiveCatalogueProvider } from './LiveCatalogue';
import Header from './Header';
import Footer from './Footer';
import WhatsappFloat from './WhatsappFloat';
import '@/styles/globals.css';

/**
 * The one <html>/<body> shell, shared by the FR and EN root layouts.
 * Kept in a component so the two layouts cannot drift apart.
 */
export default function RootShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  const t = getDict(locale);
  return (
    // The next/font variable classes MUST sit on <html>, not <body>: the font
    // tokens in globals.css are declared on :root, and a var() nested inside a
    // custom property resolves on the element that declares it. On <body> the
    // whole --font-sans token computes to invalid and the page falls back to
    // the browser's default serif.
    <html lang={htmlLang[locale]} className={fontClass}>
      {/* suppressHydrationWarning applies to THIS element's own attributes only,
          not to its subtree — real mismatches inside the app still surface.
          Browser extensions (ColorZilla's cz-shortcut-listen, Grammarly's
          data-gr-*, dark-mode add-ons) stamp attributes on <body> before React
          hydrates, which otherwise logs a mismatch we cannot fix or reproduce. */}
      <body suppressHydrationWarning>
        <LiveCatalogueProvider>
        <CartProvider>
          <a className="skip-link" href="#main">
            {t.common.skipToContent}
          </a>
          <Header locale={locale} />
          <main id="main">{children}</main>
          <Footer locale={locale} />
          <WhatsappFloat locale={locale} />
        </CartProvider>
        </LiveCatalogueProvider>
      </body>
    </html>
  );
}
