import Link from '@/components/Link';
import type { Locale } from '@/i18n/config';
import { getDict } from '@/i18n/dictionaries';
import { allProducts, listedCategories } from '@/lib/catalogue';
import { routes } from '@/lib/routes';
import Breadcrumbs from '@/components/Breadcrumbs';
import CatalogueGrid from '@/components/CatalogueGrid';
import { itemListJsonLd, JsonLd } from '@/lib/seo';

export default function ProductsView({ locale }: { locale: Locale }) {
  const t = getDict(locale);

  return (
    <>
      <JsonLd data={itemListJsonLd(allProducts, locale)} />

      <Breadcrumbs
        items={[
          { label: t.nav.home, href: routes.home(locale) },
          { label: t.nav.products },
        ]}
      />

      <div className="container section--tight">
        <div className="section-head">
          <h1 className="h-1">{t.products.title}</h1>
          <p>{t.products.intro}</p>
        </div>

        {/* Real links, not client-side filters: each collection is its own
            indexable page with its own copy. */}
        <div className="filters">
          <span className="chip is-active">{t.products.filterAll}</span>
          {listedCategories.map((c) => (
            <Link key={c.id} href={routes.category(locale, c)} className="chip">
              {c.name[locale]}
            </Link>
          ))}
        </div>

        <CatalogueGrid products={allProducts} locale={locale} />
      </div>
    </>
  );
}
