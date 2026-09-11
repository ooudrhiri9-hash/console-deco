/**
 * The catalogue the pages read — one door for the whole site.
 *
 * The live source is src/data/catalogue.json, written by `npm run sync` from
 * the API just before the build. When that snapshot is empty (no API on this
 * machine, or a first checkout) the shipped files src/data/{products,
 * categories}.ts take over, so the site always builds and never renders empty.
 */
import snapshot from '@/data/catalogue.json';
import { products as fallbackProducts } from '@/data/products';
import { categories as fallbackCategories } from '@/data/categories';
import type { BestSeller, Category, Product } from '@/types';

type Snapshot = {
  products: Product[];
  categories: Category[];
  settings: unknown;
  bestSellers?: BestSeller[];
  generatedAt: string | null;
};

const snap = snapshot as unknown as Snapshot;

const live = Array.isArray(snap.products) && snap.products.length > 0
  && Array.isArray(snap.categories) && snap.categories.length > 0;

/** True when the pages were built from the back office rather than the files. */
export const fromApi = live;
export const catalogueDate = live ? snap.generatedAt : null;

export const products: Product[] = live ? snap.products : fallbackProducts;

export const categories: Category[] = live ? snap.categories : fallbackCategories;

export const categoriesInOrder = [...categories].sort((a, b) => a.order - b.order);

export const getCategory = (id: string) => categories.find((c) => c.id === id);

export const allProducts = products;

/**
 * Les pièces les plus commandées au moment du build. Vide tant que l'API n'a
 * pas assez de commandes pour établir un classement honnête.
 */
export const builtBestSellers: BestSeller[] = live && Array.isArray(snap.bestSellers)
  ? snap.bestSellers
  : [];

export const productsInCategory = (categoryId: string) =>
  products.filter((p) => p.categoryId === categoryId);

export const productBySlug = (slug: string) => products.find((p) => p.slug === slug);

export const featuredProducts = (limit = 8) => {
  const picked = products.filter((p) => p.featured);
  return (picked.length ? picked : products).slice(0, limit);
};

export const countByCategory = (categoryId: string) => productsInCategory(categoryId).length;

/**
 * "You may also like": same category first, then any other piece,
 * so the block is never empty even on a thin catalogue.
 */
export function relatedProducts(product: Product, limit = 4): Product[] {
  const sameCat = products.filter(
    (p) => p.categoryId === product.categoryId && p.slug !== product.slug,
  );
  const others = products.filter(
    (p) => p.categoryId !== product.categoryId && p.slug !== product.slug,
  );
  return [...sameCat, ...others].slice(0, limit);
}

/** Lowest price in a category, for "from X DH" on collection cards. */
export function priceFrom(categoryId: string): number | null {
  const prices = productsInCategory(categoryId)
    .map((p) => p.price)
    .filter((p) => p > 0);
  return prices.length ? Math.min(...prices) : null;
}
