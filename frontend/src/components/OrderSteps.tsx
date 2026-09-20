import type { Locale } from '@/i18n/config';
import { getDict } from '@/i18n/dictionaries';

/**
 * « Comment se passe une commande », en quatre étapes.
 *
 * Une boutique où l'on paie à la livraison et où la moitié des pièces portent
 * « Prix sur demande » demande une explication que le panier ne donne pas : le
 * visiteur qui ne voit pas de prix se demande s'il peut commander, et celui
 * qui n'a jamais payé à la réception se demande quand on lui prendra son
 * argent. Les deux réponses sont dans la FAQ de l'accueil — trop loin de la
 * page où la question se pose.
 *
 * Chaque étape reprend un fait déjà affirmé ailleurs sur le site, jamais une
 * promesse nouvelle : délais et frais restent « confirmés au moment de la
 * commande », parce que c'est ce que dit la FAQ et que personne n'a fourni de
 * grille de délais.
 */
export default function OrderSteps({ locale }: { locale: Locale }) {
  const t = getDict(locale);

  return (
    <section className="section--tight">
      <div className="section-head">
        <span className="eyebrow">{t.orderSteps.eyebrow}</span>
        <h2 className="h-2" style={{ marginBlock: '.75rem' }}>
          {t.orderSteps.title}
        </h2>
        <p className="lede">{t.orderSteps.lead}</p>
      </div>

      <ol className="steps">
        {t.orderSteps.steps.map((step, i) => (
          <li className="step" key={step.title}>
            <span className="step__num" aria-hidden="true">
              {i + 1}
            </span>
            <div>
              <b className="step__title">{step.title}</b>
              <p className="small muted">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
