'use client';

import type { Locale } from '@/i18n/config';
import { getDict } from '@/i18n/dictionaries';

/** Les trois cases de saisie, en centimètres. Vides au départ. */
export type Dims = { width: string; depth: string; height: string };

export const emptyDims: Dims = { width: '', depth: '', height: '' };

/**
 * Le pavé « Sur mesure » de la grille des formats.
 *
 * C'est un bouton radio du même groupe que les formats : choisir ses propres
 * dimensions, c'est renoncer à ceux de la fiche, et le clavier passe de l'un à
 * l'autre comme entre deux tailles.
 */
export function CustomSizeTile({
  group,
  locale,
  active,
  onSelect,
}: {
  group: string;
  locale: Locale;
  active: boolean;
  onSelect: () => void;
}) {
  const t = getDict(locale);
  const id = `${group}-custom`;
  return (
    <label className={`size-opt size-opt--custom${active ? ' is-active' : ''}`} htmlFor={id}>
      <input id={id} type="radio" name={group} checked={active} onChange={onSelect} />
      <b>{t.products.customSize}</b>
      <span>{t.products.customSizeShort}</span>
    </label>
  );
}

/**
 * La saisie des dimensions. La profondeur n'apparaît que pour un meuble : un
 * tableau n'en a pas, et une case vide de plus ne ferait qu'inquiéter.
 */
export function CustomSizeFields({
  locale,
  dims,
  onChange,
  showDepth,
  invalid,
}: {
  locale: Locale;
  dims: Dims;
  onChange: (dims: Dims) => void;
  showDepth: boolean;
  invalid: boolean;
}) {
  const t = getDict(locale);
  const fields: Array<[keyof Dims, string]> = [
    ['width', t.products.width],
    ...(showDepth ? ([['depth', t.products.depth]] as Array<[keyof Dims, string]>) : []),
    ['height', t.products.height],
  ];

  return (
    <div className="custom-size">
      <div className="custom-size__fields">
        {fields.map(([key, label]) => (
          <label className="custom-size__field" key={key}>
            <span>{label}</span>
            <input
              type="number"
              inputMode="numeric"
              min={10}
              max={500}
              step={1}
              value={dims[key]}
              placeholder="—"
              onChange={(e) => onChange({ ...dims, [key]: e.target.value })}
            />
            <em>cm</em>
          </label>
        ))}
      </div>
      <p className={`custom-size__note${invalid ? ' is-error' : ''}`}>
        {invalid ? t.products.customSizeIncomplete : t.products.customSizeNote}
      </p>
    </div>
  );
}
