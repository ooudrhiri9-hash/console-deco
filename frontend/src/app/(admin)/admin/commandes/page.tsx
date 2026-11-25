'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import AdminShell from '@/admin/AdminShell';
import { api, ApiError } from '@/admin/client';
import { dateTime, dh } from '@/admin/format';
import { STATUS_LABEL, type AdminProduct, type Order, type OrderStatus } from '@/admin/types';

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

/** Hours a "nouvelle" order may wait for a WhatsApp answer before someone calls. */
const CALL_AFTER_HOURS = 3;
const TO_CALL = 'a-rappeler';

/**
 * A new order needs a phone call when WhatsApp could not do the job: never
 * sent (quote, older order, WhatsApp off), failed, or left unanswered.
 */
const needsCall = (o: Order) => {
  if (o.status !== 'nouvelle') return false;
  const wa = o.whatsapp;
  if (!wa || wa.status === 'failed' || wa.status === 'disabled') return true;
  return Date.now() - new Date(wa.at).getTime() > CALL_AFTER_HOURS * 3_600_000;
};

const WA_LABEL: Record<string, string> = {
  sent: 'WhatsApp envoyé',
  delivered: 'WhatsApp reçu',
  read: 'WhatsApp lu',
  failed: 'WhatsApp en échec',
  disabled: 'WhatsApp non configuré',
};

function WhatsAppBadge({ order }: { order: Order }) {
  if (order.confirmation?.by === 'whatsapp') {
    return (
      <div className="adm-small adm-muted">
        {order.confirmation.result === 'annulee' ? 'Annulée' : 'Confirmée'} par le client (WhatsApp)
      </div>
    );
  }
  if (order.status !== 'nouvelle') return null;
  return (
    <>
      {order.whatsapp && (
        <div className={`adm-small ${order.whatsapp.status === 'failed' ? '' : 'adm-muted'}`}>
          {WA_LABEL[order.whatsapp.status] ?? order.whatsapp.status}
        </div>
      )}
      {needsCall(order) && <span className="adm-badge adm-badge--warn">À rappeler</span>}
    </>
  );
}

/** Where the sale stands with Meta: only shown once something was attempted or is due. */
function MetaBadge({ order }: { order: Order }) {
  const p = order.capi?.purchase;
  if (p?.status === 'sent') {
    return <div className="adm-small adm-muted">Envoyée à Meta{p.test ? ' (test)' : ''}</div>;
  }
  if (p?.status === 'failed') {
    return <span className="adm-badge adm-badge--danger" title={p.error || ''}>Meta : échec</span>;
  }
  if (order.channel === 'whatsapp' && order.status === 'livree') {
    return <div className="adm-small adm-muted">Meta non configuré</div>;
  }
  return null;
}

type LeadInfo = { ref: string; channel: string; createdAt: string; fromMetaAd: boolean };

const EMPTY_SALE = {
  leadRef: '', name: '', phone: '', city: '', address: '',
  description: '', qty: '1', total: '', status: 'confirmee', adminNote: '',
};

/**
 * Une vente conclue sur WhatsApp, saisie à la main.
 *
 * Si le client est venu d'un bouton du site, son premier message porte
 * « [Réf. MD-XXXX] » : la recopier ici rattache la vente au clic, donc à la
 * pub qui l'a amené. Passée « Livrée », la vente part chez Meta comme achat.
 */
