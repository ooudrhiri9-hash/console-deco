'use client';

import type { Locale } from '@/i18n/config';
import { waLink } from '@/lib/whatsapp';
import { track } from '@/lib/pixel';
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
      // Une commande passée sur WhatsApp ne déclenche jamais Purchase : sans
      // ce Contact, Meta ne voit pas du tout ces clients.
      onClick={() => track('Contact', { content_name: 'whatsapp_float' })}
    >
      <WhatsappIcon size={26} />
    </a>
  );
}
