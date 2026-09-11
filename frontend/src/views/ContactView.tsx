import type { Locale } from '@/i18n/config';
import { getDict } from '@/i18n/dictionaries';
import { site } from '@/config/site';
import { routes } from '@/lib/routes';
import Breadcrumbs from '@/components/Breadcrumbs';
import ContactForm from '@/components/ContactForm';
import { MailIcon, PhoneIcon, PinIcon, WhatsappIcon } from '@/components/Icons';
import { waLink } from '@/lib/whatsapp';

export default function ContactView({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const wa = waLink(
    locale === 'fr'
      ? 'Bonjour, j’aimerais avoir des informations.'
      : 'Hello, I would like some information.',
  );

  return (
    <>
      <Breadcrumbs
        items={[{ label: t.nav.home, href: routes.home(locale) }, { label: t.nav.contact }]}
      />

      <div className="container section--tight">
        <div className="section-head">
          <h1 className="h-1">{t.contact.title}</h1>
          <p>{t.contact.intro}</p>
        </div>

        <div className="cart-layout">
          <div>
            <h2 className="h-3" style={{ marginBottom: '1.5rem' }}>
              {t.contact.formTitle}
            </h2>
            <ContactForm locale={locale} />
          </div>

          <aside className="summary">
            <h2 className="h-3" style={{ marginBottom: '1.25rem' }}>
              {t.contact.whatsappTitle}
            </h2>
            <p className="small muted">{t.contact.whatsappText}</p>
            <a
              className="btn btn--whatsapp btn--block"
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              style={{ marginBlock: '1rem 2rem' }}
            >
              <WhatsappIcon size={18} />
              {t.contact.whatsappCta}
            </a>

            <ul className="stack">
              <li style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
                <PhoneIcon />
                <a href={`tel:${site.phoneHref}`}>{site.phone}</a>
              </li>
              <li style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
                <MailIcon />
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </li>
              <li style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}>
                <PinIcon />
                <span>
                  {site.address.street !== '—' && (
                    <>
                      {site.address.street}
                      <br />
                    </>
                  )}
                  {site.address.postalCode} {site.address.city}
                </span>
              </li>
            </ul>

            <hr className="rule" style={{ marginBlock: '1.5rem' }} />
            <h3 className="small" style={{ letterSpacing: '.1em', textTransform: 'uppercase' }}>
              {t.contact.hoursTitle}
            </h3>
            <p className="small muted">{t.contact.hours}</p>
          </aside>
        </div>
      </div>
    </>
  );
}
