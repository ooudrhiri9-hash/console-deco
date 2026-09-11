'use client';

import type { Locale } from '@/i18n/config';
import { getDict } from '@/i18n/dictionaries';
import { routes } from '@/lib/routes';
import Link from './Link';
import { ProductCard } from './Cards';
import { useBestSellers } from './LiveCatalogue';
import { ArrowIcon } from './Icons';

/**
 * Les pièces les plus commandées.
 *
 * Le classement vient des commandes réelles, calculé par l'API. Tant qu'il n'y
 * a pas assez de ventes pour classer, la section ne s'affiche pas du tout :
 * une boutique neuve n'a pas de meilleures ventes, et en inventer une reviendrait
 * à promettre au visiteur une popularité qui n'existe pas.
 *
 * Comme le reste du catalogue, le classement se rafraîchit dans le navigateur :
 * la section apparaît d'elle-même dès que les commandes le permettent, sans
 * reconstruction du site.
 */
export default function BestSellers({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const ranked = useBestSellers();

  if (ranked.length === 0) return null;

  return (
    <section className="section container">
      <div className="section-head">
        <span className="eyebrow">{t.home.bestSellersEyebrow}</span>
        <h2 className="h-1">{t.home.bestSellersTitle}</h2>
        <p>{t.home.bestSellersText}</p>
      </div>

      <div className="grid grid--4">
        {ranked.map(({ product }, i) => (
          <div className="ranked" key={product.id}>
            <span className="ranked__badge" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
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
