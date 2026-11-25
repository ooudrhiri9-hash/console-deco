'use client';

import type { Locale } from '@/i18n/config';
import { waLink } from '@/lib/whatsapp';
import { onWhatsappClick } from '@/lib/leads';
import { WhatsappIcon } from './Icons';

export default function WhatsappFloat({ locale }: { locale: Locale }) {
  const message =
    locale === 'fr'
      ? 'Bonjour, je vous écris depuis votre site.'
      : 'Hello, I am writing from your website.';

  return (
    <a
      className="wa-float"
      href={waLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      // Contact pour le pixel + « [Réf. MD-XXXX] » dans le message : une vente
      // conclue dans le chat peut alors être rattachée à la pub (lib/leads.ts).
      onClick={onWhatsappClick('whatsapp_float', message, locale)}
    >
      <WhatsappIcon size={26} />
    </a>
  );
}
