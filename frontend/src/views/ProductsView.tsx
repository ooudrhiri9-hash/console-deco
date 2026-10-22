import type { Locale } from '@/i18n/config';
import { getDict } from '@/i18n/dictionaries';
import { allProducts } from '@/lib/catalogue';
import { routes } from '@/lib/routes';
import Breadcrumbs from '@/components/Breadcrumbs';
import CatalogueGrid from '@/components/CatalogueGrid';
import OrderSteps from '@/components/OrderSteps';
import { faqJsonLd, itemListJsonLd, JsonLd } from '@/lib/seo';

export default function ProductsView({ locale }: { locale: Locale }) {
  const t = getDict(locale);

  return (
    <>
      <JsonLd data={itemListJsonLd(allProducts, locale)} />
      {/* Questions propres au catalogue : aucune ne reprend celles de l'accueil,
          qui porte deja son propre bloc FAQPage. */}
      <JsonLd data={faqJsonLd(t.catalogueHelp.faq)} />

      <Breadcrumbs
        items={[
          { label: t.nav.home, href: routes.home(locale) },
          { label: t.nav.products },
        ]}
      />

      <div className="container section--tight">
        {/* Titre masque : la page garde son h1 pour les moteurs et les
            lecteurs d'ecran, sans pave d'intro au-dessus de la grille. */}
        <h1 className="sr-only">{t.products.title}</h1>

        <CatalogueGrid products={allProducts} locale={locale} />

        {/* Sous la grille, jamais au-dessus : le visiteur vient voir des pièces,
            et un pavé de texte qui repousse la première rangée hors de l'écran
            lui fait croire qu'il s'est trompé de page. En dessous, le même texte
            sert ceux qui ont fini de regarder — et les moteurs, qui lisent la
            page entière. */}
        <section className="section--tight">
          <div className="prose">
            <h2 className="h-2">{t.catalogueHelp.title}</h2>
            {t.catalogueHelp.body.map((paragraphe) => (
              <p key={paragraphe.slice(0, 40)}>{paragraphe}</p>
            ))}
          </div>
        </section>

        <OrderSteps locale={locale} />

        <section className="section--tight">
          <h2 className="h-2" style={{ marginBottom: '1.5rem' }}>
            {t.catalogueHelp.faqTitle}
          </h2>
          <div className="faq">
            {t.catalogueHelp.faq.map((item, i) => (
              <details className="faq__item" key={item.q} name="catalogue-faq" open={i === 0}>
                <summary className="faq__q">
                  {item.q}
                  <span className="faq__sign" aria-hidden="true" />
                </summary>
                <div className="faq__a">
                  <p>{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
