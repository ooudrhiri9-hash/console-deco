'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import AdminShell from '@/admin/AdminShell';
import { api, ApiError, uploadPhoto } from '@/admin/client';
import { dh, slugId } from '@/admin/format';
import type { AdminCategory, AdminProduct } from '@/admin/types';
import type { ProductOption, ProductOptionKind } from '@/types';

export default function ProductsPage() {
  return (
    <AdminShell title="Pièces">
      <ProductsView />
    </AdminShell>
  );
}

type Draft = AdminProduct & { colorsFr: string; colorsEn: string };

/** An empty sheet. Everything the API requires is either filled or defaulted. */
const blankDraft = (categoryId: string): Draft => ({
  id: '',
  slug: '',
  categoryId,
  name: { fr: '', en: '' },
  shortDescription: { fr: '', en: '' },
  description: { fr: '', en: '' },
  price: 0,
  images: [],
  materials: { fr: '', en: '' },
  colors: [],
  colorsFr: '',
  colorsEn: '',
  inStock: true,
  madeToOrder: false,
  featured: false,
  bestSeller: false,
  active: true,
});

const toDraft = (p: AdminProduct): Draft => ({
  ...p,
  colorsFr: (p.colors || []).map((c) => c.fr).join(', '),
  colorsEn: (p.colors || []).map((c) => c.en).join(', '),
});

/**
 * Deux listes toutes faites, parce que personne n'a envie de taper huit cadres
 * à la main sur chaque toile. Ce sont des points de départ : les libellés, les
 * suppléments et le nombre de valeurs se modifient ensuite ligne par ligne.
 *
 * Les identifiants restent vides : l'API les dérive du libellé français et les
 * fige à l'enregistrement, comme les adresses de pièces. Une valeur renommée
 * plus tard garde donc l'identifiant que les commandes déjà passées citent.
 */
const PRESETS: Record<'cadre' | 'dimensions' | 'encadrement', ProductOption> = {
  cadre: {
    id: 'cadre',
    name: { fr: 'Cadre', en: 'Frame' },
    kind: 'frame',
    values: [
      { id: '', label: { fr: 'Sans cadre', en: 'No frame' }, extra: 0 },
      { id: '', label: { fr: 'Cadre noir', en: 'Black frame' }, extra: 0, swatch: '#1c1917' },
      { id: '', label: { fr: 'Cadre blanc', en: 'White frame' }, extra: 0, swatch: '#f2eee6' },
      { id: '', label: { fr: 'Cadre doré', en: 'Gold frame' }, extra: 0, swatch: '#c9a24d' },
      { id: '', label: { fr: 'Cadre argenté', en: 'Silver frame' }, extra: 0, swatch: '#b8b8b4' },
      { id: '', label: { fr: 'Cadre marron', en: 'Brown frame' }, extra: 0, swatch: '#5b3a24' },
      { id: '', label: { fr: 'Cadre bleu marine', en: 'Navy frame' }, extra: 0, swatch: '#1f2a44' },
      { id: '', label: { fr: 'Cadre bois hêtre', en: 'Beech frame' }, extra: 0, swatch: '#d6b48a' },
    ],
  },
  dimensions: {
    id: 'dimensions',
    name: { fr: 'Format', en: 'Size' },
    kind: 'size',
    values: [
      { id: '', label: { fr: '50 × 75 cm', en: '50 × 75 cm' }, extra: 0 },
      { id: '', label: { fr: '100 × 60 cm', en: '100 × 60 cm' }, extra: 0 },
      { id: '', label: { fr: '120 × 80 cm', en: '120 × 80 cm' }, extra: 0 },
    ],
  },
  // Les deux finitions des tableaux de l'atelier (docs/PRIX-TABLEAUX.md).
  encadrement: {
    id: 'encadrement',
    name: { fr: 'Encadrement', en: 'Framing' },
    kind: 'frame',
    values: [
      { id: '', label: { fr: 'Faux cadre', en: 'Stretched canvas' }, extra: 0 },
      { id: '', label: { fr: 'Caisse américaine', en: 'Floater frame' }, extra: 0, swatch: '#1c1917' },
    ],
  },
};

