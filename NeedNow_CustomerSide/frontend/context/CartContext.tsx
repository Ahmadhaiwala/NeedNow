'use client';

import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { getCart, addToCart, updateCartItem, removeCartItem, clearCart, proceedToCheckout } from '@/lib/cart';
import { useAuth } from '@/lib/auth';

// ─── Types ──────────────────────────────────────────────────────────────────
export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  image_url: string;
  brand: string;
  in_stock: boolean;
}

export interface CartItem {
  id: number;
  product: CartProduct;
  quantity: number;
  line_total: number | null;
  added_at: string;
}

export interface CartState {
  items: CartItem[];
  total: number;
  item_count: number;
  loading: boolean;
  error: string | null;
}

// ─── Actions ─────────────────────────────────────────────────────────────────
type Action =
  | { type: 'SET_CART'; payload: { items: CartItem[]; total: number; item_count: number } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR' };

function cartReducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case 'SET_CART':
      return { ...state, ...action.payload, loading: false, error: null };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR':
      return { ...state, items: [], total: 0, item_count: 0, loading: false };
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────
interface CartContextValue {
  state: CartState;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearItems: () => Promise<void>;
  refreshCart: () => Promise<void>;
  checkout: (platform?: string) => Promise<any>;
}

const CartContext = createContext<CartContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────
export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    total: 0,
    item_count: 0,
    loading: false,
    error: null,
  });

  const refreshCart = useCallback(async () => {
    if (!user) {
      dispatch({ type: 'CLEAR' });
      return;
    }
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const data = await getCart();
      dispatch({ type: 'SET_CART', payload: data });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load cart' });
    }
  }, [user]);

  // Load cart whenever user changes (login/logout)
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addItem = useCallback(async (productId: string, quantity = 1) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const data = await addToCart(productId, quantity);
      dispatch({ type: 'SET_CART', payload: data });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to add item';
      dispatch({ type: 'SET_ERROR', payload: msg });
      throw e;
    }
  }, []);

  const updateItem = useCallback(async (itemId: number, quantity: number) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const data = await updateCartItem(itemId, quantity);
      dispatch({ type: 'SET_CART', payload: data });
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update item' });
    }
  }, []);

  const removeItem = useCallback(async (itemId: number) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const data = await removeCartItem(itemId);
      dispatch({ type: 'SET_CART', payload: data });
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to remove item' });
    }
  }, []);

  const clearItems = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const data = await clearCart();
      dispatch({ type: 'SET_CART', payload: data });
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to clear cart' });
    }
  }, []);

  const checkout = useCallback(async (platform = 'neednow') => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const result = await proceedToCheckout(platform);
      // Clear cart after successful checkout
      dispatch({ type: 'CLEAR' });
      return result;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to proceed to checkout';
      dispatch({ type: 'SET_ERROR', payload: msg });
      throw e;
    }
  }, []);

  return (
    <CartContext.Provider value={{ state, addItem, updateItem, removeItem, clearItems, refreshCart, checkout }}>
      {children}
    </CartContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
