'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminShell from '@/admin/AdminShell';
import { api, ApiError } from '@/admin/client';
import { dateTime } from '@/admin/format';
import type { Message } from '@/admin/types';

export default function MessagesPage() {
  return (
    <AdminShell title="Messages">
      <MessagesView />
    </AdminShell>
  );
}

function MessagesView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { messages: list } = await api<{ messages: Message[] }>('/api/admin/messages');
      setMessages(list);
      setError('');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Chargement impossible.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markRead(m: Message, read: boolean) {
    setMessages((list) => list.map((x) => (x.id === m.id ? { ...x, read } : x)));
    try {
      await api(`/api/admin/messages/${m.id}`, { method: 'PATCH', body: { read } });
    } catch (e) {
      setMessages((list) => list.map((x) => (x.id === m.id ? { ...x, read: !read } : x)));
      setError(e instanceof ApiError ? e.message : 'Modification impossible.');
    }
  }

  async function remove(m: Message) {
    if (!window.confirm('Supprimer ce message ? Cette action est définitive.')) return;
    try {
      await api(`/api/admin/messages/${m.id}`, { method: 'DELETE' });
      setMessages((list) => list.filter((x) => x.id !== m.id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Suppression impossible.');
    }
  }

  const shown = unreadOnly ? messages.filter((m) => !m.read) : messages;
  const unread = messages.filter((m) => !m.read).length;

  return (
    <div className="adm-stack">
      {error && <p className="adm-alert adm-alert--err">{error}</p>}

      <div className="adm-card">
        <div className="adm-row">
          <span className="adm-muted">{messages.length} message(s), {unread} non lu(s).</span>
          <label className="adm-check" style={{ marginLeft: 'auto' }}>
            <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} />
            Non lus seulement
          </label>
          <button type="button" className="adm-btn" onClick={load}>Actualiser</button>
        </div>
      </div>

      {loading ? (
        <p className="adm-muted">Chargement…</p>
      ) : (
        <div className="adm-grid">
          {shown.map((m) => (
            <article className="adm-card" key={m.id}>
              <div className="adm-row">
                <strong>{m.name}</strong>
                {!m.read && <span className="adm-badge adm-badge--warn">Non lu</span>}
                <span className="adm-badge adm-badge--off">{m.locale.toUpperCase()}</span>
                <span className="adm-small adm-muted" style={{ marginLeft: 'auto' }}>
                  {dateTime(m.createdAt)}
                </span>
              </div>

              {m.subject && <p style={{ marginTop: '.6rem' }}><strong>{m.subject}</strong></p>}
              <p style={{ whiteSpace: 'pre-wrap', marginTop: '.4rem' }}>{m.body}</p>

              <div className="adm-row" style={{ marginTop: '.9rem' }}>
                {m.email && <a className="adm-btn adm-btn--sm" href={`mailto:${m.email}`}>{m.email}</a>}
                {m.phone && <a className="adm-btn adm-btn--sm" href={`tel:${m.phone}`}>{m.phone}</a>}
                {m.phone && (
                  <a
                    className="adm-btn adm-btn--sm"
                    href={`https://wa.me/${m.phone.replace(/\D/g, '').replace(/^0/, '212')}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp
                  </a>
                )}
                <button type="button" className="adm-btn adm-btn--sm" onClick={() => markRead(m, !m.read)}>
                  Marquer comme {m.read ? 'non lu' : 'lu'}
                </button>
                <button type="button" className="adm-btn adm-btn--sm adm-btn--danger" onClick={() => remove(m)}>
                  Supprimer
                </button>
              </div>
            </article>
          ))}
          {!shown.length && <p className="adm-muted">Aucun message.</p>}
        </div>
      )}
    </div>
  );
}
