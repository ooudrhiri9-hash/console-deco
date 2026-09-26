import type { Locale } from '@/i18n/config';
import { getDict } from '@/i18n/dictionaries';
import { waLink } from '@/lib/whatsapp';
import { WhatsappIcon } from './Icons';

/**
 * « Votre image, notre console » : l'atelier peint une console d'apres
 * n'importe quelle image fournie par le client.
 *
 * L'image part par WhatsApp, pas par un formulaire : c'est la que le client a
 * deja ses photos, et l'API n'a pas de depot de fichiers pour les visiteurs.
 * Aucun prix n'est promis ici — les formats en ont un, un motif neuf se
 * chiffre a part.
 */
export default function CustomDesignNotice({ locale }: { locale: Locale }) {
  const t = getDict(locale).customDesign;

  return (
    <aside className="note custom-design">
      <div className="custom-design__body">
        <b className="custom-design__title">{t.title}</b>
        <p>{t.text}</p>
      </div>
      <a className="btn btn--primary" href={waLink(t.message)} target="_blank" rel="noopener noreferrer">
        <WhatsappIcon size={18} />
        {t.cta}
      </a>
    </aside>
  );
}
