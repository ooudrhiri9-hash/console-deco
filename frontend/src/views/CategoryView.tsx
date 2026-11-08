import type { Locale } from '@/i18n/config';
import type { Category } from '@/types';
import { getDict } from '@/i18n/dictionaries';
import { productsInCategory } from '@/lib/catalogue';
import { routes } from '@/lib/routes';
import Breadcrumbs from '@/components/Breadcrumbs';
import CatalogueGrid from '@/components/CatalogueGrid';
import OrderSteps from '@/components/OrderSteps';
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
        <h1 className="sr-only">{category.name[locale]}</h1>

        <CatalogueGrid products={items} locale={locale} categoryId={category.id} />

        {/* La marche a suivre, identique partout : c'est un repere, pas du
            contenu editorial — le dupliquer ne dilue donc rien. */}
        <OrderSteps locale={locale} />
      </div>
    </>
  );
}
