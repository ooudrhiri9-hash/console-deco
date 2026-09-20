'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'favorites.v1';

interface FavoritesApi {
  /** Slugs des pièces gardées, la plus récente en tête. */
  slugs: string[];
  has: (slug: string) => boolean;
  toggle: (slug: string) => void;
  /** Faux au premier rendu, pour que le HTML du serveur et du navigateur concordent. */
  ready: boolean;
}

const FavoritesContext = createContext<FavoritesApi | null>(null);

/**
 * Les pièces mises de côté par le visiteur, sur cet appareil seulement.
 *
 * On range le slug et rien d'autre : il ne change jamais (voir README), alors
 * que prix, photo et nom sont relus dans le catalogue à chaque affichage.
 */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (Array.isArray(parsed)) setSlugs(parsed.filter((s) => typeof s === 'string').slice(0, 200));
    } catch {
      /* navigation privée, stockage bloqué : on part d'une liste vide */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
    } catch {
      /* la liste reste valable pour cette page */
    }
  }, [slugs, ready]);

  const api = useMemo<FavoritesApi>(
    () => ({
      slugs,
      ready,
      has: (slug) => slugs.includes(slug),
      toggle: (slug) =>
        setSlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [slug, ...prev])),
    }),
    [slugs, ready],
  );

  return <FavoritesContext.Provider value={api}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesApi {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used inside <FavoritesProvider>');
  return ctx;
}
