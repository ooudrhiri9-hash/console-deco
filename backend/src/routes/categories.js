import { Router } from 'express';
import { requireAdmin } from '../auth.js';
import { store } from '../store/index.js';
import { normaliseCategory } from '../lib/category.js';

export const categoryRoutes = Router();

categoryRoutes.get('/categories', requireAdmin, async (req, res) => {
  try {
    const categories = (await store.categories.all()).sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    const products = await store.products.all();
    // The count decides whether Delete is offered at all, so it ships with the list.
    const counts = Object.fromEntries(
      categories.map((c) => [c.id, products.filter((p) => p.categoryId === c.id).length]),
    );
    res.json({ categories, counts });
  } catch (e) {
    console.error('[categories GET]', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

categoryRoutes.post('/categories', requireAdmin, async (req, res) => {
  try {
    const { error, category } = normaliseCategory(req.body, null);
    if (error) {
      res.status(400).json({ error });
      return;
    }
    if (await store.categories.get(category.id)) {
      res.status(409).json({ error: `L'identifiant ${category.id} existe déjà.` });
      return;
    }
    res.status(201).json({ ok: true, category: await store.categories.create(category) });
  } catch (e) {
    console.error('[categories POST]', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

categoryRoutes.patch('/categories/:id', requireAdmin, async (req, res) => {
  try {
    const current = await store.categories.get(req.params.id);
    if (!current) {
      res.status(404).json({ error: 'Catégorie introuvable' });
      return;
    }
    // The id is the foreign key every product carries; renaming it here would
    // orphan them all. Only the slugs and copy are editable.
    const { error, category } = normaliseCategory({ ...req.body, id: current.id }, current);
    if (error) {
      res.status(400).json({ error });
      return;
    }
    res.json({ ok: true, category: await store.categories.update(current.id, category) });
  } catch (e) {
    console.error('[category PATCH]', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

categoryRoutes.delete('/categories/:id', requireAdmin, async (req, res) => {
  try {
    const used = (await store.products.all()).filter((p) => p.categoryId === req.params.id);
    if (used.length) {
      res.status(409).json({
        error: `${used.length} pièce(s) sont dans cette catégorie. Déplacez-les d'abord.`,
      });
      return;
    }
    const done = await store.categories.remove(req.params.id);
    if (!done) {
      res.status(404).json({ error: 'Catégorie introuvable' });
      return;
    }
    res.json({ ok: true });
  } catch (e) {
    console.error('[category DELETE]', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
