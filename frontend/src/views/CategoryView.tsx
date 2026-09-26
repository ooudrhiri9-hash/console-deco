import Link from '@/components/Link';
import type { Locale } from '@/i18n/config';
import type { Category } from '@/types';
import { getDict } from '@/i18n/dictionaries';
import { listedCategories, productsInCategory } from '@/lib/catalogue';
import { routes } from '@/lib/routes';
import Breadcrumbs from '@/components/Breadcrumbs';
import CatalogueGrid from '@/components/CatalogueGrid';
import CustomDesignNotice from '@/components/CustomDesignNotice';
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
          {listedCategories.map((c) => (
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

        {/* Avant la grille : un visiteur qui cherche son motif doit savoir tout
            de suite qu'il peut l'apporter, pas apres 28 pieces. */}
        {category.id === 'consoles' && <CustomDesignNotice locale={locale} />}

        <CatalogueGrid products={items} locale={locale} categoryId={category.id} />

        {/* Le texte propre a la famille est en haut, ecrit dans /admin et
            different d'une famille a l'autre. Ici, seulement la marche a
            suivre, identique partout : c'est un repere, pas du contenu
            editorial — le dupliquer ne dilue donc rien. */}
        <OrderSteps locale={locale} />
      </div>
    </>
  );
}
