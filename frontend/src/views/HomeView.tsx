import Link from '@/components/Link';
import type { Locale } from '@/i18n/config';
import { getDict } from '@/i18n/dictionaries';
import { categoriesInOrder, featuredProducts, getCategory } from '@/lib/catalogue';
import { routes } from '@/lib/routes';
import { CategoryCard, ProductCard } from '@/components/Cards';
import { JsonLd, organizationJsonLd, websiteJsonLd } from '@/lib/seo';
import { ArrowIcon } from '@/components/Icons';

export default function HomeView({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const featured = featuredProducts(4);
  const pairCategory = getCategory('console-tableau');

  return (
    <>
      <JsonLd data={organizationJsonLd(locale)} />
      <JsonLd data={websiteJsonLd()} />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="container hero__grid">
          <div>
            <span className="eyebrow">{t.home.heroEyebrow}</span>
            <h1 className="h-hero hero__title">{t.home.heroTitle}</h1>
            <p className="lede">{t.home.heroText}</p>
            <div className="hero__actions">
              <Link href={routes.products(locale)} className="btn btn--primary">
                {t.home.heroCta}
              </Link>
              <Link href={routes.contact(locale)} className="btn btn--outline">
                {t.home.heroCtaAlt}
              </Link>
            </div>
          </div>
          <div className="hero__art" aria-hidden="true" />
        </div>
      </section>

      {/* ── Collections ──────────────────────────────────────────────────── */}
      <section className="section container">
        <div className="section-head">
          <span className="eyebrow">{t.nav.products}</span>
          <h2 className="h-1">{t.home.categoriesTitle}</h2>
          <p>{t.home.categoriesText}</p>
        </div>
        <div className="grid grid--3">
          {categoriesInOrder.map((c) => (
            <CategoryCard key={c.id} category={c} locale={locale} />
          ))}
        </div>
      </section>

      {/* ── Signature: the console + artwork set ─────────────────────────── */}
      <section className="band">
        <div className="container section split">
          <div>
            <span className="eyebrow">{t.home.pairEyebrow}</span>
            <h2 className="h-1" style={{ marginBlock: '1rem' }}>
              {t.home.pairTitle}
            </h2>
            <p className="lede">{t.home.pairText}</p>
            {pairCategory && (
              <Link
                href={routes.category(locale, pairCategory)}
                className="btn btn--light"
                style={{ marginTop: '2rem' }}
              >
                {t.home.pairCta}
              </Link>
            )}
          </div>
          <div className="split__art" aria-hidden="true" />
        </div>
      </section>

      {/* ── Featured ─────────────────────────────────────────────────────── */}
      <section className="section container">
        <div className="section-head">
          <span className="eyebrow">{t.common.discover}</span>
          <h2 className="h-1">{t.home.featuredTitle}</h2>
          <p>{t.home.featuredText}</p>
        </div>
        <div className="grid grid--4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} locale={locale} />
          ))}
        </div>
        <div className="mt-3">
          <Link href={routes.products(locale)} className="link-underline">
            {t.common.seeAll} <ArrowIcon />
          </Link>
        </div>
      </section>

      {/* ── Values ───────────────────────────────────────────────────────── */}
      <section className="section--tight container">
        <hr className="rule" style={{ marginBottom: 'clamp(2.5rem, 5vw, 4rem)' }} />
        <div className="section-head">
          <h2 className="h-2">{t.home.valuesTitle}</h2>
        </div>
        <div className="values">
          {t.home.values.map((v, i) => (
            <div className="value" key={v.title}>
              <span className="value__num">{String(i + 1).padStart(2, '0')}</span>
              <h3>{v.title}</h3>
              <p>{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Closing CTA ──────────────────────────────────────────────────── */}
      <section className="section container">
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            padding: 'clamp(2rem, 5vw, 4rem)',
            textAlign: 'center',
          }}
        >
          <h2 className="h-2">{t.home.ctaTitle}</h2>
          <p className="lede" style={{ margin: '1rem auto 2rem' }}>
            {t.home.ctaText}
          </p>
          <Link href={routes.contact(locale)} className="btn btn--primary">
            {t.home.ctaButton}
          </Link>
        </div>
      </section>
    </>
  );
}
