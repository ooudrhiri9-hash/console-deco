import type { Locale } from '@/i18n/config';
import type { Product } from '@/types';
import { getDict } from '@/i18n/dictionaries';
import { getCategory, relatedProducts } from '@/lib/catalogue';
import { routes } from '@/lib/routes';
import { dimensionsLabel, paragraphs } from '@/lib/format';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProductGallery from '@/components/ProductGallery';
import BuyBlock from '@/components/BuyBlock';
import { ProductCard } from '@/components/Cards';
import { JsonLd, productJsonLd } from '@/lib/seo';

export default function ProductView({ product, locale }: { product: Product; locale: Locale }) {
  const t = getDict(locale);
  const category = getCategory(product.categoryId);
  const dims = dimensionsLabel(product);
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
        <div className="product">
          <ProductGallery product={product} locale={locale} />

          <div className="product__info">
            {category && <span className="eyebrow">{category.name[locale]}</span>}
            <h1 className="h-1" style={{ marginBlock: '.75rem' }}>
              {product.name[locale]}
            </h1>
            <p className="muted">{product.shortDescription[locale]}</p>

            {/* Price, stock and buttons follow the live catalogue. */}
            <BuyBlock product={product} locale={locale} />

            <div className="spec">
              <dl>
                <dt>{t.common.reference}</dt>
                <dd>{product.id}</dd>

                {dims && (
                  <>
                    <dt>{t.common.dimensions}</dt>
                    <dd>{dims}</dd>
                  </>
                )}

                <dt>{t.common.materials}</dt>
                <dd>{product.materials[locale]}</dd>

                {product.finish && (
                  <>
                    <dt>{t.common.finish}</dt>
                    <dd>{product.finish[locale]}</dd>
                  </>
                )}

                {product.colors.length > 0 && (
                  <>
                    <dt>{t.common.colors}</dt>
                    <dd>{product.colors.map((c) => c[locale]).join(', ')}</dd>
                  </>
                )}
              </dl>
            </div>

            {product.madeToOrder && <p className="note">{t.products.customNote}</p>}
          </div>
        </div>

        <div className="section--tight prose" style={{ maxWidth: '68ch' }}>
          {paragraphs(product.description[locale]).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {related.length > 0 && (
          <section className="section--tight">
            <hr className="rule" style={{ marginBottom: '2.5rem' }} />
            <h2 className="h-2" style={{ marginBottom: '2rem' }}>
              {t.products.related}
            </h2>
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
