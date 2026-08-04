'use client';

/**
 * WishlistContext
 * ---------------
 * Client-side wishlist state (in-memory + localStorage).
 * When a product is added/removed the wish event is queued to the
 * interaction tracker and flushed in the next 30-second batch.
 *
 * Ready to be extended to a backend-persisted wishlist when needed.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
} from 'react';
import { flushInteractions } from '@/lib/interactions';
import { authClient } from '@/lib/auth';

const STORAGE_KEY = 'neednow-wishlist';

// ─── Types ───────────────────────────────────────────────────────────────────
export interface WishlistItem {
  id: string;
  name: string;
  price?: number | string | null;
  image_url?: string;
  brand?: string;
}

interface WishlistState {
  items: WishlistItem[];
}

type Action =
  | { type: 'ADD'; payload: WishlistItem }
  | { type: 'REMOVE'; payload: string }  // payload = product id
  | { type: 'HYDRATE'; payload: WishlistItem[] };

function reducer(state: WishlistState, action: Action): WishlistState {
  switch (action.type) {
    case 'HYDRATE':
      return { items: action.payload };
    case 'ADD':
      if (state.items.some((i) => i.id === action.payload.id)) return state;
      return { items: [...state.items, action.payload] };
    case 'REMOVE':
      return { items: state.items.filter((i) => i.id !== action.payload) };
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────
interface WishlistContextValue {
  items: WishlistItem[];
  isWishlisted: (id: string) => boolean;
  toggle: (item: WishlistItem) => void;
  count: number;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [] });

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: 'HYDRATE', payload: JSON.parse(raw) });
    } catch {}
  }, []);

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {}
  }, [state.items]);

  const isWishlisted = useCallback(
    (id: string) => state.items.some((i) => i.id === id),
    [state.items]
  );

  const toggle = useCallback(
    async (item: WishlistItem) => {
      const adding = !state.items.some((i) => i.id === item.id);

      if (adding) {
        dispatch({ type: 'ADD', payload: item });
      } else {
        dispatch({ type: 'REMOVE', payload: item.id });
      }

      // Track wishlist interaction (best-effort, authenticated users only)
      try {
        const sessionData = await authClient.getSession();
        const token = sessionData?.data?.session?.token;
        if (token) {
          await flushInteractions([
            {
              product_id: item.id,
              interaction_type: 'wishlist',
              value: adding ? 2.5 : -1.0,
              metadata: {
                action: adding ? 'add' : 'remove',
                product_name: item.name,
                timestamp: new Date().toISOString(),
              },
            },
          ]);
        }
      } catch {
        // Never block UI for a tracking failure
      }
    },
    [state.items]
  );

  return (
    <WishlistContext.Provider
      value={{
        items: state.items,
        isWishlisted,
        toggle,
        count: state.items.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used inside WishlistProvider');
  return ctx;
}
