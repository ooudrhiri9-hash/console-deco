/**
 * Les choix d'une fiche — cadre, dimensions — et ce qu'ils font au prix.
 *
 * Un seul fichier décide, pour toute la boutique, ce que vaut une sélection :
 * la fiche, le panier et le message WhatsApp lisent tous ces fonctions. Le
 * serveur refait le même calcul à la commande, à partir des seuls
 * identifiants ; ce qui est écrit ici n'est donc jamais ce qui sera facturé,
 * seulement ce qui est promis à l'écran.
 */
import type { Locale } from '@/i18n/config';
import type { OptionChoice, Product, ProductOption, ProductOptionValue } from '@/types';

export const optionsOf = (product: Product): ProductOption[] =>
  Array.isArray(product.options) ? product.options.filter((o) => o.values?.length) : [];

export const hasOptions = (product: Product): boolean => optionsOf(product).length > 0;

/**
 * La sélection de départ : la première valeur de chaque choix.
 *
 * C'est aussi celle que le serveur applique quand rien n'est envoyé, donc la
 * fiche et la commande partent du même pied. Mettre la valeur sans supplément
 * en premier dans /admin revient à afficher le prix le plus bas par défaut.
 */
export function defaultChoice(product: Product): OptionChoice {
  const out: OptionChoice = {};
  for (const option of optionsOf(product)) out[option.id] = option.values[0].id;
  return out;
}

/**
 * La sélection nettoyée : ce qui existe encore sur la fiche, et rien d'autre.
 * Un panier resté ouvert pendant qu'on modifiait la pièce retombe ainsi sur la
 * valeur par défaut au lieu d'afficher un cadre qui n'est plus proposé.
 */
export function resolveChoice(product: Product, choice?: OptionChoice): OptionChoice {
  const out: OptionChoice = {};
  for (const option of optionsOf(product)) out[option.id] = pickedValue(option, choice).id;
  // Des dimensions hors normes survivent au rechargement du panier ; des
  // dimensions illisibles disparaissent, et la pièce revient à ses formats.
  const custom = customSizeOf(choice);
  if (custom) out[CUSTOM_SIZE] = packCustomSize(custom);
  return out;
}

/**
 * Les dimensions demandées par le visiteur, rangées dans la sélection sous une
 * clé réservée : « 120x80 », ou « 120x40x80 » pour un meuble.
 *
 * Ce n'est pas un choix de la fiche mais une saisie libre, donc aucun prix ne
 * peut en sortir : la pièce passe en devis, ici comme dans buildOrder().
 */
export const CUSTOM_SIZE = 'sur-mesure';

const CUSTOM_NAME: Record<Locale, string> = { fr: 'Sur mesure', en: 'Custom size' };

export interface CustomSize {
  width: number;
  height: number;
  depth?: number;
}

/** « 120x80 » / « 120x40x80 » -> dimensions, ou null si ça ne tient pas debout. */
export function parseCustomSize(raw?: string): CustomSize | null {
  const parts = String(raw ?? '').split('x');
  if (parts.length < 2 || parts.length > 3) return null;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isFinite(n) || n < 10 || n > 500)) return null;
  const [width, second, third] = nums.map((n) => Math.round(n));
  return parts.length === 2
    ? { width, height: second }
    : { width, depth: second, height: third };
}

/** Dimensions -> la forme rangée dans la sélection. */
export const packCustomSize = (d: CustomSize): string =>
  [d.width, d.depth, d.height].filter((n): n is number => typeof n === 'number').join('x');

/** « 120 × 40 × 80 cm », dans l'ordre largeur × profondeur × hauteur. */
export const customSizeLabel = (d: CustomSize): string =>
  `${[d.width, d.depth, d.height].filter((n): n is number => typeof n === 'number').join(' × ')} cm`;

/** Les dimensions sur mesure d'une sélection, s'il y en a. */
export const customSizeOf = (choice?: OptionChoice): CustomSize | null =>
  parseCustomSize(choice?.[CUSTOM_SIZE]);

/** Le choix « Format » de la pièce, s'il y en a un. */
export const sizeOption = (product: Product): ProductOption | undefined =>
  optionsOf(product).find((o) => o.kind === 'size');

