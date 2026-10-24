'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { GOOGLE_ADS_ID, conversion, gtagEvent } from '@/lib/gtag';

/**
 * La balise Google (gtag.js) pour Google Ads.
 *
 * Comme pour le pixel Meta, le page_view du script ne part qu'au premier
 * chargement : il est renvoyé à chaque changement d'adresse (listes de
 * remarketing).
 *
 * Les clics WhatsApp et téléphone sont suivis par un seul écouteur sur le
 * document plutôt que bouton par bouton : les liens wa.me et tel: sont
 * répartis dans une dizaine de composants, et un nouveau bouton est suivi
 * sans qu'on ait à y penser.
 */
export default function GoogleTag() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    gtagEvent('page_view', { page_path: pathname });
  }, [pathname]);

  useEffect(() => {
    if (!GOOGLE_ADS_ID) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href]');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      if (href.startsWith('tel:')) conversion('phone');
      else if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)) conversion('whatsapp');
    };
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  if (!GOOGLE_ADS_ID) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`} strategy="afterInteractive" />
      <Script id="google-tag" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());gtag('config','${GOOGLE_ADS_ID}');`}
      </Script>
    </>
  );
}
