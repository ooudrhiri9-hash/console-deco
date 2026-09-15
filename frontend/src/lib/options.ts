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
import type { OptionChoice, Product, ProductOption } from '@/types';

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
  for (const option of optionsOf(product)) {
    const wanted = choice?.[option.id];
    const value = option.values.find((v) => v.id === wanted) || option.values[0];
    out[option.id] = value.id;
  }
  return out;
}

/** La somme des suppléments d'une sélection. */
export function extrasFor(product: Product, choice?: OptionChoice): number {
  let total = 0;
  for (const option of optionsOf(product)) {
    const wanted = choice?.[option.id];
    const value = option.values.find((v) => v.id === wanted) || option.values[0];
    total += Number(value.extra) || 0;
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
  product.price ? product.price + extrasFor(product, choice) : 0;

/** « Cadre doré · L — 120×80 cm », pour le panier et les messages. */
export function choiceLabels(
  product: Product,
  choice: OptionChoice | undefined,
  locale: Locale,
): Array<{ name: string; label: string }> {
  return optionsOf(product).map((option) => {
    const wanted = choice?.[option.id];
    const value = option.values.find((v) => v.id === wanted) || option.values[0];
    return { name: option.name[locale], label: value.label[locale] };
  });
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
