'use client';

import Link from '@/components/Link';
import { useEffect, useState } from 'react';
import AdminShell from '@/admin/AdminShell';
import { api, ApiError } from '@/admin/client';
import { dateTime, dh, shortDay } from '@/admin/format';
import { STATUS_LABEL, type Dashboard } from '@/admin/types';

export default function AdminHomePage() {
  return (
    <AdminShell title="Tableau de bord">
      <DashboardView />
    </AdminShell>
  );
}

function DashboardView() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<Dashboard>('/api/admin/dashboard')
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Chargement impossible.'));
  }, []);

  if (error) return <p className="adm-alert adm-alert--err">{error}</p>;
  if (!data) return <p className="adm-muted">Chargement…</p>;

  const { stats, chart, recentOrders } = data;
  // A single scale for the bars: the tallest day fills the box, the rest are
  // read against it. An empty fortnight must not divide by zero.
  const peak = Math.max(1, ...chart.map((d) => d.revenue));

  return (
    <div className="adm-stack">
      <div className="adm-grid adm-grid--stats">
        <Stat k="Commandes" v={String(stats.orders)} n={`${stats.ordersOpen} à traiter`} />
        <Stat k="Chiffre d'affaires" v={dh(stats.revenue)} n={`Panier moyen ${dh(stats.averageBasket)}`} />
        <Stat k="Pièces en ligne" v={`${stats.productsLive}/${stats.products}`} n={`${stats.categories} familles`} />
        <Stat k="Messages non lus" v={String(stats.messagesUnread)} n="Formulaire de contact" />
      </div>

      {(stats.productsWithoutPrice > 0 || stats.productsWithoutImage > 0) && (
        <div className="adm-card">
          <h2 className="adm-legend">À compléter</h2>
          <div className="adm-row">
            {stats.productsWithoutPrice > 0 && (
              <span className="adm-badge adm-badge--warn">
                {stats.productsWithoutPrice} pièce(s) sans prix
              </span>
            )}
            {stats.productsWithoutImage > 0 && (
              <span className="adm-badge adm-badge--warn">
                {stats.productsWithoutImage} pièce(s) sans photo
              </span>
            )}
            <Link href="/admin/produits/" className="adm-btn adm-btn--sm">
              Ouvrir les pièces
            </Link>
          </div>
          <p className="adm-hint" style={{ marginTop: '.6rem' }}>
            Une pièce sans prix s’affiche « Sur demande » sur le site : c’est un choix valable,
            pas une erreur.
          </p>
        </div>
      )}

      <div className="adm-card">
        <h2 className="adm-legend">14 derniers jours</h2>
        <div className="adm-chart">
          {chart.map((d) => (
            <div className="adm-chart__col" key={d.day} title={`${d.day} — ${d.orders} commande(s), ${dh(d.revenue)}`}>
              <div className="adm-chart__bar" style={{ height: `${Math.round((d.revenue / peak) * 100)}%` }} />
            </div>
          ))}
        </div>
        <div className="adm-chart" style={{ height: 'auto', alignItems: 'flex-start' }}>
          {chart.map((d) => (
            <div className="adm-chart__col" key={`l-${d.day}`} style={{ height: 'auto' }}>
              <div className="adm-chart__day">{shortDay(d.day)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="adm-card">
        <h2 className="adm-legend">Dernières commandes</h2>
        {recentOrders.length === 0 ? (
          <p className="adm-muted">Aucune commande pour l’instant.</p>
        ) : (
          <div className="adm-tablewrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Client</th>
                  <th>Ville</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th className="adm-num">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.reference}>
                    <td><code>{o.reference}</code></td>
                    <td>{o.customer.name}</td>
                    <td>{o.customer.city}</td>
                    <td className="adm-small">{dateTime(o.createdAt)}</td>
                    <td><span className="adm-badge">{STATUS_LABEL[o.status]}</span></td>
                    <td className="adm-num">{dh(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="adm-row adm-row--end" style={{ marginTop: '.9rem' }}>
          <Link href="/admin/commandes/" className="adm-btn adm-btn--sm">Toutes les commandes</Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ k, v, n }: { k: string; v: string; n?: string }) {
  return (
    <div className="adm-card">
      <div className="adm-stat__k">{k}</div>
      <div className="adm-stat__v">{v}</div>
      {n && <div className="adm-stat__n">{n}</div>}
    </div>
  );
}
