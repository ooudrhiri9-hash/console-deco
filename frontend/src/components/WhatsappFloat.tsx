import type { Locale } from '@/i18n/config';
import { waLink } from '@/lib/whatsapp';
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
    >
      <WhatsappIcon size={26} />
    </a>
  );
}
