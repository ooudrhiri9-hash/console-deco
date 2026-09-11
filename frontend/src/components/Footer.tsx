import Link from '@/components/Link';
import { site } from '@/config/site';
import { categoriesInOrder } from '@/lib/catalogue';
import { getDict } from '@/i18n/dictionaries';
import type { Locale } from '@/i18n/config';
import { routes } from '@/lib/routes';
import { FacebookIcon, InstagramIcon, MailIcon, PhoneIcon, PinIcon, TiktokIcon } from './Icons';

export default function Footer({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div>
            <div className="brand">{site.brand}</div>
            <p className="small" style={{ marginTop: '1rem', maxWidth: '30ch' }}>
              {t.footer.tagline}
            </p>
            <div className="socials">
              {site.social.instagram && (
                <a href={site.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <InstagramIcon />
                </a>
              )}
              {site.social.facebook && (
                <a href={site.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                  <FacebookIcon />
                </a>
              )}
              {site.social.tiktok && (
                <a href={site.social.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                  <TiktokIcon />
                </a>
              )}
            </div>
          </div>

          <div>
            <h2>{t.footer.collectionsTitle}</h2>
            <ul>
              {categoriesInOrder.map((c) => (
                <li key={c.id}>
                  <Link href={routes.category(locale, c)}>{c.name[locale]}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2>{t.footer.navTitle}</h2>
            <ul>
              <li><Link href={routes.home(locale)}>{t.nav.home}</Link></li>
              <li><Link href={routes.products(locale)}>{t.nav.products}</Link></li>
              <li><Link href={routes.about(locale)}>{t.nav.about}</Link></li>
              <li><Link href={routes.contact(locale)}>{t.nav.contact}</Link></li>
              <li><Link href={routes.cart(locale)}>{t.nav.cart}</Link></li>
            </ul>
          </div>

          <div>
            <h2>{t.footer.contactTitle}</h2>
            <ul>
              <li style={{ display: 'flex', gap: '.6rem', alignItems: 'center' }}>
                <PhoneIcon /> <a href={`tel:${site.phoneHref}`}>{site.phone}</a>
              </li>
              <li style={{ display: 'flex', gap: '.6rem', alignItems: 'center' }}>
                <MailIcon /> <a href={`mailto:${site.email}`}>{site.email}</a>
              </li>
              <li style={{ display: 'flex', gap: '.6rem', alignItems: 'flex-start' }}>
                <PinIcon />
                <span>
                  {site.address.street !== '—' && <>{site.address.street}, </>}
                  {site.address.city}
                </span>
              </li>
              <li className="small" style={{ opacity: 0.75, marginTop: '.5rem' }}>
                {t.contact.hours}
              </li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <span>
            © {year} {site.brand}. {t.footer.rights}
          </span>
          <span>{t.footer.madeIn}</span>
        </div>
      </div>
    </footer>
  );
}
