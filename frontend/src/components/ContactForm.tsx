'use client';

import { useState, type FormEvent } from 'react';
import type { Locale } from '@/i18n/config';
import { getDict } from '@/i18n/dictionaries';
import { waLink } from '@/lib/whatsapp';
import { apiUrl } from '@/config/api';
import { WhatsappIcon } from './Icons';

type State = 'idle' | 'sending' | 'sent' | 'error';

export default function ContactForm({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const [state, setState] = useState<State>('idle');
  const [form, setForm] = useState({ name: '', phone: '', email: '', subject: '', message: '', company: '' });

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState('sending');
    try {
      const res = await fetch(apiUrl('/api/messages'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale, ...form }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setState('sent');
      setForm({ name: '', phone: '', email: '', subject: '', message: '', company: '' });
    } catch {
      setState('error');
    }
  }

  const wa = waLink(
    [form.subject, form.message].filter(Boolean).join('\n') ||
      (locale === 'fr' ? 'Bonjour, j’aimerais avoir des informations.' : 'Hello, I would like some information.'),
  );

  return (
    <form onSubmit={onSubmit}>
      {state === 'sent' && <div className="alert alert--ok">{t.contact.successText}</div>}
      {state === 'error' && <div className="alert alert--err">{t.checkout.errorText}</div>}

      <div className="field--row">
        <div className="field">
          <label htmlFor="c-name">{t.checkout.name} *</label>
          <input id="c-name" required autoComplete="name" value={form.name} onChange={set('name')} />
        </div>
        <div className="field">
          <label htmlFor="c-phone">{t.checkout.phone} *</label>
          <input id="c-phone" type="tel" required autoComplete="tel" value={form.phone} onChange={set('phone')} />
        </div>
      </div>

      <div className="field--row">
        <div className="field">
          <label htmlFor="c-email">{t.checkout.email}</label>
          <input id="c-email" type="email" autoComplete="email" value={form.email} onChange={set('email')} />
        </div>
        <div className="field">
          <label htmlFor="c-subject">{t.contact.subject}</label>
          <input id="c-subject" value={form.subject} onChange={set('subject')} />
        </div>
      </div>

      <div className="field">
        <label htmlFor="c-message">{t.contact.message} *</label>
        <textarea id="c-message" required value={form.message} onChange={set('message')} />
      </div>

      {/* Honeypot: off-screen, never focusable. A filled value means a bot,
          and the API silently drops the message. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={form.company}
        onChange={set('company')}
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
      />

      <div className="buy-row">
        <button type="submit" className="btn btn--primary" disabled={state === 'sending'}>
          {state === 'sending' ? t.contact.sending : t.contact.send}
        </button>
        <a className="btn btn--whatsapp" href={wa} target="_blank" rel="noopener noreferrer">
          <WhatsappIcon size={18} />
          WhatsApp
        </a>
      </div>
    </form>
  );
}
