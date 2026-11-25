'use client';

import { useEffect, useRef } from 'react';
import Link from '@/components/Link';
import type { Locale } from '@/i18n/config';
import { getDict } from '@/i18n/dictionaries';
import { routes } from '@/lib/routes';
import { formatPrice } from '@/lib/format';
import { choiceLabels } from '@/lib/options';
import { useCart } from './CartProvider';
import { CloseIcon } from './Icons';
import ProductImage from './ProductImage';

/**
 * Le panier qui glisse depuis la droite juste après « Ajouter au panier ».
 *
 * Pourquoi : sur la période du 18 au 25 novembre 2026, 134 ajouts au panier
 * n'ont donné que 15 passages à la caisse. Après l'ajout, la fiche ne montrait
 * qu'un petit lien « Voir le panier » : le visiteur venu d'une pub repartait.
 * Ici, le bouton principal mène droit au formulaire de commande, sans passer
 * par la page panier.
 */
export default function CartDrawer({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const { lines, subtotal, drawerOpen, closeDrawer } = useCart();
  const closeRef = useRef<HTMLButtonElement>(null);

  // Échap ferme, le focus va sur « fermer », et la page derrière ne défile pas.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeDrawer();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [drawerOpen, closeDrawer]);

  if (!drawerOpen) return null;

  return (
    <div className="drawer" role="presentation">
      <button type="button" className="drawer__backdrop" aria-label={t.products.drawerClose} onClick={closeDrawer} />
      <aside className="drawer__panel" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        <div className="drawer__head">
          <h2 id="drawer-title" className="h-3">
            {t.products.drawerTitle} <span aria-hidden="true">✓</span>
          </h2>
          <button ref={closeRef} type="button" className="drawer__close" onClick={closeDrawer} aria-label={t.products.drawerClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="drawer__lines">
          {lines.map(({ product, qty, choice, key, price }) => (
            <div className="drawer__line" key={key}>
              <div className="drawer__media">
                <ProductImage src={product.images[0]} alt={product.name[locale]} seed={product.slug} />
              </div>
              <div className="drawer__info">
                <strong>{product.name[locale]}</strong>
                {choiceLabels(product, choice, locale).map((o) => (
                  <span className="drawer__opt" key={o.name}>
                    {o.name} : {o.label}
                  </span>
                ))}
                <span className="drawer__opt">× {qty}</span>
              </div>
              <span className="drawer__price">{price > 0 ? formatPrice(price * qty, locale) : t.common.onRequest}</span>
            </div>
          ))}
        </div>

        <div className="drawer__foot">
          <div className="summary__row summary__row--total">
            <span>{t.cart.total}</span>
            <span>{subtotal > 0 ? formatPrice(subtotal, locale) : t.common.onRequest}</span>
          </div>
          <p className="drawer__note">{t.products.drawerNote}</p>
          <Link href={routes.checkout(locale)} className="btn btn--primary btn--block" onClick={closeDrawer}>
            {t.products.drawerCheckout}
          </Link>
          <button type="button" className="btn btn--outline btn--block" onClick={closeDrawer}>
            {t.products.drawerContinue}
          </button>
          <Link href={routes.cart(locale)} className="drawer__cart link-underline" onClick={closeDrawer}>
            {t.products.viewCart}
          </Link>
        </div>
      </aside>
    </div>
  );
}
