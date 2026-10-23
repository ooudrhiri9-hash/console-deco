'use client';

import Link from '@/components/Link';
import { useEffect, useState } from 'react';
import type { Locale } from '@/i18n/config';
import { getDict } from '@/i18n/dictionaries';
import { site } from '@/config/site';
import { routes } from '@/lib/routes';
import { formatPrice } from '@/lib/format';
import { waLink } from '@/lib/whatsapp';
import { readLastOrder, type LastOrder } from '@/lib/lastOrder';
import { PhoneIcon, WhatsappIcon } from './Icons';

/**
 * Le contenu de /merci/. La commande est relue côté navigateur : la page est
 * exportée en statique, elle ne connaît rien de la commande au build.
 * L'événement Purchase du pixel part de CheckoutForm, pas d'ici : recharger
 * cette page ne doit pas compter une seconde vente.
 */
export default function ThankYou({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const [order, setOrder] = useState<LastOrder | null>(null);

  useEffect(() => setOrder(readLastOrder()), []);

  const ref = order?.reference || '';
  const wa = waLink(ref ? t.thanks.whatsappMessage(ref) : t.thanks.questions);

  return (
    <div className="thanks">
      <div className="thanks__head">
        <span className="thanks__check" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h1 className="h-1">{t.thanks.title}</h1>
        <p className="lede">{t.thanks.lead}</p>
        {ref && (
          <p className="thanks__ref">
            {t.thanks.reference} : <strong>{ref}</strong>
          </p>
        )}
      </div>

      {order && order.lines.length > 0 && (
        <div className="summary thanks__recap">
          <h2 className="h-3" style={{ marginBottom: '1rem' }}>
            {t.thanks.recap}
          </h2>
          {order.lines.map((l, i) => (
            <div className="summary__row" key={i}>
              <span>
                {l.name} × {l.qty}
                {l.picked.map((o) => (
                  <em className="summary__opt" key={o.name}>
                    {o.name} : {o.label}
                  </em>
                ))}
              </span>
              <span>{l.price > 0 ? formatPrice(l.price * l.qty, locale) : t.common.onRequest}</span>
            </div>
          ))}
          <div className="summary__row summary__row--total">
            <span>{t.cart.total}</span>
            <span>{order.subtotal > 0 ? formatPrice(order.subtotal, locale) : t.common.onRequest}</span>
          </div>
          <p className="small muted" style={{ marginTop: '1rem' }}>
            {t.thanks.deliverTo} : {order.customer.name}, {order.customer.address}, {order.customer.city}
          </p>
          <p className="form-note">{t.checkout.payLabel}</p>
        </div>
      )}

      <section className="thanks__next">
        <h2 className="h-3">{t.thanks.nextTitle}</h2>
        <ol className="steps thanks__steps">
          {t.thanks.next.map((step, i) => (
            <li className="step" key={step.title}>
              <span className="step__num" aria-hidden="true">
                {i + 1}
              </span>
              <div>
                <b className="step__title">{step.title}</b>
                <p className="small muted">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="thanks__help">
        <p className="muted">{t.thanks.questions}</p>
        <div className="flex-center" style={{ gap: '.75rem', flexWrap: 'wrap' }}>
          <a className="btn btn--whatsapp" href={wa} target="_blank" rel="noopener noreferrer">
            <WhatsappIcon size={18} />
            WhatsApp
          </a>
          <a href={`tel:${site.phoneHref}`} className="btn btn--outline">
            <PhoneIcon size={16} />
            {site.phone}
          </a>
        </div>
        <Link href={routes.products(locale)} className="btn btn--primary thanks__continue">
          {t.cart.continue}
        </Link>
      </div>
    </div>
  );
}
