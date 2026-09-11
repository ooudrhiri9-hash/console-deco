import { Suspense } from 'react';
import type { Metadata } from 'next';
import PieceFallback from '@/components/PieceFallback';
import { getDict } from '@/i18n/dictionaries';

/**
 * Sheet for a piece created after the last build (?slug=…).
 * Never indexed: the real product page takes over at the next build.
 */
export const metadata: Metadata = {
  title: 'Pièce — ATELIER OMAR',
  robots: { index: false, follow: true },
};

export default function PiecePage() {
  return (
    <Suspense fallback={<div className="container section">{getDict('fr').common.loading}</div>}>
      <PieceFallback locale="fr" />
    </Suspense>
  );
}
