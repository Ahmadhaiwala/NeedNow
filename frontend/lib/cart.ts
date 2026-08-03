'use client';

const API_BASE = 'http://localhost:8000/api/cart';

async function getToken(): Promise<string | null> {
  // Import dynamically to avoid SSR issues
  try {
    const { authClient } = await import('./auth');
    const session = await authClient.getSession();
    return session?.data?.session?.token ?? null;
  } catch {
    return null;
  }
}

async function authFetch(path: string, options: RequestInit = {}) {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

export async function getCart() {
  const res = await authFetch('/');
  if (!res.ok) throw new Error('Failed to fetch cart');
  return res.json();
}

export async function addToCart(productId: string, quantity = 1) {
  const res = await authFetch('/items/', {
    method: 'POST',
    body: JSON.stringify({ product_id: productId, quantity }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to add to cart');
  }
  return res.json();
}

export async function updateCartItem(itemId: number, quantity: number) {
  const res = await authFetch(`/items/${itemId}/`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
  });
  if (!res.ok) throw new Error('Failed to update cart item');
  return res.json();
}

export async function removeCartItem(itemId: number) {
  const res = await authFetch(`/items/${itemId}/`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to remove cart item');
  return res.json();
}

export async function clearCart() {
  const res = await authFetch('/clear/', { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to clear cart');
  return res.json();
}

export async function proceedToCheckout(platform = 'neednow') {
  const res = await authFetch('/checkout/', {
    method: 'POST',
    body: JSON.stringify({ platform }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to proceed to checkout');
  }
  return res.json();
}
