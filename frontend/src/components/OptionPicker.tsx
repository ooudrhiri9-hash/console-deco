'use client';

import type { CSSProperties, ReactNode } from 'react';
import { getDict } from '@/i18n/dictionaries';
import type { Locale } from '@/i18n/config';
import { formatPrice } from '@/lib/format';
import { unitPrice, valueExtra } from '@/lib/options';
import type { OptionChoice, Product, ProductOption } from '@/types';

/**
 * Les choix d'une fiche : le format, le cadre, le reste.
 *
 * Des vrais boutons radio, un groupe par choix. Le visuel est celui de puces,
 * de cases ou de pastilles, mais le fond reste un `<fieldset>` avec sa légende
 * et des `<input type="radio">` : le lecteur d'écran annonce « Cadre, Cadre
 * doré, 2 sur 8 », la flèche du clavier passe d'une valeur à l'autre, et la
 * sélection part avec le formulaire même si le JavaScript tombe.
 *
 * Une pièce vendue sur devis n'affiche aucun montant : annoncer « +250 DH »
 * sous un prix « Sur demande » donnerait un chiffre qui ne veut rien dire tant
 * que le prix de base n'existe pas.
 */
type PickerProps = {
  product: Product;
  option: ProductOption;
  locale: Locale;
  choice: OptionChoice;
  onChange: (optionId: string, valueId: string) => void;
};

/** Le nom du choix, et la valeur retenue à côté : « Format · 100 × 100 cm ». */
function Legend({
  option,
  choice,
  locale,
  custom = false,
}: Pick<PickerProps, 'option' | 'choice' | 'locale'> & { custom?: boolean }) {
  const current = option.values.find((v) => v.id === choice[option.id]) || option.values[0];
  const label = custom ? getDict(locale).products.customSize : current.label[locale];
  return (
    <legend className="option__name">
      {option.name[locale]}
      <span className="option__current"> · {label}</span>
    </legend>
  );
}

/**
 * La grille des formats, chacun avec le prix qu'aurait la pièce dans ce
 * format, les autres choix restant ce qu'ils sont.
 */
export function SizePicker({
  product,
  option,
  locale,
  choice,
  onChange,
  custom,
  customActive = false,
}: PickerProps & { custom?: ReactNode; customActive?: boolean }) {
  return (
    <fieldset className="option">
      <Legend option={option} choice={choice} locale={locale} custom={customActive} />
      <div className="size-grid">
        {option.values.map((value) => {
          const id = `opt-${option.id}-${value.id}`;
          const selected = !customActive && choice[option.id] === value.id;
          const price = unitPrice(product, { ...choice, [option.id]: value.id });
          return (
            <label className={`size-opt${selected ? ' is-active' : ''}`} key={value.id} htmlFor={id}>
              <input
                id={id}
                type="radio"
                name={`option-${option.id}`}
                value={value.id}
                checked={selected}
                onChange={() => onChange(option.id, value.id)}
              />
              <b>{value.label[locale]}</b>
              {price > 0 && <span>{formatPrice(price, locale)}</span>}
            </label>
          );
        })}
        {custom}
      </div>
    </fieldset>
  );
}

/**
 * Les cadres, en pastilles de leur teinte. Le supplément affiché est celui du
 * format choisi : c'est le seul qui compte à ce moment-là.
 */
export function FramePicker({ product, option, locale, choice, onChange, sizeId }: PickerProps & { sizeId?: string }) {
  const showExtras = product.price > 0;
  return (
    <fieldset className="option option--frames">
      <Legend option={option} choice={choice} locale={locale} />
      <div className="option__values">
        {option.values.map((value) => {
          const id = `opt-${option.id}-${value.id}`;
          const selected = choice[option.id] === value.id;
          const extra = valueExtra(option, value, sizeId);
          return (
            <label className={`chip chip--pick chip--frame${selected ? ' is-active' : ''}`} key={value.id} htmlFor={id}>
              <input
                id={id}
                type="radio"
                name={`option-${option.id}`}
                value={value.id}
                checked={selected}
                onChange={() => onChange(option.id, value.id)}
              />
              <span
                className={`swatch${value.swatch ? '' : ' swatch--none'}`}
                style={value.swatch ? ({ '--swatch': value.swatch } as CSSProperties) : undefined}
                aria-hidden="true"
              />
              <span>{value.label[locale]}</span>
              {showExtras && extra > 0 && <em className="option__extra">+{formatPrice(extra, locale)}</em>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Tout autre choix : de simples puces. */
export default function OptionPicker({ product, option, locale, choice, onChange, sizeId }: PickerProps & { sizeId?: string }) {
  const showExtras = product.price > 0;
  return (
    <fieldset className="option">
      <Legend option={option} choice={choice} locale={locale} />
      <div className="option__values">
        {option.values.map((value) => {
          const id = `opt-${option.id}-${value.id}`;
          const selected = choice[option.id] === value.id;
          const extra = valueExtra(option, value, sizeId);
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
              {showExtras && extra > 0 && <em className="option__extra">+{formatPrice(extra, locale)}</em>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