/** Le choix « Cadre » de la pièce, s'il y en a un. */
export const frameOption = (product: Product): ProductOption | undefined =>
  optionsOf(product).find((o) => o.kind === 'frame');

/** La valeur retenue pour un choix : celle demandée si elle existe, sinon la première. */
export function pickedValue(option: ProductOption, choice?: OptionChoice): ProductOptionValue {
  const wanted = choice?.[option.id];
  return option.values.find((v) => v.id === wanted) || option.values[0];
}

/**
 * Ce qu'une valeur ajoute au prix, compte tenu du format choisi.
 *
 * Même règle que buildOrder() côté API : un supplément propre au format
 * l'emporte sur le supplément général. Le format lui-même n'a pas de format.
 */
export function valueExtra(
  option: ProductOption,
  value: ProductOptionValue,
  sizeId?: string,
): number {
  if (option.kind !== 'size' && sizeId && value.extraBySize) {
    const own = value.extraBySize[sizeId];
    if (typeof own === 'number' && Number.isFinite(own)) return own;
  }
  return Number(value.extra) || 0;
}

/** La somme des suppléments d'une sélection. */
export function extrasFor(product: Product, choice?: OptionChoice): number {
  const size = sizeOption(product);
  const sizeId = size ? pickedValue(size, choice).id : undefined;
  let total = 0;
  for (const option of optionsOf(product)) {
    total += valueExtra(option, pickedValue(option, choice), sizeId);
  }
  return total;
}

/**
 * Le prix d'une pièce une fois les choix faits.
 *
 * Une pièce « sur demande » (prix 0) le reste : ajouter un supplément à zéro
 * afficherait « 400 DH » pour un meuble dont le prix n'est pas fixé. Le choix
 * est quand même transmis, c'est au devis de le chiffrer.
 */
export const unitPrice = (product: Product, choice?: OptionChoice): number =>
  product.price && !customSizeOf(choice) ? product.price + extrasFor(product, choice) : 0;

/**
 * Le prix barré qui va avec la sélection : la promotion porte sur la pièce,
 * les suppléments s'ajoutent des deux côtés pour que l'écart reste le même.
 */
export const compareAtFor = (product: Product, choice?: OptionChoice): number | null =>
  product.compareAtPrice && product.price && product.compareAtPrice > product.price
    ? product.compareAtPrice + extrasFor(product, choice)
    : null;

/**
 * Le prix le plus bas et le plus haut qu'on peut atteindre sur la fiche, en
 * parcourant toutes les combinaisons. Au plus 4 choix de 12 valeurs : le
 * produit cartésien reste petit.
 */
export function priceRange(product: Product): { low: number; high: number } {
  if (!product.price) return { low: 0, high: 0 };
  let choices: OptionChoice[] = [{}];
  for (const option of optionsOf(product)) {
    choices = choices.flatMap((c) => option.values.map((v) => ({ ...c, [option.id]: v.id })));
  }
  const prices = choices.map((c) => unitPrice(product, c));
  return { low: Math.min(...prices), high: Math.max(...prices) };
}

/** « Cadre doré · L — 120×80 cm », pour le panier et les messages. */
export function choiceLabels(
  product: Product,
  choice: OptionChoice | undefined,
  locale: Locale,
): Array<{ name: string; label: string }> {
  const custom = customSizeOf(choice);
  return [
    // Des dimensions sur mesure remplacent le format : la pièce n'est plus
    // faite dans une des tailles proposées.
    ...optionsOf(product)
      .filter((option) => !(custom && option.kind === 'size'))
      .map((option) => ({
        name: option.name[locale],
        label: pickedValue(option, choice).label[locale],
      })),
    ...(custom ? [{ name: CUSTOM_NAME[locale], label: customSizeLabel(custom) }] : []),
  ];
}

/**
 * La clé d'une ligne de panier.
 *
 * Deux exemplaires de la même toile, l'un encadré et l'autre nu, sont deux
 * lignes : sans cette clé, ajouter le second ne ferait qu'incrémenter la
 * quantité du premier et le client recevrait deux fois le même cadre.
 */
export function lineKey(productId: string, choice?: OptionChoice): string {
  const parts = Object.keys(choice || {})
    .sort()
    .map((k) => `${k}:${choice![k]}`);
  return parts.length ? `${productId}|${parts.join('|')}` : productId;
}
