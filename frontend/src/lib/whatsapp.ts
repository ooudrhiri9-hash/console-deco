import { site } from '@/config/site';
import type { Locale } from '@/i18n/config';
import type { OptionChoice, Product } from '@/types';
import { formatPrice } from './format';
import { choiceLabels, unitPrice } from './options';

/** wa.me deep link. encodeURIComponent keeps the line breaks (%0A) intact. */
export const waLink = (message: string) =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;

/** "I'm interested in this piece" — from a product sheet. */
export function productMessage(
  p: Product,
  locale: Locale,
  qty = 1,
  url?: string,
  choice?: OptionChoice,
): string {
  const name = p.name[locale];
  const unit = unitPrice(p, choice);
  // unitPrice() rend 0 sur une pièce sans prix comme sur des dimensions sur
  // mesure : dans les deux cas c'est un devis, jamais « 0 DH ».
  const price = unit > 0 ? formatPrice(unit, locale) : '—';
  // Le cadre et les dimensions font partie de la demande : sans eux, le premier
  // message de retour serait « laquelle, et en quelle taille ? ».
  const picked = choiceLabels(p, choice, locale).map((o) => `• ${o.name} : ${o.label}`);
  const lines =
    locale === 'fr'
      ? [
          `Bonjour ${site.brandShort},`,
          '',
          `Je suis intéressé(e) par cette pièce :`,
          `• ${name} (réf. ${p.id})`,
          ...picked,
          `• Quantité : ${qty}`,
          `• Prix : ${price}`,
          url ? `• ${url}` : '',
          '',
          'Merci de me confirmer la disponibilité et le délai de livraison.',
        ]
      : [
          `Hello ${site.brandShort},`,
          '',
          `I am interested in this piece:`,
          `• ${name} (ref. ${p.id})`,
          ...picked,
          `• Quantity: ${qty}`,
          `• Price: ${price}`,
          url ? `• ${url}` : '',
          '',
          'Could you confirm availability and delivery time?',
        ];
  return lines.filter((l) => l !== '').join('\n');
}

export interface OrderLine {
  id: string;
  name: string;
  qty: number;
  price: number;
  /** « Cadre : doré », « Dimensions : L — 120×80 cm ». */
  picked?: Array<{ name: string; label: string }>;
}

export interface OrderCustomer {
  name: string;
  phone: string;
  email?: string;
  city: string;
  address: string;
  notes?: string;
}

/** Full cart + customer details, formatted for a readable WhatsApp message. */
export function orderMessage(
  lines: OrderLine[],
  customer: OrderCustomer,
  total: number,
  locale: Locale,
): string {
  const fr = locale === 'fr';
  const items = lines.flatMap((l) => [
    `• ${l.name} (${l.id}) × ${l.qty} — ${formatPrice(l.price * l.qty, locale)}`,
    ...(l.picked || []).map((o) => `   ${o.name} : ${o.label}`),
  ]);
  const out = [
    fr ? `Bonjour ${site.brandShort}, je souhaite passer commande :` : `Hello ${site.brandShort}, I would like to place an order:`,
    '',
    ...items,
    '',
    `${fr ? 'TOTAL' : 'TOTAL'} : ${formatPrice(total, locale)}`,
    `${fr ? 'Paiement' : 'Payment'} : ${fr ? 'à la livraison' : 'cash on delivery'}`,
    '',
    `${fr ? 'Nom' : 'Name'} : ${customer.name}`,
    `${fr ? 'Téléphone' : 'Phone'} : ${customer.phone}`,
    customer.email ? `Email : ${customer.email}` : '',
    `${fr ? 'Ville' : 'City'} : ${customer.city}`,
    `${fr ? 'Adresse' : 'Address'} : ${customer.address}`,
    customer.notes ? `${fr ? 'Précisions' : 'Notes'} : ${customer.notes}` : '',
  ];
  return out.filter((l) => l !== '').join('\n');
}
