'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminShell from '@/admin/AdminShell';
import { api, ApiError } from '@/admin/client';
import { dateTime, dh } from '@/admin/format';
import { STATUS_LABEL, type Order, type OrderStatus } from '@/admin/types';

export default function OrdersPage() {
  return (
    <AdminShell title="Commandes">
      <OrdersView />
    </AdminShell>
  );
}

const STATUSES = Object.keys(STATUS_LABEL) as OrderStatus[];

/** Colour of the status pill: what still needs doing stands out, closed is quiet. */
const badgeClass = (s: OrderStatus) => {
  if (s === 'nouvelle') return 'adm-badge adm-badge--warn';
  if (s === 'annulee') return 'adm-badge adm-badge--danger';
  if (s === 'livree') return 'adm-badge adm-badge--on';
  return 'adm-badge';
};

function OrdersView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (query.trim()) params.set('q', query.trim());
      const { orders: list } = await api<{ orders: Order[] }>(
        `/api/admin/orders${params.toString() ? `?${params}` : ''}`,
      );
      setOrders(list);
      setError('');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Chargement impossible.');
    }
    setLoading(false);
  }, [status, query]);

  useEffect(() => {
    load();
  }, [load]);

  async function setOrderStatus(order: Order, next: OrderStatus, adminNote?: string) {
    try {
      const { order: saved } = await api<{ order: Order }>(`/api/admin/orders/${order.reference}`, {
        method: 'PATCH',
        body: { status: next, adminNote: adminNote ?? order.adminNote ?? '' },
      });
      setOrders((list) => list.map((o) => (o.reference === saved.reference ? saved : o)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Modification impossible.');
    }
  }

  return (
    <div className="adm-stack">
      {error && <p className="adm-alert adm-alert--err">{error}</p>}

      <div className="adm-card">
        <div className="adm-row">
          <label className="adm-field" style={{ flex: '1 1 240px' }}>
            <span>Rechercher</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Référence, nom, téléphone, ville"
            />
          </label>
          <label className="adm-field" style={{ flex: '0 1 220px' }}>
            <span>Statut</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Tous</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
          </label>
          <button type="button" className="adm-btn" style={{ marginLeft: 'auto' }} onClick={load}>
            Actualiser
          </button>
        </div>
      </div>

      {loading ? (
        <p className="adm-muted">Chargement…</p>
      ) : (
        <div className="adm-card">
          <div className="adm-tablewrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Date</th>
                  <th>Client</th>
                  <th>Ville</th>
                  <th className="adm-num">Articles</th>
                  <th className="adm-num">Total</th>
                  <th>Statut</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <Row
                    key={o.reference}
                    order={o}
                    open={open === o.reference}
                    onToggle={() => setOpen(open === o.reference ? '' : o.reference)}
                    onStatus={setOrderStatus}
                  />
                ))}
                {!orders.length && (
                  <tr><td colSpan={8} className="adm-muted">Aucune commande.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  order,
  open,
  onToggle,
  onStatus,
}: {
  order: Order;
  open: boolean;
  onToggle: () => void;
  onStatus: (o: Order, s: OrderStatus, note?: string) => void;
}) {
  const [note, setNote] = useState(order.adminNote || '');

  return (
    <>
      <tr>
        <td>
          <code>{order.reference}</code>
          {order.quoteOnly && <div className="adm-small adm-muted">Devis (prix sur demande)</div>}
        </td>
        <td className="adm-small">{dateTime(order.createdAt)}</td>
        <td>
          {order.customer.name}
          <div className="adm-small adm-muted">
            <a href={`tel:${order.customer.phone}`}>{order.customer.phone}</a>
          </div>
        </td>
        <td className="adm-small">{order.customer.city}</td>
        <td className="adm-num">{order.items.reduce((n, i) => n + i.qty, 0)}</td>
        <td className="adm-num">{dh(order.total)}</td>
        <td><span className={badgeClass(order.status)}>{STATUS_LABEL[order.status]}</span></td>
        <td className="adm-num">
          <button type="button" className="adm-btn adm-btn--sm" onClick={onToggle}>
            {open ? 'Fermer' : 'Détail'}
          </button>
        </td>
      </tr>

      {open && (
        <tr>
          <td colSpan={8} style={{ background: 'var(--surface-alt)' }}>
            <div className="adm-grid adm-grid--2">
              <div>
                <h3 className="adm-legend">Livraison</h3>
                <p className="adm-small">
                  {order.customer.address}<br />
                  {order.customer.city}<br />
                  {order.customer.email && <>{order.customer.email}<br /></>}
                  <a href={`https://wa.me/${order.customer.phone.replace(/\D/g, '').replace(/^0/, '212')}`} target="_blank" rel="noreferrer">
                    Écrire sur WhatsApp
                  </a>
                </p>
                {order.customer.notes && (
                  <p className="adm-small" style={{ marginTop: '.6rem' }}>
                    <strong>Note du client :</strong> {order.customer.notes}
                  </p>
                )}
                {order.rejected?.length > 0 && (
                  <p className="adm-alert adm-alert--err adm-small" style={{ marginTop: '.6rem' }}>
                    Articles retirés au moment de la commande (retirés du catalogue) :{' '}
                    {order.rejected.join(', ')}
                  </p>
                )}
              </div>

              <div>
                <h3 className="adm-legend">Articles</h3>
                <table className="adm-table">
                  <tbody>
                    {order.items.map((i) => (
                      <tr key={i.id}>
                        <td>
                          {i.name.fr}
                          <div className="adm-small adm-muted">{i.id}</div>
                          {i.quotedPrice !== undefined && (
                            <div className="adm-small adm-badge adm-badge--warn">
                              Prix affiché au client : {dh(i.quotedPrice)}
                            </div>
                          )}
                        </td>
                        <td className="adm-num">× {i.qty}</td>
                        <td className="adm-num">{dh(i.lineTotal)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={2}>Livraison</td>
                      <td className="adm-num">{order.shipping ? dh(order.shipping) : 'Offerte'}</td>
                    </tr>
                    <tr>
                      <td colSpan={2}><strong>Total</strong></td>
                      <td className="adm-num"><strong>{dh(order.total)}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="adm-row" style={{ marginTop: '1rem' }}>
              <label className="adm-field" style={{ flex: '1 1 320px' }}>
                <span>Note interne</span>
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Rappeler lundi, acompte reçu…" />
              </label>
              <label className="adm-field" style={{ flex: '0 1 200px' }}>
                <span>Statut</span>
                <select
                  value={order.status}
                  onChange={(e) => onStatus(order, e.target.value as OrderStatus, note)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="adm-btn adm-btn--primary"
                style={{ alignSelf: 'end' }}
                onClick={() => onStatus(order, order.status, note)}
              >
                Enregistrer la note
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
