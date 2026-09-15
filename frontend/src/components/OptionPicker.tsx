'use client';

import type { Locale } from '@/i18n/config';
import { formatPrice } from '@/lib/format';
import { optionsOf } from '@/lib/options';
import type { OptionChoice, Product } from '@/types';

/**
 * Les choix d'une fiche : le cadre, les dimensions.
 *
 * Des vrais boutons radio, un groupe par choix. Le visuel est celui de puces
 * cliquables, mais le fond reste un `<fieldset>` avec sa légende et des
 * `<input type="radio">` : le lecteur d'écran annonce « Cadre, Cadre doré,
 * 2 sur 8 », la flèche du clavier passe d'une valeur à l'autre, et la
 * sélection part avec le formulaire même si le JavaScript tombe.
 *
 * Le supplément est écrit sur la puce quand il y en a un. Une pièce vendue sur
 * devis n'en affiche aucun : annoncer « +250 DH » sous un prix « Sur demande »
 * donnerait un chiffre qui ne veut rien dire tant que le prix de base n'existe
 * pas.
 */
export default function OptionPicker({
  product,
  locale,
  choice,
  onChange,
}: {
  product: Product;
  locale: Locale;
  choice: OptionChoice;
  onChange: (optionId: string, valueId: string) => void;
}) {
  const options = optionsOf(product);
  if (!options.length) return null;

  const showExtras = product.price > 0;

  return (
    <div className="options">
      {options.map((option) => (
        <fieldset className="option" key={option.id}>
          <legend className="option__name">{option.name[locale]}</legend>
          <div className="option__values">
            {option.values.map((value) => {
              const id = `opt-${option.id}-${value.id}`;
              const selected = choice[option.id] === value.id;
              return (
                <label className={`chip chip--pick${selected ? ' is-active' : ''}`} key={value.id} htmlFor={id}>
                  <input
                    id={id}
                    type="radio"
                    name={`option-${option.id}`}
                    value={value.id}
                    checked={selected}
                    onChange={() => onChange(option.id, value.id)}
                  />
                  <span>{value.label[locale]}</span>
                  {showExtras && value.extra > 0 && (
                    <em className="option__extra">+{formatPrice(value.extra, locale)}</em>
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
