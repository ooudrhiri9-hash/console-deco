import Link from '@/components/Link';
import type { Locale } from '@/i18n/config';
import { getDict } from '@/i18n/dictionaries';
import { listedCategories, featuredProducts, getCategory } from '@/lib/catalogue';
import { routes } from '@/lib/routes';
import { CategoryCard, ProductCard } from '@/components/Cards';
import BestSellers from '@/components/BestSellers';
import { faqJsonLd, JsonLd, organizationJsonLd, websiteJsonLd } from '@/lib/seo';
import { ArrowIcon } from '@/components/Icons';

export default function HomeView({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const featured = featuredProducts(4);
  // Le bouton suit la meme regle que les cartes de familles, au lieu de pointer
  // en dur sur une famille qui pourrait ne plus etre proposee : si elle
  // disparait des listes, « Voir les ensembles » disparait avec elle. Le texte
  // et la photo restent dans tous les cas — ils decrivent un savoir-faire.
  const pairCategory = getCategory('console-tableau');
  const pairListed = pairCategory && listedCategories.some((c) => c.id === pairCategory.id);

  return (
    <>
      <JsonLd data={organizationJsonLd(locale)} />
      <JsonLd data={websiteJsonLd()} />
      <JsonLd data={faqJsonLd(t.home.faq)} />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="hero">
        {/* Vraie balise <img> plutôt qu'un fond CSS : c'est la plus grande image
            de la page, donc celle que mesure le LCP. En <img> le navigateur la
            découvre dans le HTML et la charge sans attendre la feuille de style,
            et `sizes` lui évite de télécharger la version 1600 px sur mobile. */}
        <img
          className="hero__photo"
          src="/media/hero/hero-1600.webp"
          srcSet="/media/hero/hero-760.webp 760w, /media/hero/hero-1100.webp 1100w, /media/hero/hero-1600.webp 1600w"
          sizes="100vw"
          width={1600}
          height={700}
          alt={t.home.heroImageAlt}
          fetchPriority="high"
          decoding="async"
        />
        <div className="hero__veil" aria-hidden="true" />
        <div className="container hero__inner">
          <span className="eyebrow eyebrow--light">{t.home.heroEyebrow}</span>
          <h1 className="h-hero hero__title">{t.home.heroTitle}</h1>
          <p className="lede hero__lede">{t.home.heroText}</p>
          <div className="hero__actions">
            <Link href={routes.products(locale)} className="btn btn--paper">
              {t.home.heroCta}
            </Link>
            <Link href={routes.contact(locale)} className="btn btn--light">
              {t.home.heroCtaAlt}
            </Link>
          </div>
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
          {listedCategories.map((c) => (
            <CategoryCard key={c.id} category={c} locale={locale} />
          ))}
        </div>
      </section>

      {/* ── Meilleures ventes ────────────────────────────────────────────── */}
      {/* Rendue par le client : le classement vient des commandes et se met à
          jour sans reconstruction. Absente tant qu'il n'y a rien à classer. */}
      <BestSellers locale={locale} />

      {/* ── Signature: the console + artwork set ─────────────────────────── */}
      <section className="band">
        <div className="container section split">
          <div>
            <span className="eyebrow">{t.home.pairEyebrow}</span>
            <h2 className="h-1" style={{ marginBlock: '1rem' }}>
              {t.home.pairTitle}
            </h2>
            <p className="lede">{t.home.pairText}</p>
            {pairCategory && pairListed && (
              <Link
                href={routes.category(locale, pairCategory)}
                className="btn btn--light"
                style={{ marginTop: '2rem' }}
              >
                {t.home.pairCta}
              </Link>
            )}
          </div>
          {/* La photo dit ce que le paragraphe décrit : deux tableaux et la
              console dessous, accordés. Chargée paresseusement — la section est
              sous la ligne de flottaison, elle ne doit rien prendre au LCP du
              hero. `width`/`height` réservent la place pour que rien ne saute
              quand elle arrive. */}
          <img
            className="split__photo"
            src="/media/signature/signature-800.webp"
            srcSet="/media/signature/signature-560.webp 560w, /media/signature/signature-800.webp 800w, /media/signature/signature-1040.webp 1040w"
            sizes="(min-width: 1280px) 560px, (min-width: 900px) 45vw, 100vw"
            width={800}
            height={600}
            alt={t.home.pairImageAlt}
            loading="lazy"
            decoding="async"
          />
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

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="section--tight container">
        <div className="section-head">
          <span className="eyebrow">FAQ</span>
          <h2 className="h-1">{t.home.faqTitle}</h2>
          <p>{t.home.faqText}</p>
        </div>

        {/* <details> natif : la réponse est dans le HTML même sans JavaScript,
            donc lisible par un lecteur d'écran et par un robot d'indexation. */}
        <div className="faq">
          {t.home.faq.map((item, i) => (
            <details className="faq__item" key={item.q} name="faq" open={i === 0}>
              <summary className="faq__q">
                <span>{item.q}</span>
                <span className="faq__sign" aria-hidden="true" />
              </summary>
              <div className="faq__a">
                <p>{item.a}</p>
              </div>
            </details>
          ))}
        </div>

        <div className="mt-3">
          <Link href={routes.contact(locale)} className="link-underline">
            {t.home.faqCta} <ArrowIcon />
          </Link>
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
