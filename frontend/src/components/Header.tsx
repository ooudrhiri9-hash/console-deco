'use client';

import Link from '@/components/Link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { deliveryAlwaysFree, site } from '@/config/site';
import { listedCategories, countByCategory } from '@/lib/catalogue';
import { getDict } from '@/i18n/dictionaries';
import { localeLabel, locales, type Locale } from '@/i18n/config';
import { routes, switchLocalePath } from '@/lib/routes';
import { useCart } from './CartProvider';
import { useFavorites } from './FavoritesProvider';
import { CartIcon, CloseIcon, HeartIcon, MenuIcon } from './Icons';

export default function Header({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const pathname = usePathname() ?? '/';
  const [open, setOpen] = useState(false);
  const { count, ready } = useCart();
  const favorites = useFavorites();

  // Close the drawer on navigation and lock the body scroll while it is open.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const isCurrent = (href: string) =>
    href === routes.home(locale) ? pathname === href : pathname.startsWith(href);

  // Trois cas, dans cet ordre : port offert quoi qu'il arrive, port offert
  // au-dela d'un montant, ou rien a annoncer. Le deuxieme n'a de sens que si
  // un tarif forfaitaire existe — sinon le bandeau reclamait un panier minimum
  // pour une gratuite deja acquise.
  const announce = deliveryAlwaysFree
    ? locale === 'fr'
      ? 'Livraison gratuite partout au Maroc · Paiement à la livraison'
      : 'Free delivery anywhere in Morocco · Cash on delivery'
    : site.freeShippingThreshold > 0
      ? locale === 'fr'
        ? `Livraison offerte au Maroc dès ${site.freeShippingThreshold} ${site.currencyLabel} · Paiement à la livraison`
        : `Free delivery in Morocco from ${site.freeShippingThreshold} ${site.currencyLabel} · Cash on delivery`
      : null;

  return (
    <>
      {announce && <div className="announce">{announce}</div>}

      <header className="header">
        <div className="container header__bar">
          <Link href={routes.home(locale)} className="brand" aria-label={site.brand}>
            {site.brand.split(' ')[0]} <span>{site.brand.split(' ').slice(1).join(' ')}</span>
          </Link>

          <nav className="nav" aria-label={t.nav.products}>
            <Link href={routes.home(locale)} className="nav__link" aria-current={isCurrent(routes.home(locale)) ? 'page' : undefined}>
              {t.nav.home}
            </Link>

            <div className="nav__group">
              <Link
                href={routes.products(locale)}
                className="nav__link"
                aria-current={isCurrent(routes.products(locale)) ? 'page' : undefined}
              >
                {t.nav.products}
              </Link>
              <div className="nav__panel">
                {listedCategories.map((c) => (
                  <Link key={c.id} href={routes.category(locale, c)}>
                    {c.name[locale]}
                    <em>{countByCategory(c.id)}</em>
                  </Link>
                ))}
              </div>
            </div>

            <Link href={routes.about(locale)} className="nav__link" aria-current={isCurrent(routes.about(locale)) ? 'page' : undefined}>
              {t.nav.about}
            </Link>
            <Link href={routes.contact(locale)} className="nav__link" aria-current={isCurrent(routes.contact(locale)) ? 'page' : undefined}>
              {t.nav.contact}
            </Link>
          </nav>

          <div className="header__actions">
            <div className="lang" role="group" aria-label="Langue / Language">
              {locales.map((l) => (
                <Link key={l} href={switchLocalePath(pathname, l)} aria-current={l === locale} hrefLang={l}>
                  {localeLabel[l]}
                </Link>
              ))}
            </div>

            {/* Masqué sur les plus petits écrans, où la place manque : le lien
                reste dans le menu. */}
            <Link href={routes.favorites(locale)} className="icon-btn icon-btn--fav" aria-label={t.nav.favorites}>
              <HeartIcon />
              {favorites.ready && favorites.slugs.length > 0 && (
                <span className="icon-btn__count">{favorites.slugs.length}</span>
              )}
            </Link>

            <Link href={routes.cart(locale)} className="icon-btn" aria-label={t.nav.cart}>
              <CartIcon />
              {ready && count > 0 && <span className="icon-btn__count">{count}</span>}
            </Link>

            <button
              className="icon-btn burger"
              onClick={() => setOpen(true)}
              aria-label={t.common.menu}
              aria-expanded={open}
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="drawer" role="dialog" aria-modal="true" aria-label={t.common.menu}>
          <div className="drawer__top">
            <span className="brand">{site.brand}</span>
            <button className="icon-btn" onClick={() => setOpen(false)} aria-label={t.common.close}>
              <CloseIcon />
            </button>
          </div>
          <nav>
            <Link href={routes.home(locale)}>{t.nav.home}</Link>
            <span className="drawer__label">{t.nav.products}</span>
            <div className="drawer__sub">
              <Link href={routes.products(locale)}>{t.products.filterAll}</Link>
              {listedCategories.map((c) => (
                <Link key={c.id} href={routes.category(locale, c)}>
                  {c.name[locale]}
                </Link>
              ))}
            </div>
            <Link href={routes.about(locale)}>{t.nav.about}</Link>
            <Link href={routes.contact(locale)}>{t.nav.contact}</Link>
            <Link href={routes.favorites(locale)}>{t.nav.favorites}</Link>
            <Link href={routes.cart(locale)}>{t.nav.cart}</Link>
          </nav>
        </div>
      )}
    </>
  );
}
