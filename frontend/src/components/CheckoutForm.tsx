'use client';

import Link from '@/components/Link';
import { useState, type FormEvent } from 'react';
import type { Locale } from '@/i18n/config';
import { getDict } from '@/i18n/dictionaries';
import { site } from '@/config/site';
import { apiUrl } from '@/config/api';
import { routes } from '@/lib/routes';
import { formatPrice } from '@/lib/format';
import { orderMessage, waLink, type OrderCustomer } from '@/lib/whatsapp';
import { useCart } from './CartProvider';
import { WhatsappIcon } from './Icons';

type State = 'idle' | 'sending' | 'sent' | 'error';

const EMPTY: OrderCustomer = { name: '', phone: '', email: '', city: '', address: '', notes: '' };

export default function CheckoutForm({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const { lines, subtotal, clear, ready } = useCart();
  const [customer, setCustomer] = useState<OrderCustomer>(EMPTY);
  const [state, setState] = useState<State>('idle');
  /** Order number the API assigned — shown on the thank-you screen. */
  const [reference, setReference] = useState('');

  const set = (k: keyof OrderCustomer) => (e: { target: { value: string } }) =>
    setCustomer((c) => ({ ...c, [k]: e.target.value }));

  const orderLines = lines.map((l) => ({
    id: l.product.id,
    name: l.product.name[locale],
    qty: l.qty,
    price: l.product.price,
  }));

  const wa = waLink(orderMessage(orderLines, customer, subtotal, locale));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState('sending');
    try {
      const res = await fetch(apiUrl('/api/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale,
          customer,
          // Prices are recomputed from the catalogue server-side; what we send
          // is only what the customer was shown, kept for support calls.
          items: orderLines,
          payment: 'cod',
        }),
      });
      const data = (await res.json().catch(() => null)) as { reference?: string; error?: string } | null;
      if (!res.ok) throw new Error(data?.error || String(res.status));
      setReference(data?.reference || '');
      setState('sent');
      clear();
    } catch {
      // API down, or the domain missing from ALLOWED_ORIGINS — the visitor
      // still has the WhatsApp route, the channel most clients actually use.
      setState('error');
    }
  }

  if (!ready) return <div className="empty-state">{t.common.loading}</div>;

  if (state === 'sent') {
    return (
      <div className="empty-state stack">
        <h2 className="h-2">{t.checkout.successTitle}</h2>
        <p className="muted">{t.checkout.successText}</p>
        {reference && (
          <p className="small">
            {locale === 'fr' ? 'Référence de votre commande' : 'Your order reference'} :{' '}
            <strong>{reference}</strong>
          </p>
        )}
        <div className="flex-center" style={{ gap: '.75rem', flexWrap: 'wrap' }}>
          <Link href={routes.products(locale)} className="btn btn--primary">
            {t.cart.continue}
          </Link>
          <a href={`tel:${site.phoneHref}`} className="btn btn--outline">
            {site.phone}
          </a>
        </div>
      </div>
    );
  }

  if (!lines.length) {
    return (
      <div className="empty-state stack">
        <p>{t.checkout.emptyCart}</p>
        <Link href={routes.products(locale)} className="btn btn--primary">
          {t.cart.emptyCta}
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-layout">
      <form onSubmit={onSubmit} noValidate={false}>
        {state === 'error' && <div className="alert alert--err">{t.checkout.errorText}</div>}

        <div className="field--row">
          <div className="field">
            <label htmlFor="name">{t.checkout.name} *</label>
            <input id="name" name="name" required autoComplete="name" value={customer.name} onChange={set('name')} />
          </div>
          <div className="field">
            <label htmlFor="phone">{t.checkout.phone} *</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              inputMode="tel"
              placeholder="06 00 00 00 00"
              value={customer.phone}
              onChange={set('phone')}
            />
          </div>
        </div>

        <div className="field--row">
          <div className="field">
            <label htmlFor="city">{t.checkout.city} *</label>
            <input id="city" name="city" required autoComplete="address-level2" value={customer.city} onChange={set('city')} />
          </div>
          <div className="field">
            <label htmlFor="email">{t.checkout.email}</label>
            <input id="email" name="email" type="email" autoComplete="email" value={customer.email} onChange={set('email')} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="address">{t.checkout.address} *</label>
          <input id="address" name="address" required autoComplete="street-address" value={customer.address} onChange={set('address')} />
        </div>

        <div className="field">
          <label htmlFor="notes">{t.checkout.notes}</label>
          <textarea id="notes" name="notes" value={customer.notes} onChange={set('notes')} />
        </div>

        <p className="form-note">{t.checkout.payLabel}</p>

        <div className="buy-row">
          <button type="submit" className="btn btn--primary" disabled={state === 'sending'}>
            {state === 'sending' ? t.checkout.submitting : t.checkout.submit}
          </button>
          <a className="btn btn--whatsapp" href={wa} target="_blank" rel="noopener noreferrer">
            <WhatsappIcon size={18} />
            {t.checkout.viaWhatsapp}
          </a>
        </div>
        <p className="form-note">{t.checkout.whatsappHint}</p>
      </form>

      <aside className="summary">
        <h2 className="h-3" style={{ marginBottom: '1rem' }}>
          {t.checkout.summary}
        </h2>
        {lines.map(({ product, qty }) => (
          <div className="summary__row" key={product.id}>
            <span>
              {product.name[locale]} × {qty}
            </span>
            <span>{formatPrice(product.price * qty, locale)}</span>
          </div>
        ))}
        <div className="summary__row summary__row--total">
          <span>{t.cart.total}</span>
          <span>{formatPrice(subtotal, locale)}</span>
        </div>
        <p className="small muted" style={{ marginTop: '1rem' }}>
          {t.checkout.intro}
        </p>
      </aside>
    </div>
  );
}
