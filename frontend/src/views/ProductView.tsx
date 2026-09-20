import type { Locale } from '@/i18n/config';
import type { Product } from '@/types';
import { getDict } from '@/i18n/dictionaries';
import { getCategory, relatedProducts } from '@/lib/catalogue';
import { routes } from '@/lib/routes';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProductDetail from '@/components/ProductDetail';
import { ProductCard } from '@/components/Cards';
import Link from '@/components/Link';
import { ArrowIcon } from '@/components/Icons';
import { JsonLd, productJsonLd } from '@/lib/seo';

export default function ProductView({ product, locale }: { product: Product; locale: Locale }) {
  const t = getDict(locale);
  const category = getCategory(product.categoryId);
  const related = relatedProducts(product, 4);

  return (
    <>
      <JsonLd data={productJsonLd(product, locale, category)} />

      <Breadcrumbs
        items={[
          { label: t.nav.home, href: routes.home(locale) },
          { label: t.nav.products, href: routes.products(locale) },
          ...(category
            ? [{ label: category.name[locale], href: routes.category(locale, category) }]
            : []),
          { label: product.name[locale] },
        ]}
      />

      <div className="container section--tight">
        <ProductDetail product={product} locale={locale} category={category} />

        {related.length > 0 && (
          <section className="section--tight">
            <hr className="rule" style={{ marginBottom: '2.5rem' }} />
            <div className="related-head">
              <h2 className="h-2">{t.products.related}</h2>
              {category && (
                <Link href={routes.category(locale, category)} className="link-underline">
                  {category.name[locale]} <ArrowIcon />
                </Link>
              )}
            </div>
            <div className="grid grid--4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} locale={locale} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
