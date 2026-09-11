'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { allProducts } from '@/lib/catalogue';
import type { Product } from '@/types';

const STORAGE_KEY = 'cart.v1';

/** Only the id + qty are persisted; prices are always re-read from the
 *  catalogue so a stale localStorage can never show an outdated price. */
type StoredLine = { id: string; qty: number };
export type CartLine = { product: Product; qty: number };

interface CartApi {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (product: Product, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  /** False during the first render so SSR HTML and client HTML match. */
  ready: boolean;
}

const CartContext = createContext<CartApi | null>(null);

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
              .map((l) => ({ id: l.id, qty: Math.max(1, Math.min(99, Math.floor(l.qty))) })),
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
        return product ? { product, qty: l.qty } : null;
      })
      .filter((l): l is CartLine => l !== null);

    return {
      lines,
      ready,
      count: lines.reduce((n, l) => n + l.qty, 0),
      subtotal: lines.reduce((n, l) => n + l.product.price * l.qty, 0),
      add: (product, qty = 1) =>
        setStored((prev) => {
          const found = prev.find((l) => l.id === product.id);
          if (found) {
            return prev.map((l) =>
              l.id === product.id ? { ...l, qty: Math.min(99, l.qty + qty) } : l,
            );
          }
          return [...prev, { id: product.id, qty }];
        }),
      setQty: (id, qty) =>
        setStored((prev) =>
          qty <= 0
            ? prev.filter((l) => l.id !== id)
            : prev.map((l) => (l.id === id ? { ...l, qty: Math.min(99, qty) } : l)),
        ),
      remove: (id) => setStored((prev) => prev.filter((l) => l.id !== id)),
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
