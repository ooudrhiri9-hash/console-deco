/**
 * Google Ads — balise Google (gtag.js) et suivi des conversions.
 *
 * Le script est chargé par <GoogleTag /> dans RootShell : uniquement le site
 * public, jamais /admin qui a son propre layout. Tant que GOOGLE_ADS_ID est
 * vide, rien n'est chargé ni envoyé.
 *
 * Les valeurs viennent de Google Ads → Objectifs → Conversions → (l'action) →
 * Configurer la balise → « Utiliser Google Tag Manager » : l'ID de conversion
 * (AW-…) et le libellé de chaque action. Un libellé vide coupe cette seule
 * conversion.
 */
import { site } from '@/config/site';

export const GOOGLE_ADS_ID = 'AW-18535074117';

export const CONVERSION_LABELS = {
  /** Commande envoyée depuis /commande/ — conversion principale. */
  purchase: '3X87CKStn6gdEMWSm4ZF',
  /** Clic sur un lien WhatsApp, n'importe où sur le site — secondaire. */
  whatsapp: 'iLK5CKHfrKgdEMWSm4ZF',
  /** Clic sur un numéro de téléphone (tel:) — secondaire. */
  phone: 'z2SSCK69qagdEMWSm4ZF',
};

export type ConversionKind = keyof typeof CONVERSION_LABELS;

type Gtag = (cmd: 'event' | 'config', name: string, params?: Record<string, unknown>) => void;

export function gtagEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !GOOGLE_ADS_ID) return;
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (!gtag) return;
  gtag('event', name, { send_to: GOOGLE_ADS_ID, ...params });
}

/**
 * Envoie une conversion Google Ads. Silencieuse si la balise n'est pas chargée
 * (bloqueur de pub, identifiant vide). Une commande sur devis vaut 0 : comme
 * pour le pixel Meta, on n'envoie alors pas de valeur plutôt qu'une fausse.
 * `transactionId` (la référence de commande) évite de compter deux fois la
 * même commande.
 */
export function conversion(kind: ConversionKind, opts: { value?: number; transactionId?: string } = {}) {
  const label = CONVERSION_LABELS[kind];
  if (!label) return;
  const params: Record<string, unknown> = { send_to: `${GOOGLE_ADS_ID}/${label}` };
  if (opts.value && opts.value > 0) {
    params.value = opts.value;
    params.currency = site.currency;
  }
  if (opts.transactionId) params.transaction_id = opts.transactionId;
  gtagEvent('conversion', params);
}
