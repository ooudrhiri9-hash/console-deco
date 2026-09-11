'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiUrl } from '@/config/api';
import { builtBestSellers, products as built, categories as builtCategories } from '@/lib/catalogue';
import type { BestSeller, Category, Product } from '@/types';

/**
 * The catalogue, refreshed in the browser.
 *
 * The pages are static HTML built from an API snapshot, so a price changed in
 * /admin an hour ago is stale until the next build. One request per page load
 * fixes that: prices, stock and the list of pieces come back live, without
 * giving up the static hosting or the server-rendered HTML that Google indexes.
 *
 * Everything degrades to the built-in snapshot: if the API is slow, blocked by
 * CORS or down, the visitor simply sees what was true at build time.
 */

type Snapshot = { products: Product[]; categories: Category[]; bestSellers: BestSeller[] };

const Ctx = createContext<Snapshot | null>(null);

/** One request per page load, shared by every component that asks. */
let pending: Promise<Snapshot | null> | null = null;

function load(): Promise<Snapshot | null> {
  if (pending) return pending;
  pending = fetch(apiUrl('/api/catalogue'), { headers: { Accept: 'application/json' } })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      const products = Array.isArray(data?.products) ? (data.products as Product[]) : null;
      const categories = Array.isArray(data?.categories) ? (data.categories as Category[]) : null;
      const bestSellers = Array.isArray(data?.bestSellers) ? (data.bestSellers as BestSeller[]) : [];
      // An empty answer means a misconfigured API, not an empty shop: ignoring
      // it keeps the built snapshot on screen instead of emptying the page.
      return products?.length && categories?.length ? { products, categories, bestSellers } : null;
    })
    .catch(() => null);
  return pending;
}

export function LiveCatalogueProvider({ children }: { children: ReactNode }) {
  const [live, setLive] = useState<Snapshot | null>(null);

  useEffect(() => {
    let alive = true;
    load().then((snap) => {
      if (alive && snap) setLive(snap);
    });
    return () => {
      alive = false;
    };
  }, []);

  return <Ctx.Provider value={live}>{children}</Ctx.Provider>;
}

export const useLiveCatalogue = () => useContext(Ctx);

/** Slugs that have a static page. Anything else needs the fallback sheet. */
const BUILT_SLUGS = new Set(built.map((p) => p.slug));
export const hasStaticPage = (slug: string) => BUILT_SLUGS.has(slug);

/**
 * The live version of a piece.
 * `removed` means the owner hid or deleted it after the build — the page still
 * exists and is still indexed, so it says so instead of taking an order.
 */
export function useLiveProduct(product: Product): { product: Product; removed: boolean } {
  const live = useLiveCatalogue();
  if (!live) return { product, removed: false };
  const fresh = live.products.find((p) => p.slug === product.slug);
  return fresh ? { product: fresh, removed: false } : { product, removed: true };
}

/** A piece looked up by slug alone — for the fallback sheet. */
export function useProductBySlug(slug: string): { product: Product | null; ready: boolean } {
  const live = useLiveCatalogue();
  const fromBuild = built.find((p) => p.slug === slug) || null;
  if (!live) return { product: fromBuild, ready: false };
  return { product: live.products.find((p) => p.slug === slug) || null, ready: true };
}

/**
 * Le classement des ventes, rafraichi comme le reste : une piece qui se met a
 * bien se vendre remonte sans qu'on reconstruise le site.
 *
 * Renvoie les produits complets, dans l'ordre du classement, en ignorant une
 * piece entre-temps retiree du catalogue. Liste vide = pas assez de commandes
 * pour classer quoi que ce soit, et la section ne s'affiche pas.
 */
export function useBestSellers(): Array<{ product: Product; sold: number }> {
  const live = useLiveCatalogue();
  const ranking = live ? live.bestSellers : builtBestSellers;
  const catalogue = live ? live.products : built;

  return (ranking || [])
    .map(({ slug, sold }) => {
      const product = catalogue.find((p) => p.slug === slug);
      return product ? { product, sold } : null;
    })
    .filter(Boolean) as Array<{ product: Product; sold: number }>;
}

export function useLiveCategories(): Category[] {
  const live = useLiveCatalogue();
  return live ? live.categories : builtCategories;
}

/**
 * A list of pieces, refreshed.
 *
 * The built order is kept for the pieces that were already there — a grid must
 * not reshuffle itself under the visitor's cursor a second after it loads —
 * and anything added since is appended.
 */
export function useLiveList(fallback: Product[], categoryId?: string): Product[] {
  const live = useLiveCatalogue();
  if (!live) return fallback;

  const wanted = categoryId
    ? live.products.filter((p) => p.categoryId === categoryId)
    : live.products;
  const bySlug = new Map(wanted.map((p) => [p.slug, p]));

  const kept = fallback.map((p) => bySlug.get(p.slug)).filter(Boolean) as Product[];
  const seen = new Set(kept.map((p) => p.slug));
  const added = wanted.filter((p) => !seen.has(p.slug));

  return [...kept, ...added];
}
