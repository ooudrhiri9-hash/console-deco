/**
 * Meta (Facebook) Pixel — pour les campagnes publicitaires du client.
 *
 * Le script est chargé par <MetaPixel /> dans RootShell : uniquement le site
 * public, jamais /admin qui a son propre layout. Mettre l'identifiant à ''
 * coupe le pixel partout sans toucher au reste du code.
 */
import { site } from '@/config/site';

export const META_PIXEL_ID = '2497724073737141';

type Fbq = (cmd: 'track', event: string, params?: Record<string, unknown>) => void;

/**
 * Envoie un événement standard (AddToCart, Purchase…). Silencieux si le pixel
 * n'est pas chargé : bloqueur de pub, rendu statique, identifiant vide.
 */
export function track(event: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const fbq = (window as unknown as { fbq?: Fbq }).fbq;
  if (!fbq) return;
  // Une pièce sur devis vaut 0 : on n'envoie pas de valeur plutôt qu'une
  // valeur fausse, qui fausserait le retour sur dépense publicitaire.
  if (params && typeof params.value === 'number') {
    params = params.value > 0 ? { currency: site.currency, ...params } : omitValue(params);
  }
  fbq('track', event, params);
}

function omitValue({ value: _value, ...rest }: Record<string, unknown>) {
  return rest;
}