function WhatsAppSaleForm({ onCreated, onCancel }: { onCreated: (o: Order, msg: string) => void; onCancel: () => void }) {
  const [f, setF] = useState(EMPTY_SALE);
  const [lead, setLead] = useState<LeadInfo | null | 'unknown'>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof EMPTY_SALE) => (e: { target: { value: string } }) =>
    setF((v) => ({ ...v, [k]: e.target.value }));

  // La référence est vérifiée dès qu'elle est complète : Omar voit tout de
  // suite si le client vient d'une pub.
  const ref = (f.leadRef.toUpperCase().match(/MD-[A-Z0-9]{4}/) || [''])[0];
  useEffect(() => {
    if (!ref) {
      setLead(null);
      return;
    }
    let live = true;
    api<{ lead: LeadInfo }>(`/api/admin/leads/${ref}`)
      .then(({ lead: l }) => live && setLead(l))
      .catch(() => live && setLead('unknown'));
    return () => {
      live = false;
    };
  }, [ref]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { order, lead: l, capiEnabled } = await api<{
        order: Order;
        lead: { found: boolean; fromMetaAd: boolean } | null;
        capiEnabled: boolean;
      }>('/api/admin/orders/whatsapp', {
        method: 'POST',
        body: {
          leadRef: f.leadRef,
          customer: { name: f.name, phone: f.phone, city: f.city, address: f.address },
          description: f.description,
          qty: Number(f.qty) || 1,
          total: Number(f.total.replace(/\s/g, '')) || 0,
          status: f.status,
          adminNote: f.adminNote,
        },
      });
      const parts = [`Vente ${order.reference} enregistrée.`];
      if (l?.fromMetaAd) parts.push('Client venu d’une pub Meta.');
      else if (l?.found) parts.push('Référence trouvée (client venu du site, sans pub).');
      else if (l) parts.push('Référence inconnue : la vente sera reliée par le numéro de téléphone seulement.');
      if (order.status === 'livree') {
        parts.push(order.capi?.purchase?.status === 'sent'
          ? 'Envoyée à Meta.'
          : capiEnabled ? 'Envoi à Meta échoué, réessayez depuis le détail.' : 'Meta non configuré sur le serveur.');
      } else {
        parts.push('Elle partira chez Meta quand vous la passerez « Livrée ».');
      }
      onCreated(order, parts.join(' '));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Enregistrement impossible.');
    }
    setBusy(false);
  }

  return (
    <form className="adm-card adm-stack" onSubmit={submit}>
      <h2 className="adm-legend">Nouvelle vente WhatsApp</h2>
      {error && <p className="adm-alert adm-alert--err">{error}</p>}
      <div className="adm-row">
        <label className="adm-field" style={{ flex: '0 1 220px' }}>
          <span>Réf. dans le message (facultatif)</span>
          <input value={f.leadRef} onChange={set('leadRef')} placeholder="MD-7K2M" />
        </label>
        <div className="adm-small" style={{ alignSelf: 'end', paddingBottom: '.6rem' }}>
          {lead === 'unknown' && <span className="adm-badge adm-badge--warn">Référence inconnue</span>}
          {lead && lead !== 'unknown' && (
            lead.fromMetaAd
              ? <span className="adm-badge adm-badge--on">Venu d’une pub Meta</span>
              : <span className="adm-badge">Venu du site (sans pub)</span>
          )}
        </div>
      </div>
      <div className="adm-row">
        <label className="adm-field" style={{ flex: '1 1 200px' }}>
          <span>Nom *</span>
          <input required value={f.name} onChange={set('name')} />
        </label>
        <label className="adm-field" style={{ flex: '1 1 160px' }}>
          <span>Téléphone *</span>
          <input required type="tel" value={f.phone} onChange={set('phone')} placeholder="06 00 00 00 00" />
        </label>
        <label className="adm-field" style={{ flex: '1 1 140px' }}>
          <span>Ville</span>
          <input value={f.city} onChange={set('city')} />
        </label>
        <label className="adm-field" style={{ flex: '2 1 240px' }}>
          <span>Adresse</span>
          <input value={f.address} onChange={set('address')} />
        </label>
      </div>
      <div className="adm-row">
        <label className="adm-field" style={{ flex: '3 1 280px' }}>
          <span>Ce qui a été commandé *</span>
          <input required value={f.description} onChange={set('description')} placeholder="Tableau Totem 50×75, cadre doré" />
        </label>
        <label className="adm-field" style={{ flex: '0 1 90px' }}>
          <span>Quantité</span>
          <input type="number" min={1} max={99} value={f.qty} onChange={set('qty')} />
        </label>
        <label className="adm-field" style={{ flex: '0 1 140px' }}>
          <span>Montant total (DH) *</span>
          <input required inputMode="numeric" value={f.total} onChange={set('total')} placeholder="230" />
        </label>
        <label className="adm-field" style={{ flex: '0 1 180px' }}>
          <span>Statut</span>
          <select value={f.status} onChange={set('status')}>
            <option value="confirmee">Confirmée</option>
            <option value="livree">Déjà livrée (envoyer à Meta)</option>
          </select>
        </label>
      </div>
      <label className="adm-field">
        <span>Note interne</span>
        <input value={f.adminNote} onChange={set('adminNote')} />
      </label>
      <div className="adm-row">
        <button type="submit" className="adm-btn adm-btn--primary" disabled={busy}>
          {busy ? 'Enregistrement…' : 'Enregistrer la vente'}
        </button>
        <button type="button" className="adm-btn" onClick={onCancel}>Annuler</button>
      </div>
    </form>
  );
}

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
      if (status) params.set('status', status === TO_CALL ? 'nouvelle' : status);
      if (query.trim()) params.set('q', query.trim());
      const { orders: list } = await api<{ orders: Order[] }>(
        `/api/admin/orders${params.toString() ? `?${params}` : ''}`,
      );
      setOrders(status === TO_CALL ? list.filter(needsCall) : list);
      setError('');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Chargement impossible.');
    }
    setLoading(false);
  }, [status, query]);

  useEffect(() => {
    load();
  }, [load]);

  // La commande ne garde pas la photo : on la relit dans le catalogue, par
  // référence. Une pièce supprimée depuis s'affiche simplement sans image.
  const [images, setImages] = useState<Record<string, string>>({});
  useEffect(() => {
    api<{ products: AdminProduct[] }>('/api/admin/products')
      .then(({ products }) => setImages(
        Object.fromEntries(products.filter((p) => p.images?.[0]).map((p) => [p.id, p.images[0]])),
      ))
      .catch(() => {}); // sans photos, la page reste utilisable
  }, []);

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

  async function resendWhatsApp(order: Order) {
    try {
      const { order: saved } = await api<{ order: Order }>(
        `/api/admin/orders/${order.reference}/whatsapp`,
        { method: 'POST' },
      );
      setOrders((list) => list.map((o) => (o.reference === saved.reference ? saved : o)));
      setError('');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Envoi WhatsApp impossible.');
    }
  }

  async function resendMeta(order: Order) {
    try {
      const { order: saved } = await api<{ order: Order }>(
        `/api/admin/orders/${order.reference}/meta`,
        { method: 'POST' },
      );
      setOrders((list) => list.map((o) => (o.reference === saved.reference ? saved : o)));
      setError(saved.capi?.purchase?.status === 'sent' ? '' : `Envoi à Meta échoué : ${saved.capi?.purchase?.error || 'raison inconnue'}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Envoi à Meta impossible.');
    }
  }

  const [showSale, setShowSale] = useState(false);
  const [notice, setNotice] = useState('');

  async function removeOrder(order: Order) {
    if (!window.confirm(`Supprimer la commande ${order.reference} ? Cette action est définitive.`)) return;
    try {
      await api(`/api/admin/orders/${order.reference}`, { method: 'DELETE' });
      setOrders((list) => list.filter((o) => o.reference !== order.reference));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Suppression impossible.');
    }
  }

  return (
    <div className="adm-stack">
      {error && <p className="adm-alert adm-alert--err">{error}</p>}
      {notice && <p className="adm-alert adm-alert--ok">{notice}</p>}

      {showSale && (
        <WhatsAppSaleForm
          onCancel={() => setShowSale(false)}
          onCreated={(order, msg) => {
            setOrders((list) => [order, ...list]);
            setNotice(msg);
            setShowSale(false);
          }}
        />
      )}

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
              <option value={TO_CALL}>À rappeler (sans réponse WhatsApp)</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
          </label>
          {!showSale && (
            <button
              type="button"
              className="adm-btn adm-btn--primary"
              style={{ marginLeft: 'auto' }}
              onClick={() => {
                setNotice('');
                setShowSale(true);
              }}
            >
              + Vente WhatsApp
            </button>
          )}
          <button type="button" className="adm-btn" style={showSale ? { marginLeft: 'auto' } : undefined} onClick={load}>
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
                    onResend={resendWhatsApp}
                    onMeta={resendMeta}
                    onRemove={removeOrder}
                    images={images}
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
  onResend,
  onMeta,
  onRemove,
  images,
}: {
  order: Order;
  open: boolean;
  onToggle: () => void;
  onStatus: (o: Order, s: OrderStatus, note?: string) => void;
  onResend: (o: Order) => void;
  onMeta: (o: Order) => void;
  onRemove: (o: Order) => void;
  images: Record<string, string>;
}) {
  const [note, setNote] = useState(order.adminNote || '');

  return (
    <>
      <tr>
        <td>
          <code>{order.reference}</code>
          {order.channel === 'whatsapp' && (
            <div className="adm-small">
              <span className="adm-badge">WhatsApp</span>
              {order.leadRef && <span className="adm-muted"> {order.leadRef}</span>}
            </div>
          )}
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
        <td>
          <span className={badgeClass(order.status)}>{STATUS_LABEL[order.status]}</span>
          <WhatsAppBadge order={order} />
          <MetaBadge order={order} />
        </td>
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
                    {/* Index in the key: the same piece can appear twice with two different frames. */}
                    {order.items.map((i, k) => (
                      <tr key={`${i.id}-${k}`}>
                        <td style={{ width: '4.5rem' }}>
                          {images[i.id] && <img className="adm-thumb" src={images[i.id]} alt="" loading="lazy" />}
                        </td>
                        <td>
                          {i.name.fr}
                          <div className="adm-small adm-muted">{i.id}</div>
                          {i.options?.map((o) => (
                            <div key={o.id} className="adm-small">
                              {o.name.fr} : <strong>{o.label.fr}</strong>
                              {o.requested && (
                                <span className="adm-badge adm-badge--warn">
                                  demandé : {o.requested}
                                </span>
                              )}
                            </div>
                          ))}
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
                      <td colSpan={3}>Livraison</td>
                      <td className="adm-num">{order.shipping ? dh(order.shipping) : 'Offerte'}</td>
                    </tr>
                    <tr>
                      <td colSpan={3}><strong>Total</strong></td>
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
              {order.status === 'nouvelle' && order.whatsapp?.status !== 'disabled' && (
                <button
                  type="button"
                  className="adm-btn"
                  style={{ alignSelf: 'end' }}
                  onClick={() => onResend(order)}
                  title={order.whatsapp?.error || ''}
                >
                  {order.whatsapp ? 'Renvoyer la confirmation WhatsApp' : 'Envoyer la confirmation WhatsApp'}
                </button>
              )}
              {order.channel === 'whatsapp' && order.status === 'livree' && order.capi?.purchase?.status !== 'sent' && (
                <button
                  type="button"
                  className="adm-btn"
                  style={{ alignSelf: 'end' }}
                  onClick={() => onMeta(order)}
                  title={order.capi?.purchase?.error || ''}
                >
                  Envoyer la vente à Meta
                </button>
              )}
              <button
                type="button"
                className="adm-btn adm-btn--danger"
                style={{ alignSelf: 'end', marginLeft: 'auto' }}
                onClick={() => onRemove(order)}
              >
                Supprimer
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
