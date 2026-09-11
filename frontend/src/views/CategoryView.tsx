import Link from '@/components/Link';
import type { Locale } from '@/i18n/config';
import type { Category } from '@/types';
import { getDict } from '@/i18n/dictionaries';
import { categoriesInOrder, productsInCategory } from '@/lib/catalogue';
import { routes } from '@/lib/routes';
import Breadcrumbs from '@/components/Breadcrumbs';
import CatalogueGrid from '@/components/CatalogueGrid';
import { itemListJsonLd, JsonLd } from '@/lib/seo';

export default function CategoryView({
  category,
  locale,
}: {
  category: Category;
  locale: Locale;
}) {
  const t = getDict(locale);
  const items = productsInCategory(category.id);

  return (
    <>
      <JsonLd data={itemListJsonLd(items, locale)} />

      <Breadcrumbs
        items={[
          { label: t.nav.home, href: routes.home(locale) },
          { label: t.nav.products, href: routes.products(locale) },
          { label: category.name[locale] },
        ]}
      />

      <div className="container section--tight">
        <div className="section-head">
          <span className="eyebrow">{category.tagline[locale]}</span>
          <h1 className="h-1" style={{ marginBlock: '.75rem' }}>
            {category.name[locale]}
          </h1>
          <p>{category.description[locale]}</p>
        </div>

        <div className="filters">
          <Link href={routes.products(locale)} className="chip">
            {t.products.filterAll}
          </Link>
          {categoriesInOrder.map((c) => (
            <Link
              key={c.id}
              href={routes.category(locale, c)}
              className="chip"
              aria-current={c.id === category.id ? 'true' : undefined}
            >
              {c.name[locale]}
            </Link>
          ))}
        </div>

        <CatalogueGrid products={items} locale={locale} categoryId={category.id} />
      </div>
    </>
  );
}
