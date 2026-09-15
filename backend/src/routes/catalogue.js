import { Router } from 'express';
import { store } from '../store/index.js';
import { publicView } from '../lib/product.js';
import { readSettings } from '../lib/settings.js';
import { pickBestSellers } from '../lib/bestsellers.js';

export const catalogueRoutes = Router();

/**
 * The one public read the shop needs: live products, families and settings in a
 * single request. Called twice — by the build script to make the static HTML,
 * and by the browser on every page load to refresh what that HTML froze.
 */
catalogueRoutes.get('/catalogue', async (req, res) => {
  try {
    const [products, categories, settings, orders] = await Promise.all([
      store.products.all(),
      store.categories.all(),
      readSettings(),
      store.orders.all(),
    ]);

    const ranking = pickBestSellers(orders, products, 4);

    res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=300');
    res.json({
      products: (products || []).filter((p) => p.active !== false).map(publicView),
      categories: (categories || []).sort((a, b) => (a.order ?? 99) - (b.order ?? 99)),
      settings,
      // Classement calcule sur les commandes reelles, ou a defaut la selection
      // faite dans /admin. Liste vide = rien a montrer, la boutique masque la
      // section plutot que d'inventer un palmares.
      bestSellers: ranking.list,
      bestSellersSource: ranking.source,
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[catalogue]', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
