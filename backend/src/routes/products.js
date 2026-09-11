import { Router } from 'express';
import { requireAdmin } from '../auth.js';
import { store } from '../store/index.js';
import { isToggleOnly, normaliseProduct, TOGGLES } from '../lib/product.js';
import { bool, slugify } from '../lib/text.js';

export const productRoutes = Router();

const categoryIds = async () => new Set((await store.categories.all()).map((c) => c.id));

/** Appends -2, -3… so a duplicate name never makes the form fail. */
async function freeSlug(wanted, taken) {
  const base = slugify(wanted) || 'piece';
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

/** Full catalogue, hidden pieces included. */
productRoutes.get('/products', requireAdmin, async (req, res) => {
  try {
    res.json({ products: await store.products.all() });
  } catch (e) {
    console.error('[products GET]', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

productRoutes.get('/products/:slug', requireAdmin, async (req, res) => {
  try {
    const product = await store.products.get(req.params.slug);
    if (!product) {
      res.status(404).json({ error: 'Pièce introuvable' });
      return;
    }
    res.json({ product });
  } catch (e) {
    console.error('[product GET]', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

productRoutes.post('/products', requireAdmin, async (req, res) => {
  try {
    const { error, product } = normaliseProduct(req.body, null, await categoryIds());
    if (error) {
      res.status(400).json({ error });
      return;
    }

    const existing = await store.products.all();
    const slug = await freeSlug(req.body?.slug || product.name.fr, new Set(existing.map((p) => p.slug)));

    // The SKU is printed on the invoice and quoted on the phone: it has to be
    // unique even though the slug already is.
    if (existing.some((p) => p.id === product.id)) {
      res.status(409).json({ error: `La référence ${product.id} est déjà utilisée.` });
      return;
    }

    const now = new Date().toISOString();
    const created = await store.products.create({ ...product, slug, createdAt: now, updatedAt: now });
    res.status(201).json({ ok: true, product: created });
  } catch (e) {
    console.error('[products POST]', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

productRoutes.patch('/products/:slug', requireAdmin, async (req, res) => {
  try {
    const current = await store.products.get(req.params.slug);
    if (!current) {
      res.status(404).json({ error: 'Pièce introuvable' });
      return;
    }

    // Switches flipped from the list (show / hide, highlight, in stock) skip
    // the full sheet validation — there is no sheet on that screen to validate.
    if (isToggleOnly(req.body)) {
      const patch = Object.fromEntries(
        TOGGLES.filter((k) => k in req.body).map((k) => [k, bool(req.body[k])]),
      );
      patch.updatedAt = new Date().toISOString();
      res.json({ ok: true, product: await store.products.update(current.slug, patch) });
      return;
    }

    const { error, product } = normaliseProduct(req.body, current, await categoryIds());
    if (error) {
      res.status(400).json({ error });
      return;
    }

    const others = (await store.products.all()).filter((p) => p.slug !== current.slug);
    if (others.some((p) => p.id === product.id)) {
      res.status(409).json({ error: `La référence ${product.id} est déjà utilisée.` });
      return;
    }

    const updated = await store.products.update(current.slug, {
      ...product,
      updatedAt: new Date().toISOString(),
    });
    res.json({ ok: true, product: updated });
  } catch (e) {
    console.error('[product PATCH]', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

productRoutes.delete('/products/:slug', requireAdmin, async (req, res) => {
  try {
    const done = await store.products.remove(req.params.slug);
    if (!done) {
      res.status(404).json({ error: 'Pièce introuvable' });
      return;
    }
    res.json({ ok: true });
  } catch (e) {
    console.error('[product DELETE]', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
