import Link from '@/components/Link';
import type { Locale } from '@/i18n/config';
import { getDict } from '@/i18n/dictionaries';
import { site } from '@/config/site';
import { routes } from '@/lib/routes';
import Breadcrumbs from '@/components/Breadcrumbs';

/**
 * ⚠️ PLACEHOLDER STORY — replace with the client's real history, workshop
 * location, team and founding year. Keep the structure: it is what makes the
 * page rank for "atelier mobilier Maroc" style queries and what builds trust.
 */
const story: Record<Locale, { title: string; body: string[]; figures: Array<{ k: string; v: string }> }> = {
  fr: {
    title: 'Un atelier, pas une usine',
    body: [
      'Nous dessinons et fabriquons des pièces de mobilier et des tableaux dans notre atelier au Maroc. Chaque console, chaque table, chaque toile passe entre les mains d’un artisan — jamais entre celles d’une chaîne de production.',
      'Nous travaillons le bois massif, le laiton, la pierre et la toile. Les matières sont choisies pour vieillir correctement : un plateau de noyer huilé se patine, un laiton non verni prend sa couleur avec le temps. Ce sont des pièces faites pour durer, pas pour être remplacées dans trois ans.',
      'Notre particularité : nous concevons le meuble et l’œuvre ensemble. Là où il faut habituellement chercher séparément la console puis le tableau qui ira avec, nous livrons l’ensemble déjà accordé — mêmes teintes, mêmes matières, mêmes proportions.',
      'Toutes nos pièces peuvent être adaptées à vos dimensions. Envoyez-nous les mesures de votre mur ou de votre entrée, et nous ajustons.',
    ],
    figures: [
      { k: 'Fabrication', v: 'Maroc' },
      { k: 'Séries', v: 'Limitées' },
      { k: 'Sur mesure', v: 'Sur demande' },
      { k: 'Livraison', v: 'Tout le Maroc' },
    ],
  },
  en: {
    title: 'A workshop, not a factory',
    body: [
      'We design and build furniture and artworks in our workshop in Morocco. Every console, every table, every canvas passes through a craftsman’s hands — never through a production line.',
      'We work in solid wood, brass, stone and canvas. Materials are chosen because they age well: an oiled walnut top develops a patina, unlacquered brass finds its own colour over time. These are pieces made to last, not to be replaced in three years.',
      'What sets us apart: we design the furniture and the artwork together. Where you would normally hunt for a console and then for a painting to match it, we deliver the set already in tune — same tones, same materials, same proportions.',
      'Every piece can be adapted to your dimensions. Send us the measurements of your wall or entrance and we will adjust.',
    ],
    figures: [
      { k: 'Made in', v: 'Morocco' },
      { k: 'Runs', v: 'Limited' },
      { k: 'Bespoke', v: 'On request' },
      { k: 'Delivery', v: 'All Morocco' },
    ],
  },
};

export default function AboutView({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const s = story[locale];

  return (
    <>
      <Breadcrumbs
        items={[{ label: t.nav.home, href: routes.home(locale) }, { label: t.nav.about }]}
      />

      <div className="container section--tight">
        <div className="section-head">
          <span className="eyebrow">{site.brand}</span>
          <h1 className="h-1" style={{ marginBlock: '.75rem' }}>
            {t.about.title}
          </h1>
          <p className="lede">{t.about.lead}</p>
        </div>

        <div className="split">
          <div className="prose">
            <h2 className="h-2" style={{ marginBottom: '1.25rem' }}>
              {s.title}
            </h2>
            {s.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <div className="split__art" aria-hidden="true" />
        </div>

        <section className="section--tight">
          <hr className="rule" style={{ marginBottom: '2.5rem' }} />
          <div className="values">
            {s.figures.map((f) => (
              <div className="value" key={f.k}>
                <span className="value__num">{f.k.toUpperCase()}</span>
                <h3>{f.v}</h3>
              </div>
            ))}
          </div>
        </section>

        <section className="section--tight center">
          <h2 className="h-2">{t.home.ctaTitle}</h2>
          <p className="lede" style={{ margin: '1rem auto 2rem' }}>
            {t.home.ctaText}
          </p>
          <div className="flex-center" style={{ gap: '.75rem', flexWrap: 'wrap' }}>
            <Link href={routes.products(locale)} className="btn btn--primary">
              {t.home.heroCta}
            </Link>
            <Link href={routes.contact(locale)} className="btn btn--outline">
              {t.home.heroCtaAlt}
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
