'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { allProducts } from '@/lib/catalogue';
import { lineKey, resolveChoice, unitPrice } from '@/lib/options';
import type { OptionChoice, Product } from '@/types';

const STORAGE_KEY = 'cart.v1';

/** Only the id + qty + the chosen options are persisted; prices are always
 *  re-read from the catalogue so a stale localStorage can never show an
 *  outdated price. */
type StoredLine = { id: string; qty: number; choice?: OptionChoice };
export type CartLine = {
  product: Product;
  qty: number;
  /** Cadre, dimensions… tels qu'ils existent encore sur la fiche. */
  choice: OptionChoice;
  /** Identifie la ligne : même pièce, cadre différent = deux lignes. */
  key: string;
  /** Prix unitaire, suppléments compris. */
  price: number;
};

interface CartApi {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (product: Product, qty?: number, choice?: OptionChoice) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  /** False during the first render so SSR HTML and client HTML match. */
  ready: boolean;
}

const CartContext = createContext<CartApi | null>(null);

/**
 * La clé d'une ligne rangée dans localStorage.
 *
 * Elle est calculée sur la sélection telle qu'elle a été enregistrée, sans
 * relire la fiche : c'est la seule façon de retrouver la bonne ligne quand la
 * pièce a disparu du catalogue entre deux visites.
 */
const keyOf = (l: StoredLine) => lineKey(l.id, l.choice);

export function CartProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<StoredLine[]>([]);
  const [ready, setReady] = useState(false);

  // Hydrate after mount — localStorage does not exist during the static build.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setStored(
            parsed
              .filter((l) => l && typeof l.id === 'string' && Number.isFinite(l.qty))
              .map((l) => ({
                id: l.id,
                qty: Math.max(1, Math.min(99, Math.floor(l.qty))),
                ...(l.choice && typeof l.choice === 'object' ? { choice: l.choice as OptionChoice } : {}),
              })),
          );
        }
      }
    } catch {
      /* private mode / blocked storage — start with an empty cart */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      /* nothing we can do; the cart still works for this page view */
    }
  }, [stored, ready]);

  const api = useMemo<CartApi>(() => {
    const lines: CartLine[] = stored
      .map((l) => {
        const product = allProducts.find((p) => p.id === l.id);
        if (!product) return null;
        // La sélection est relue contre la fiche : un cadre retiré du catalogue
        // retombe sur la valeur par défaut au lieu de rester dans le panier.
        const choice = resolveChoice(product, l.choice);
        return {
          product,
          qty: l.qty,
          choice,
          // Clé calculée sur ce qui est rangé, pas sur ce qui est affiché :
          // sinon un cadre retiré du catalogue rendrait la ligne impossible à
          // supprimer, puisque le bouton chercherait une clé qui n'existe pas.
          key: keyOf(l),
          price: unitPrice(product, choice),
        };
      })
      .filter((l): l is CartLine => l !== null);

    return {
      lines,
      ready,
      count: lines.reduce((n, l) => n + l.qty, 0),
      subtotal: lines.reduce((n, l) => n + l.price * l.qty, 0),
      add: (product, qty = 1, choice) =>
        setStored((prev) => {
          const resolved = resolveChoice(product, choice);
          const key = lineKey(product.id, resolved);
          const found = prev.find((l) => keyOf(l) === key);
          if (found) {
            return prev.map((l) =>
              keyOf(l) === key ? { ...l, qty: Math.min(99, l.qty + qty) } : l,
            );
          }
          return [
            ...prev,
            { id: product.id, qty, ...(Object.keys(resolved).length ? { choice: resolved } : {}) },
          ];
        }),
      setQty: (key, qty) =>
        setStored((prev) =>
          qty <= 0
            ? prev.filter((l) => keyOf(l) !== key)
            : prev.map((l) => (keyOf(l) === key ? { ...l, qty: Math.min(99, qty) } : l)),
        ),
      remove: (key) => setStored((prev) => prev.filter((l) => keyOf(l) !== key)),
      clear: () => setStored([]),
    };
  }, [stored, ready]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
