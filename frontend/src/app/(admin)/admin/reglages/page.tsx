'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import AdminShell from '@/admin/AdminShell';
import { api, ApiError } from '@/admin/client';
import type { AdminCategory, Settings } from '@/admin/types';

export default function SettingsPage() {
  return (
    <AdminShell title="Réglages">
      <div className="adm-stack">
        <ShopSettings />
        <Families />
        <PasswordCard />
      </div>
    </AdminShell>
  );
}

/* -------------------------------------------------------------------------- */

function ShopSettings() {
  const [form, setForm] = useState<Settings | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ settings: Settings }>('/api/admin/settings')
      .then((r) => setForm(r.settings))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Chargement impossible.'));
  }, []);

  if (error && !form) return <p className="adm-alert adm-alert--err">{error}</p>;
  if (!form) return <p className="adm-muted">Chargement…</p>;

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => {
    setForm((f) => (f ? { ...f, [k]: v } : f));
    setSaved(false);
  };
  const setIn = <K extends 'baseline' | 'hours' | 'announcement' | 'address' | 'social'>(
    k: K,
    sub: string,
    v: string,
  ) => {
    setForm((f) => (f ? { ...f, [k]: { ...(f[k] as Record<string, string>), [sub]: v } } : f));
    setSaved(false);
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { settings } = await api<{ settings: Settings }>('/api/admin/settings', {
        method: 'PUT',
        body: form,
      });
      setForm(settings);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Enregistrement impossible.');
    }
    setBusy(false);
  }

  return (
    <form className="adm-card" onSubmit={submit}>
      <h2 className="adm-legend">Boutique</h2>

      {error && <p className="adm-alert adm-alert--err">{error}</p>}
      {saved && <p className="adm-alert adm-alert--ok">Réglages enregistrés.</p>}

      <div className="adm-fields">
        <label className="adm-field">
          <span>Nom de marque</span>
          <input value={form.brand} onChange={(e) => set('brand', e.target.value)} />
        </label>
        <label className="adm-field">
          <span>Nom court</span>
          <input value={form.brandShort} onChange={(e) => set('brandShort', e.target.value)} />
        </label>
        <label className="adm-field">
          <span>Adresse du site</span>
          <input value={form.url} onChange={(e) => set('url', e.target.value)} placeholder="https://…" />
        </label>
      </div>

      <div className="adm-fields" style={{ marginTop: '.9rem' }}>
        <label className="adm-field">
          <span>Baseline (FR)</span>
          <input value={form.baseline.fr} onChange={(e) => setIn('baseline', 'fr', e.target.value)} />
        </label>
        <label className="adm-field">
          <span>Baseline (EN)</span>
          <input value={form.baseline.en} onChange={(e) => setIn('baseline', 'en', e.target.value)} />
        </label>
      </div>

      <h3 className="adm-legend" style={{ marginTop: '1.4rem' }}>Contact</h3>
      <div className="adm-fields">
        <label className="adm-field">
          <span>Téléphone affiché</span>
          <input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        </label>
        <label className="adm-field">
          <span>WhatsApp (chiffres, sans +)</span>
          <input value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="212665202495" />
        </label>
        <label className="adm-field">
          <span>E-mail</span>
          <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        </label>
      </div>
      <p className="adm-hint">
        Le lien « appeler » est reconstruit à partir du téléphone affiché : inutile de le saisir deux fois.
      </p>

      <div className="adm-fields" style={{ marginTop: '.9rem' }}>
        <label className="adm-field">
          <span>Rue</span>
          <input value={form.address.street} onChange={(e) => setIn('address', 'street', e.target.value)} />
        </label>
        <label className="adm-field">
          <span>Ville</span>
          <input value={form.address.city} onChange={(e) => setIn('address', 'city', e.target.value)} />
        </label>
        <label className="adm-field">
          <span>Région</span>
          <input value={form.address.region} onChange={(e) => setIn('address', 'region', e.target.value)} />
        </label>
        <label className="adm-field">
          <span>Code postal</span>
          <input value={form.address.postalCode} onChange={(e) => setIn('address', 'postalCode', e.target.value)} />
        </label>
      </div>

      <div className="adm-fields" style={{ marginTop: '.9rem' }}>
        <label className="adm-field">
          <span>Horaires (FR)</span>
          <input value={form.hours.fr} onChange={(e) => setIn('hours', 'fr', e.target.value)} />
        </label>
        <label className="adm-field">
          <span>Horaires (EN)</span>
          <input value={form.hours.en} onChange={(e) => setIn('hours', 'en', e.target.value)} />
        </label>
      </div>

      <div className="adm-fields" style={{ marginTop: '.9rem' }}>
        <label className="adm-field">
          <span>Instagram</span>
          <input value={form.social.instagram} onChange={(e) => setIn('social', 'instagram', e.target.value)} placeholder="https://…" />
        </label>
        <label className="adm-field">
          <span>Facebook</span>
          <input value={form.social.facebook} onChange={(e) => setIn('social', 'facebook', e.target.value)} placeholder="https://…" />
        </label>
        <label className="adm-field">
          <span>TikTok</span>
          <input value={form.social.tiktok} onChange={(e) => setIn('social', 'tiktok', e.target.value)} placeholder="https://…" />
        </label>
      </div>
      <p className="adm-hint">Un champ vide masque l’icône. Une adresse incomplète est ignorée.</p>

      <h3 className="adm-legend" style={{ marginTop: '1.4rem' }}>Livraison &amp; annonce</h3>
      <div className="adm-fields">
        <label className="adm-field">
          <span>Livraison offerte à partir de (DH)</span>
          <input
            type="number"
            min={0}
            value={form.freeShippingThreshold}
            onChange={(e) => set('freeShippingThreshold', Number(e.target.value))}
          />
        </label>
        <label className="adm-field">
          <span>Frais de livraison (DH)</span>
          <input
            type="number"
            min={0}
            value={form.shippingFlatRate}
            onChange={(e) => set('shippingFlatRate', Number(e.target.value))}
          />
        </label>
      </div>
      <div className="adm-fields" style={{ marginTop: '.9rem' }}>
        <label className="adm-field">
          <span>Bandeau d’annonce (FR)</span>
          <input value={form.announcement.fr} onChange={(e) => setIn('announcement', 'fr', e.target.value)} />
        </label>
        <label className="adm-field">
          <span>Bandeau d’annonce (EN)</span>
          <input value={form.announcement.en} onChange={(e) => setIn('announcement', 'en', e.target.value)} />
        </label>
      </div>
      <p className="adm-hint">
        Frais à 0 : la livraison est toujours offerte. Sinon, elle devient gratuite au-dessus du seuil.
      </p>

      <div className="adm-row adm-row--end" style={{ marginTop: '1.2rem' }}>
        <button type="submit" className="adm-btn adm-btn--primary" disabled={busy}>
          {busy ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */

const blankCategory = (): AdminCategory => ({
  id: '',
  slug: { fr: '', en: '' },
  name: { fr: '', en: '' },
  tagline: { fr: '', en: '' },
  description: { fr: '', en: '' },
  image: '',
  order: 99,
});

function Families() {
  const [list, setList] = useState<AdminCategory[]>([]);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const { categories } = await api<{ categories: AdminCategory[] }>('/api/admin/categories');
      setList(categories);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Chargement impossible.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    setError('');
    const isNew = !list.some((c) => c.id === editing.id);
    try {
      if (isNew) {
        await api('/api/admin/categories', { method: 'POST', body: editing });
      } else {
        await api(`/api/admin/categories/${editing.id}`, { method: 'PATCH', body: editing });
      }
      setEditing(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Enregistrement impossible.');
    }
    setBusy(false);
  }

  async function remove(c: AdminCategory) {
    if (!window.confirm(`Supprimer la famille « ${c.name.fr} » ?`)) return;
    try {
      await api(`/api/admin/categories/${c.id}`, { method: 'DELETE' });
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Suppression impossible.');
    }
  }

  const setLoc = (key: 'name' | 'tagline' | 'description' | 'slug', lang: 'fr' | 'en', v: string) =>
    setEditing((c) => (c ? { ...c, [key]: { ...c[key], [lang]: v } } : c));

  return (
    <div className="adm-card">
      <h2 className="adm-legend">Familles</h2>
      {error && <p className="adm-alert adm-alert--err">{error}</p>}

      <div className="adm-tablewrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th className="adm-num">Ordre</th>
              <th>Nom</th>
              <th>Adresses (FR / EN)</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {[...list].sort((a, b) => a.order - b.order).map((c) => (
              <tr key={c.id}>
                <td className="adm-num">{c.order}</td>
                <td>
                  <strong>{c.name.fr}</strong>
                  <div className="adm-small adm-muted">{c.id}</div>
                </td>
                <td className="adm-small">/{c.slug.fr} · /{c.slug.en}</td>
                <td className="adm-num">
                  <div className="adm-row" style={{ justifyContent: 'flex-end', gap: '.4rem' }}>
                    <button type="button" className="adm-btn adm-btn--sm" onClick={() => setEditing(c)}>Modifier</button>
                    <button type="button" className="adm-btn adm-btn--sm adm-btn--danger" onClick={() => remove(c)}>Supprimer</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="adm-row adm-row--end" style={{ marginTop: '.9rem' }}>
        <button type="button" className="adm-btn" onClick={() => setEditing(blankCategory())}>
          Ajouter une famille
        </button>
      </div>

      {editing && (
        <form className="adm-card" style={{ marginTop: '1rem', background: 'var(--surface-alt)' }} onSubmit={save}>
          <h3 className="adm-legend">{list.some((c) => c.id === editing.id) ? editing.name.fr : 'Nouvelle famille'}</h3>

          <div className="adm-fields">
            <label className="adm-field">
              <span>Nom (FR) *</span>
              <input required value={editing.name.fr} onChange={(e) => setLoc('name', 'fr', e.target.value)} />
            </label>
            <label className="adm-field">
              <span>Nom (EN)</span>
              <input value={editing.name.en} onChange={(e) => setLoc('name', 'en', e.target.value)} />
            </label>
            <label className="adm-field">
              <span>Identifiant</span>
              <input
                value={editing.id}
                onChange={(e) => setEditing({ ...editing, id: e.target.value })}
                disabled={list.some((c) => c.id === editing.id)}
                placeholder="laisser vide = créé à partir du nom"
              />
            </label>
            <label className="adm-field">
              <span>Ordre d’affichage</span>
              <input
                type="number"
                min={1}
                max={999}
                value={editing.order}
                onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })}
              />
            </label>
          </div>

          <div className="adm-fields" style={{ marginTop: '.9rem' }}>
            <label className="adm-field">
              <span>Adresse FR</span>
              <input value={editing.slug.fr} onChange={(e) => setLoc('slug', 'fr', e.target.value)} />
            </label>
            <label className="adm-field">
              <span>Adresse EN</span>
              <input value={editing.slug.en} onChange={(e) => setLoc('slug', 'en', e.target.value)} />
            </label>
            <label className="adm-field">
              <span>Image (chemin ou URL)</span>
              <input
                value={editing.image}
                onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                placeholder="/media/products/console-1.webp"
              />
            </label>
          </div>
          <p className="adm-hint">
            ⚠ Changer une adresse change une URL déjà indexée par Google. Ne le faites que pour une
            famille récente.
          </p>

          <div className="adm-fields" style={{ marginTop: '.9rem' }}>
            <label className="adm-field">
              <span>Accroche (FR)</span>
              <input value={editing.tagline.fr} onChange={(e) => setLoc('tagline', 'fr', e.target.value)} />
            </label>
            <label className="adm-field">
              <span>Accroche (EN)</span>
              <input value={editing.tagline.en} onChange={(e) => setLoc('tagline', 'en', e.target.value)} />
            </label>
          </div>

          <div className="adm-fields" style={{ marginTop: '.9rem' }}>
            <label className="adm-field">
              <span>Texte de présentation (FR)</span>
              <textarea value={editing.description.fr} onChange={(e) => setLoc('description', 'fr', e.target.value)} />
            </label>
            <label className="adm-field">
              <span>Texte de présentation (EN)</span>
              <textarea value={editing.description.en} onChange={(e) => setLoc('description', 'en', e.target.value)} />
            </label>
          </div>

          <div className="adm-row adm-row--end" style={{ marginTop: '1rem' }}>
            <button type="button" className="adm-btn" onClick={() => setEditing(null)}>Annuler</button>
            <button type="submit" className="adm-btn adm-btn--primary" disabled={busy}>
              {busy ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function PasswordCard() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await api('/api/admin/password', { method: 'POST', body: { current, next } });
      setMsg({ ok: true, text: 'Mot de passe modifié.' });
      setCurrent('');
      setNext('');
    } catch (err) {
      setMsg({ ok: false, text: err instanceof ApiError ? err.message : 'Modification impossible.' });
    }
    setBusy(false);
  }

  return (
    <form className="adm-card" onSubmit={submit}>
      <h2 className="adm-legend">Mot de passe</h2>
      {msg && <p className={`adm-alert ${msg.ok ? 'adm-alert--ok' : 'adm-alert--err'}`}>{msg.text}</p>}
      <div className="adm-fields">
        <label className="adm-field">
          <span>Mot de passe actuel</span>
          <input type="password" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </label>
        <label className="adm-field">
          <span>Nouveau mot de passe</span>
          <input type="password" required minLength={10} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
        </label>
      </div>
      <p className="adm-hint">10 caractères minimum.</p>
      <div className="adm-row adm-row--end" style={{ marginTop: '1rem' }}>
        <button type="submit" className="adm-btn adm-btn--primary" disabled={busy}>
          {busy ? 'Modification…' : 'Modifier'}
        </button>
      </div>
    </form>
  );
}