const KIND_LABELS: Array<[ProductOptionKind | '', string]> = [
  ['', 'Puces simples'],
  ['size', 'Format — grille des tailles avec leur prix'],
  ['frame', 'Cadre — pastilles de couleur, photo encadrée'],
];

const blankOption = (): ProductOption => ({
  id: '',
  name: { fr: '', en: '' },
  values: [
    { id: '', label: { fr: '', en: '' }, extra: 0 },
    { id: '', label: { fr: '', en: '' }, extra: 0 },
  ],
});

/**
 * Two comma-separated lists back into [{ fr, en }]. The French list drives the
 * length: an English list that is shorter simply repeats the French label,
 * which is what the API would do anyway.
 */
function zipColors(fr: string, en: string) {
  const left = fr.split(',').map((s) => s.trim()).filter(Boolean);
  const right = en.split(',').map((s) => s.trim());
  return left.map((label, i) => ({ fr: label, en: right[i]?.trim() || label }));
}

function ProductsView() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [family, setFamily] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([
        api<{ products: AdminProduct[] }>('/api/admin/products'),
        api<{ categories: AdminCategory[] }>('/api/admin/categories'),
      ]);
      setProducts(p.products);
      setCategories(c.categories);
      setError('');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Chargement impossible.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categoryName = useCallback(
    (id: string) => categories.find((c) => c.id === id)?.name.fr || id,
    [categories],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products
      .filter((p) => (family ? p.categoryId === family : true))
      .filter((p) => (q
        ? [p.name.fr, p.id, p.slug].some((v) => String(v).toLowerCase().includes(q))
        : true))
      .sort((a, b) => a.categoryId.localeCompare(b.categoryId) || a.name.fr.localeCompare(b.name.fr));
  }, [products, search, family]);

  /** Optimistic switch: the row flips at once, and reverts if the API refuses. */
  async function toggle(p: AdminProduct, key: 'active' | 'featured' | 'inStock' | 'bestSeller') {
    const next = !(p[key] ?? true);
    setProducts((list) => list.map((x) => (x.slug === p.slug ? { ...x, [key]: next } : x)));
    try {
      await api(`/api/admin/products/${p.slug}`, { method: 'PATCH', body: { [key]: next } });
    } catch (e) {
      setProducts((list) => list.map((x) => (x.slug === p.slug ? { ...x, [key]: !next } : x)));
      setError(e instanceof ApiError ? e.message : 'Modification refusée.');
    }
  }

  async function remove(p: AdminProduct) {
    if (!window.confirm(`Supprimer « ${p.name.fr} » ? Cette action est définitive.`)) return;
    try {
      await api(`/api/admin/products/${p.slug}`, { method: 'DELETE' });
      setProducts((list) => list.filter((x) => x.slug !== p.slug));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Suppression impossible.');
    }
  }

  if (loading) return <p className="adm-muted">Chargement…</p>;

  return (
    <div className="adm-stack">
      {error && <p className="adm-alert adm-alert--err">{error}</p>}

      <div className="adm-card">
        <div className="adm-row">
          <label className="adm-field" style={{ flex: '1 1 220px' }}>
            <span>Rechercher</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom, référence, adresse…"
            />
          </label>
          <label className="adm-field" style={{ flex: '0 1 240px' }}>
            <span>Famille</span>
            <select value={family} onChange={(e) => setFamily(e.target.value)}>
              <option value="">Toutes</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name.fr}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="adm-btn adm-btn--primary"
            style={{ marginLeft: 'auto' }}
            onClick={() => setDraft(blankDraft(categories[0]?.id || ''))}
            disabled={!categories.length}
          >
            Ajouter une pièce
          </button>
        </div>
        <p className="adm-hint" style={{ marginTop: '.6rem' }}>
          {rows.length} pièce(s) affichée(s) sur {products.length}. Prix, stock, textes,
          photos et nouvelles pièces apparaissent sur le site dès le rechargement de la page
          par le visiteur. Seules les adresses des nouvelles pages et le référencement
          demandent une reconstruction du site.
        </p>
      </div>

      <div className="adm-card">
        <div className="adm-tablewrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Pièce</th>
                <th>Famille</th>
                <th className="adm-num">Prix</th>
                <th>En ligne</th>
                <th>Vedette</th>
                <th>Best-seller</th>
                <th>Stock</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.slug}>
                  <td>
                    {p.images?.[0]
                      ? <img className="adm-thumb" src={p.images[0]} alt="" loading="lazy" />
                      : <div className="adm-thumb" />}
                  </td>
                  <td>
                    <strong>{p.name.fr}</strong>
                    <div className="adm-small adm-muted">
                      {p.id} · /{p.slug}
                    </div>
                  </td>
                  <td className="adm-small">{categoryName(p.categoryId)}</td>
                  <td className="adm-num">{dh(p.price)}</td>
                  <td>
                    <Switch on={p.active !== false} onClick={() => toggle(p, 'active')} labels={['En ligne', 'Masquée']} />
                  </td>
                  <td>
                    <Switch on={!!p.featured} onClick={() => toggle(p, 'featured')} labels={['Oui', 'Non']} />
                  </td>
                  <td>
                    <Switch on={!!p.bestSeller} onClick={() => toggle(p, 'bestSeller')} labels={['Oui', 'Non']} />
                  </td>
                  <td>
                    <Switch on={p.inStock !== false} onClick={() => toggle(p, 'inStock')} labels={['Dispo', 'Épuisée']} />
                  </td>
                  <td className="adm-num">
                    <div className="adm-row" style={{ justifyContent: 'flex-end', gap: '.4rem' }}>
                      <button type="button" className="adm-btn adm-btn--sm" onClick={() => setDraft(toDraft(p))}>
                        Modifier
                      </button>
                      <button type="button" className="adm-btn adm-btn--sm adm-btn--danger" onClick={() => remove(p)}>
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={9} className="adm-muted">Aucune pièce ne correspond.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {draft && (
        <ProductSheet
          draft={draft}
          categories={categories}
          onClose={() => setDraft(null)}
          onSaved={() => {
            setDraft(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function Switch({ on, onClick, labels }: { on: boolean; onClick: () => void; labels: [string, string] }) {
  return (
    <button
      type="button"
      className={`adm-badge ${on ? 'adm-badge--on' : 'adm-badge--off'}`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      {on ? labels[0] : labels[1]}
    </button>
  );
}

function ProductSheet({
  draft,
  categories,
  onClose,
  onSaved,
}: {
  draft: Draft;
  categories: AdminCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Draft>(draft);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const isNew = !draft.slug;

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setLoc = (key: 'name' | 'shortDescription' | 'description' | 'materials' | 'finish', lang: 'fr' | 'en', value: string) =>
    setForm((f) => ({
      ...f,
      [key]: { fr: '', en: '', ...(f[key] as { fr: string; en: string } | undefined), [lang]: value },
    }));

  const setDim = (key: 'width' | 'depth' | 'height', value: string) =>
    setForm((f) => ({
      ...f,
      dimensions: { ...(f.dimensions || {}), unit: 'cm', [key]: value === '' ? undefined : Number(value) },
    }));

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError('');
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        // Sequential on purpose: sharp re-encodes each photo, and a shared
        // host handles one at a time far better than five at once.
        urls.push(await uploadPhoto(file, form.name.fr));
      }
      setForm((f) => ({ ...f, images: [...(f.images || []), ...urls].slice(0, 10) }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Envoi de la photo impossible.');
    }
    setUploading(false);
  }

  // --- Choix proposés (cadre, dimensions) -----------------------------------
  const options: ProductOption[] = form.options || [];
  const setOptions = (next: ProductOption[]) => setForm((f) => ({ ...f, options: next }));
  const patchOption = (i: number, patch: Partial<ProductOption>) =>
    setOptions(options.map((o, k) => (k === i ? { ...o, ...patch } : o)));
  const patchValue = (i: number, j: number, patch: Partial<ProductOption['values'][number]>) =>
    patchOption(i, { values: options[i].values.map((v, k) => (k === j ? { ...v, ...patch } : v)) });
  // Le format de la pièce, et l'id que l'API donnera à chacune de ses valeurs.
  const sizeKeys = (options.find((o) => o.kind === 'size')?.values || [])
    .map((v) => ({ key: v.id || slugId(v.label.fr), label: v.label.fr }))
    .filter((sz) => sz.key);
  const setKind = (i: number, kind: ProductOptionKind | '') =>
    setOptions(options.map((o, k) => {
      if (k === i) return { ...o, kind: kind || undefined };
      // Un seul format par pièce : l'ancien redevient un choix simple.
      return kind === 'size' && o.kind === 'size' ? { ...o, kind: undefined } : o;
    }));
  const patchBySize = (i: number, j: number, sizeKey: string, raw: string) => {
    const current = { ...(options[i].values[j].extraBySize || {}) };
    if (raw === '') delete current[sizeKey];
    else current[sizeKey] = Math.max(0, Math.round(Number(raw) || 0));
    patchValue(i, j, { extraBySize: Object.keys(current).length ? current : undefined });
  };

  const moveImage = (from: number, to: number) =>
    setForm((f) => {
      const next = [...f.images];
      if (to < 0 || to >= next.length) return f;
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      return { ...f, images: next };
    });

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');

    const body = {
      ...form,
      colors: zipColors(form.colorsFr, form.colorsEn),
      price: Number(form.price) || 0,
      compareAtPrice: Number(form.compareAtPrice) || 0,
      leadTimeDays: Number(form.leadTimeDays) || 0,
    };
    delete (body as Partial<Draft>).colorsFr;
    delete (body as Partial<Draft>).colorsEn;

    try {
      if (isNew) {
        await api('/api/admin/products', { method: 'POST', body });
      } else {
        await api(`/api/admin/products/${draft.slug}`, { method: 'PATCH', body });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Enregistrement impossible.');
      setBusy(false);
    }
  }

  return (
    <div
      className="adm-drawer"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        // Only a click on the backdrop itself closes: a drag that ends outside
        // a text field should never throw away a half-written sheet.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form className="adm-drawer__panel" onSubmit={save}>
        <div className="adm-drawer__head">
          <h2>{isNew ? 'Nouvelle pièce' : form.name.fr}</h2>
          <button type="button" className="adm-btn adm-btn--sm" style={{ marginLeft: 'auto' }} onClick={onClose}>
            Fermer
          </button>
        </div>

        {error && <p className="adm-alert adm-alert--err">{error}</p>}

        <section>
          <h3 className="adm-legend">Identité</h3>
          <div className="adm-fields">
            <label className="adm-field">
              <span>Nom (FR) *</span>
              <input required value={form.name.fr} onChange={(e) => setLoc('name', 'fr', e.target.value)} />
            </label>
            <label className="adm-field">
              <span>Nom (EN)</span>
              <input value={form.name.en} onChange={(e) => setLoc('name', 'en', e.target.value)} />
            </label>
            <label className="adm-field">
              <span>Référence (SKU)</span>
              <input
                value={form.id}
                onChange={(e) => set('id', e.target.value.toUpperCase())}
                placeholder="CNS-030"
              />
            </label>
            <label className="adm-field">
              <span>Famille *</span>
              <select required value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name.fr}</option>
                ))}
              </select>
            </label>
          </div>
          <p className="adm-hint" style={{ marginTop: '.5rem' }}>
            {isNew
              ? "L'adresse de la page est créée à partir du nom français."
              : `Adresse de la page : /produits/…/${form.slug} — elle ne change pas quand vous renommez la pièce, pour ne casser aucun lien.`}
          </p>
        </section>

        <section>
          <h3 className="adm-legend">Textes</h3>
          <div className="adm-fields">
            <label className="adm-field">
              <span>Accroche (FR)</span>
              <input
                value={form.shortDescription.fr}
                onChange={(e) => setLoc('shortDescription', 'fr', e.target.value)}
                maxLength={220}
              />
            </label>
            <label className="adm-field">
              <span>Accroche (EN)</span>
              <input
                value={form.shortDescription.en}
                onChange={(e) => setLoc('shortDescription', 'en', e.target.value)}
                maxLength={220}
              />
            </label>
          </div>
          <div className="adm-fields" style={{ marginTop: '.9rem' }}>
            <label className="adm-field">
              <span>Description (FR)</span>
              <textarea
                value={form.description.fr}
                onChange={(e) => setLoc('description', 'fr', e.target.value)}
              />
            </label>
            <label className="adm-field">
              <span>Description (EN)</span>
              <textarea
                value={form.description.en}
                onChange={(e) => setLoc('description', 'en', e.target.value)}
              />
            </label>
          </div>
          <p className="adm-hint">Une ligne vide sépare deux paragraphes sur la fiche produit.</p>
        </section>

        <section>
          <h3 className="adm-legend">Photos</h3>
          <div className="adm-photos">
            {form.images.map((src, i) => (
              <div className="adm-photo" key={`${src}-${i}`}>
                <img src={src} alt="" />
                <button
                  type="button"
                  className="adm-photo__x"
                  title="Retirer"
                  onClick={() => set('images', form.images.filter((_, j) => j !== i))}
                >
                  ×
                </button>
                <div className="adm-row" style={{ gap: '.2rem', marginTop: '.25rem' }}>
                  <button type="button" className="adm-btn adm-btn--sm" onClick={() => moveImage(i, i - 1)} disabled={i === 0}>←</button>
                  <button type="button" className="adm-btn adm-btn--sm" onClick={() => moveImage(i, i + 1)} disabled={i === form.images.length - 1}>→</button>
                </div>
              </div>
            ))}
          </div>
          <div className="adm-row" style={{ marginTop: '.8rem' }}>
            <label className="adm-btn">
              {uploading ? 'Envoi…' : 'Ajouter des photos'}
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = '';
                }}
              />
            </label>
            <span className="adm-hint">
              La première photo est celle qui s’affiche partout. JPEG/PNG/WebP, 12 Mo maximum,
              recadrée en 800×1000.
            </span>
          </div>
        </section>

        <section>
          <h3 className="adm-legend">Prix &amp; disponibilité</h3>
          <div className="adm-fields">
            <label className="adm-field">
              <span>Prix (DH)</span>
              <input
                type="number"
                min={0}
                value={form.price || ''}
                onChange={(e) => set('price', Number(e.target.value))}
                placeholder="0 = sur demande"
              />
            </label>
            <label className="adm-field">
              <span>Prix barré (DH)</span>
              <input
                type="number"
                min={0}
                value={form.compareAtPrice || ''}
                onChange={(e) => set('compareAtPrice', Number(e.target.value))}
              />
            </label>
            <label className="adm-field">
              <span>Délai de fabrication (jours)</span>
              <input
                type="number"
                min={0}
                max={365}
                value={form.leadTimeDays || ''}
                onChange={(e) => set('leadTimeDays', Number(e.target.value))}
                disabled={!form.madeToOrder}
              />
            </label>
          </div>
          <div className="adm-row" style={{ marginTop: '.9rem' }}>
            <label className="adm-check">
              <input type="checkbox" checked={form.active !== false} onChange={(e) => set('active', e.target.checked)} />
              Visible sur le site
            </label>
            <label className="adm-check">
              <input type="checkbox" checked={!!form.featured} onChange={(e) => set('featured', e.target.checked)} />
              Mise en avant sur l’accueil
            </label>
            <label className="adm-check">
              <input type="checkbox" checked={!!form.bestSeller} onChange={(e) => set('bestSeller', e.target.checked)} />
              Meilleure vente
            </label>
            <label className="adm-check">
              <input type="checkbox" checked={form.inStock !== false} onChange={(e) => set('inStock', e.target.checked)} />
              En stock
            </label>
            <label className="adm-check">
              <input type="checkbox" checked={!!form.madeToOrder} onChange={(e) => set('madeToOrder', e.target.checked)} />
              Sur commande
            </label>
          </div>
          <p className="adm-hint">Un prix à 0 affiche « Sur demande » et bascule la commande en devis.</p>
          <p className="adm-hint">
            « Meilleure vente » remplit la section du même nom sur l’accueil (4 pièces au
            maximum, sans numéro de classement). Dès que les commandes enregistrées suffisent
            à classer, c’est le vrai classement des ventes qui prend la place.
          </p>
        </section>

        <section>
          <h3 className="adm-legend">Choix proposés</h3>
          <p className="adm-hint" style={{ marginBottom: '.9rem' }}>
            Le cadre, les formats. Ils s’affichent sur la fiche sous le prix ; la première
            valeur est celle cochée d’office, mettez donc la moins chère en tête. Un choix
            avec moins de deux valeurs est ignoré. Sans aucun choix, la fiche ne change pas —
            c’est le cas de toutes les consoles.
          </p>

          {options.map((option, i) => (
            <div className="adm-option" key={i}>
              <div className="adm-fields">
                <label className="adm-field">
                  <span>Nom du choix (FR)</span>
                  <input
                    value={option.name.fr}
                    placeholder="Cadre"
                    onChange={(e) => patchOption(i, { name: { ...option.name, fr: e.target.value } })}
                  />
                </label>
                <label className="adm-field">
                  <span>Nom du choix (EN)</span>
                  <input
                    value={option.name.en}
                    placeholder="Frame"
                    onChange={(e) => patchOption(i, { name: { ...option.name, en: e.target.value } })}
                  />
                </label>
                <label className="adm-field">
                  <span>Affichage sur la fiche</span>
                  <select
                    value={option.kind || ''}
                    onChange={(e) => setKind(i, e.target.value as ProductOptionKind | '')}
                  >
                    {KIND_LABELS.map(([k, label]) => (
                      <option key={k} value={k}>{label}</option>
                    ))}
                  </select>
                </label>
                <div className="adm-field" style={{ justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="adm-btn adm-btn--sm adm-btn--danger"
                    onClick={() => setOptions(options.filter((_, k) => k !== i))}
                  >
                    Supprimer ce choix
                  </button>
                </div>
              </div>

              <table className="adm-table adm-table--tight">
                <thead>
                  <tr>
                    <th>Valeur (FR)</th>
                    <th>Valeur (EN)</th>
                    {option.kind === 'frame' && <th>Teinte</th>}
                    <th className="adm-num">Supplément (DH)</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {option.values.map((value, j) => (
                    <tr key={j}>
                      <td>
                        <input
                          value={value.label.fr}
                          placeholder="Cadre doré"
                          onChange={(e) => patchValue(i, j, { label: { ...value.label, fr: e.target.value } })}
                        />
                      </td>
                      <td>
                        <input
                          value={value.label.en}
                          placeholder="Gold frame"
                          onChange={(e) => patchValue(i, j, { label: { ...value.label, en: e.target.value } })}
                        />
                      </td>
                      {option.kind === 'frame' && (
                        <td>
                          <span className="adm-swatch">
                            <input
                              type="color"
                              value={value.swatch || '#ffffff'}
                              aria-label={`Teinte — ${value.label.fr || 'valeur'}`}
                              onChange={(e) => patchValue(i, j, { swatch: e.target.value })}
                            />
                            {value.swatch ? (
                              <button
                                type="button"
                                className="adm-btn adm-btn--sm"
                                onClick={() => patchValue(i, j, { swatch: undefined })}
                              >
                                Aucune
                              </button>
                            ) : (
                              <em>sans cadre</em>
                            )}
                          </span>
                        </td>
                      )}
                      <td className="adm-num">
                        <input
                          type="number"
                          min={0}
                          value={value.extra || ''}
                          placeholder="0"
                          onChange={(e) => patchValue(i, j, { extra: Number(e.target.value) || 0 })}
                        />
                      </td>
                      <td className="adm-num">
                        <button
                          type="button"
                          className="adm-btn adm-btn--sm"
                          onClick={() =>
                            patchOption(i, { values: option.values.filter((_, k) => k !== j) })
                          }
                        >
                          Retirer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {option.kind !== 'size' && sizeKeys.length > 0 && (
                <>
                  <p className="adm-hint" style={{ marginTop: '.8rem' }}>
                    Supplément selon le format (facultatif). Une case vide reprend le supplément
                    ci-dessus. Utile quand l’écart change avec la taille : la caisse américaine
                    coûte +230 DH en 80 × 80 mais +290 DH en 100 × 100.
                  </p>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="adm-table adm-table--tight">
                      <thead>
                        <tr>
                          <th>Valeur</th>
                          {sizeKeys.map((sz) => (
                            <th className="adm-num" key={sz.key}>{sz.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {option.values.map((value, j) => (
                          <tr key={j}>
                            <td>{value.label.fr || '—'}</td>
                            {sizeKeys.map((sz) => (
                              <td className="adm-num" key={sz.key}>
                                <input
                                  type="number"
                                  min={0}
                                  value={value.extraBySize?.[sz.key] ?? ''}
                                  placeholder={String(value.extra || 0)}
                                  aria-label={`${value.label.fr} — ${sz.label}`}
                                  onChange={(e) => patchBySize(i, j, sz.key, e.target.value)}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              <button
                type="button"
                className="adm-btn adm-btn--sm"
                style={{ marginTop: '.6rem' }}
                onClick={() =>
                  patchOption(i, {
                    values: [...option.values, { id: '', label: { fr: '', en: '' }, extra: 0 }],
                  })
                }
              >
                Ajouter une valeur
              </button>
            </div>
          ))}

          <div className="adm-row" style={{ marginTop: '.8rem' }}>
            <button type="button" className="adm-btn" onClick={() => setOptions([...options, blankOption()])}>
              Ajouter un choix
            </button>
            <button
              type="button"
              className="adm-btn"
              onClick={() => setOptions([...options, structuredClone(PRESETS.cadre)])}
            >
              Cadres (8 valeurs)
            </button>
            <button
              type="button"
              className="adm-btn"
              onClick={() => setOptions([...options, structuredClone(PRESETS.dimensions)])}
            >
              Formats (3 tailles)
            </button>
            <button
              type="button"
              className="adm-btn"
              onClick={() => setOptions([...options, structuredClone(PRESETS.encadrement)])}
            >
              Faux cadre / caisse américaine
            </button>
          </div>
          <p className="adm-hint" style={{ marginTop: '.6rem' }}>
            Le supplément s’ajoute au prix de la pièce, qui est donc celui du plus petit format
            sans cadre ; la fiche affiche chaque format avec son prix. Sur une pièce à 0 (sur demande) il est
            enregistré avec la commande mais rien ne s’affiche : il n’y a pas de prix auquel
            l’ajouter.
          </p>
        </section>

        <section>
          <h3 className="adm-legend">Matières &amp; dimensions</h3>
          <div className="adm-fields">
            <label className="adm-field">
              <span>Matières (FR)</span>
              <input value={form.materials.fr} onChange={(e) => setLoc('materials', 'fr', e.target.value)} />
            </label>
            <label className="adm-field">
              <span>Matières (EN)</span>
              <input value={form.materials.en} onChange={(e) => setLoc('materials', 'en', e.target.value)} />
            </label>
            <label className="adm-field">
              <span>Finition (FR)</span>
              <input value={form.finish?.fr || ''} onChange={(e) => setLoc('finish', 'fr', e.target.value)} />
            </label>
            <label className="adm-field">
              <span>Finition (EN)</span>
              <input value={form.finish?.en || ''} onChange={(e) => setLoc('finish', 'en', e.target.value)} />
            </label>
          </div>
          <div className="adm-fields" style={{ marginTop: '.9rem' }}>
            <label className="adm-field">
              <span>Largeur (cm)</span>
              <input type="number" min={0} value={form.dimensions?.width ?? ''} onChange={(e) => setDim('width', e.target.value)} />
            </label>
            <label className="adm-field">
              <span>Profondeur (cm)</span>
              <input type="number" min={0} value={form.dimensions?.depth ?? ''} onChange={(e) => setDim('depth', e.target.value)} />
            </label>
            <label className="adm-field">
              <span>Hauteur (cm)</span>
              <input type="number" min={0} value={form.dimensions?.height ?? ''} onChange={(e) => setDim('height', e.target.value)} />
            </label>
          </div>
          <div className="adm-fields" style={{ marginTop: '.9rem' }}>
            <label className="adm-field">
              <span>Couleurs (FR)</span>
              <input
                value={form.colorsFr}
                onChange={(e) => set('colorsFr', e.target.value)}
                placeholder="Terre brûlée, Sauge, Sable"
              />
            </label>
            <label className="adm-field">
              <span>Couleurs (EN)</span>
              <input
                value={form.colorsEn}
                onChange={(e) => set('colorsEn', e.target.value)}
                placeholder="Burnt earth, Sage, Sand"
              />
            </label>
          </div>
          <p className="adm-hint">Séparez les couleurs par une virgule, dans le même ordre dans les deux langues.</p>
        </section>

        <div className="adm-row adm-row--end">
          <button type="button" className="adm-btn" onClick={onClose}>Annuler</button>
          <button type="submit" className="adm-btn adm-btn--primary" disabled={busy || uploading}>
            {busy ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}
