import type { Locale } from '@/i18n/config';
import { site } from '@/config/site';
import { PhoneIcon } from './Icons';

/**
 * Le bouton d'appel, à demeure en bas de l'écran.
 *
 * Une partie des clients ne veut ni formulaire ni messagerie : ils appellent.
 * Le numéro vit dans les réglages du back-office, donc ce bouton suit le numéro
 * affiché partout ailleurs sur le site — il n'y a pas un second numéro codé en
 * dur ici qui pourrait dériver.
 */
export default function PhoneFloat({ locale }: { locale: Locale }) {
  const label = locale === 'fr' ? `Appeler ${site.phone}` : `Call ${site.phone}`;

  return (
    <a className="phone-float" href={`tel:${site.phoneHref}`} aria-label={label} title={label}>
      <PhoneIcon size={24} />
    </a>
  );
}
