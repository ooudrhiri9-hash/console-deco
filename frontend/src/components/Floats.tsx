'use client';

import { usePathname } from 'next/navigation';
import type { Locale } from '@/i18n/config';
import { routes } from '@/lib/routes';
import { useCart } from './CartProvider';
import PhoneFloat from './PhoneFloat';
import WhatsappFloat from './WhatsappFloat';

/**
 * Les deux raccourcis de contact, dans un seul bloc fixe : appeler au-dessus,
 * WhatsApp sous le pouce.
 *
 * Masqués sur le panier et le formulaire de commande : sur téléphone ils
 * recouvraient les champs « Téléphone » et « Ville », et la page de commande a
 * déjà son propre bouton WhatsApp. Masqués aussi quand le panier latéral est
 * ouvert, pour ne pas couvrir « Commander maintenant ».
 */
export default function Floats({ locale }: { locale: Locale }) {
  const pathname = usePathname() || '';
  const { drawerOpen } = useCart();
  const norm = (p: string) => p.replace(/\/+$/, '');
  const hidden =
    drawerOpen || [routes.cart(locale), routes.checkout(locale)].some((r) => norm(pathname) === norm(r));

  if (hidden) return null;

  return (
    <div className="floats">
      <PhoneFloat locale={locale} />
      <WhatsappFloat locale={locale} />
    </div>
  );
}
