'use client';

import type { Locale } from '@/i18n/config';
import { getDict } from '@/i18n/dictionaries';
import { routes } from '@/lib/routes';
import Link from './Link';
import { ProductCard } from './Cards';
import { useBestSellers } from './LiveCatalogue';
import { ArrowIcon } from './Icons';

/**
 * Les pièces les plus vendues.
 *
 * Deux sources, dans cet ordre. Les commandes enregistrées d'abord : l'API les
 * compte et la boutique numérote le classement, 01 à 04. À défaut — une bonne
 * part des ventes se conclut sur WhatsApp ou à l'atelier et n'atteint jamais la
 * table des commandes — la sélection cochée dans /admin prend le relais, sans
 * numéros : le patron désigne ses pièces phares, il n'annonce pas un comptage
 * qui n'a pas eu lieu. Sans commandes ni sélection, la section disparaît
 * plutôt que d'inventer un palmarès.
 *
 * Comme le reste du catalogue, tout cela se rafraîchit dans le navigateur : une
 * case cochée dans /admin se voit au rechargement, sans reconstruire le site.
 */
export default function BestSellers({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const { items, source } = useBestSellers();
  const counted = source === 'orders';

  if (items.length === 0) return null;

  return (
    <section className="section container">
      <div className="section-head">
        <span className="eyebrow">{t.home.bestSellersEyebrow}</span>
        <h2 className="h-1">{t.home.bestSellersTitle}</h2>
        <p>{counted ? t.home.bestSellersText : t.home.bestSellersTextPicked}</p>
      </div>

      <div className="grid grid--4">
        {items.map(({ product }, i) => (
          <div className={counted ? 'ranked' : undefined} key={product.id}>
            {counted && (
              <span className="ranked__badge" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
            )}
            <ProductCard product={product} locale={locale} />
          </div>
        ))}
      </div>

      <div className="mt-3">
        <Link href={routes.products(locale)} className="link-underline">
          {t.common.seeAll} <ArrowIcon />
        </Link>
      </div>
    </section>
  );
}
