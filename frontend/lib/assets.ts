'use client';

import { cachedFetch, cacheKeys, invalidateCache, cacheTTL, frontendCache } from './cache';

const API_BASE = 'http://localhost:8000/api/assets';

/**
 * Fetch the session token, retrying briefly to handle the race between
 * useAuth() reporting a user and the session propagating to authClient.
 */
async function getToken(retries = 3, delayMs = 300): Promise<string | null> {
  const { authClient } = await import('./auth');
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const session = await authClient.getSession();
      const token = session?.data?.session?.token ?? null;
      if (token) return token;
    } catch {
      // ignore and retry
    }
    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, delayMs * Math.pow(2, attempt)));
    }
  }
  return null;
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

// Asset Collections
export async function getCollections() {
  const { authClient } = await import('./auth');

  // Retry to handle the race between useAuth reporting a user and
  // the session being available via authClient.getSession().
  let userId: string | null = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    const session = await authClient.getSession();
    userId = session?.data?.session?.user?.id ?? null;
    if (userId) break;
    if (attempt < 3) await new Promise((r) => setTimeout(r, 300 * Math.pow(2, attempt)));
  }

  if (!userId) {
    // Return empty array rather than throwing — the page already guards on !user
    return [];
  }

  return cachedFetch(
    cacheKeys.collections(userId),
    async () => {
      const res = await authFetch('/collections/');
      if (!res.ok) throw new Error('Failed to fetch collections');
      return res.json();
    },
    cacheTTL.collections
  );
}

export async function createCollection(data: {
  name: string;
  description?: string;
}) {
  const res = await authFetch('/collections/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create collection');
  }
  
  const result = await res.json();
  
  // Invalidate collections cache
  const { authClient } = await import('./auth');
  const session = await authClient.getSession();
  const userId = session?.data?.session?.user?.id;
  if (userId) {
    invalidateCache.collection('', userId);
  }
  
  return result;
}

export async function updateCollection(id: string, data: {
  name?: string;
  description?: string;
}) {
  const res = await authFetch(`/collections/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update collection');
  return res.json();
}

export async function deleteCollection(id: string) {
  const res = await authFetch(`/collections/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete collection');
}

export async function addDefaultLocations(collectionId: string) {
  const res = await authFetch(`/collections/${collectionId}/add_default_locations/`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to add default locations');
  return res.json();
}

// Asset Locations
export async function getLocations(collectionId?: string) {
  const token = await getToken();
  if (!token) return [];

  const { authClient } = await import('./auth');
  const session = await authClient.getSession();
  const userId = session?.data?.session?.user?.id ?? '';

  const params = new URLSearchParams();
  if (collectionId) params.append('collection', collectionId);

  return cachedFetch(
    cacheKeys.locations(collectionId || ''),
    async () => {
      const res = await authFetch(`/locations/?${params}`);
      if (!res.ok) throw new Error('Failed to fetch locations');
      return res.json();
    },
    cacheTTL.locations
  );
}

export async function getLocationTree(collectionId: string) {
  const token = await getToken();
  if (!token) return null;

  return cachedFetch(
    `locationTree_${collectionId}`,
    async () => {
      const res = await authFetch(`/locations/tree/?collection=${collectionId}`);
      if (!res.ok) throw new Error('Failed to fetch location tree');
      return res.json();
    },
    cacheTTL.locations
  );
}

export async function createLocation(data: {
  collection: string;
  parent?: string;
  name: string;
  description?: string;
}) {
  const res = await authFetch('/locations/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create location');
  }
  return res.json();
}

export async function updateLocation(id: string, data: {
  parent?: string;
  name?: string;
  description?: string;
}) {
  const res = await authFetch(`/locations/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update location');
  return res.json();
}

export async function deleteLocation(id: string) {
  const res = await authFetch(`/locations/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete location');
}

// Assets
export async function getAssets(filters: {
  collection?: string;
  location?: string;
  search?: string;
  low_stock?: boolean;
  expired?: boolean;
  expiring_soon?: boolean;
} = {}) {
  const token = await getToken();
  if (!token) return [];

  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.append(key, value.toString());
    }
  });

  const filterString = params.toString();
  const cacheKey = cacheKeys.assets(filters.collection || '', filterString);

  return cachedFetch(
    cacheKey,
    async () => {
      const res = await authFetch(`/assets/?${params}`);
      if (!res.ok) throw new Error('Failed to fetch assets');
      return res.json();
    },
    cacheTTL.assets
  );
}

export async function getAsset(id: string) {
  const token = await getToken();
  if (!token) return null;

  return cachedFetch(
    `asset_${id}`,
    async () => {
      const res = await authFetch(`/assets/${id}/`);
      if (!res.ok) throw new Error('Failed to fetch asset');
      return res.json();
    },
    cacheTTL.assets
  );
}

export async function createAsset(data: {
  collection: string;
  product_id: string;
  location: string;
  quantity: number;
  low_stock_threshold?: number;
  purchase_date?: string;
  expiry_date?: string;
  notes?: string;
}) {
  const res = await authFetch('/assets/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create asset');
  }
  
  const result = await res.json();
  
  // Invalidate related caches
  const { authClient } = await import('./auth');
  const session = await authClient.getSession();
  const userId = session?.data?.session?.user?.id;
  if (userId) {
    invalidateCache.asset(data.collection, userId);
  }
  
  return result;
}

export async function updateAsset(id: string, data: {
  location?: string;
  quantity?: number;
  low_stock_threshold?: number;
  purchase_date?: string;
  expiry_date?: string;
  notes?: string;
}) {
  const res = await authFetch(`/assets/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update asset');
  
  const result = await res.json();
  
  // Invalidate related caches
  const { authClient } = await import('./auth');
  const session = await authClient.getSession();
  const userId = session?.data?.session?.user?.id;
  if (userId) {
    // Use the result data to find collection ID
    const collectionId = result.collection || result.collection?.id;
    if (collectionId) {
      invalidateCache.asset(collectionId, userId);
      frontendCache.delete(`asset_${id}`);
    }
  }
  
  return result;
}

export async function deleteAsset(id: string) {
  const res = await authFetch(`/assets/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete asset');
  
  // Invalidate related caches
  const { authClient } = await import('./auth');
  const session = await authClient.getSession();
  const userId = session?.data?.session?.user?.id;
  if (userId) {
    // We can't get the collection ID after deletion, so invalidate all caches
    invalidateCache.all();
  }
}

// Asset Actions
export async function consumeAsset(id: string, data: {
  quantity: number;
  note?: string;
}) {
  const res = await authFetch(`/assets/${id}/consume/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to consume asset');
  }
  
  const result = await res.json();
  
  // Invalidate related caches
  const { authClient } = await import('./auth');
  const session = await authClient.getSession();
  const userId = session?.data?.session?.user?.id;
  if (userId) {
    // Get asset data to invalidate related caches
    try {
      const assetData = await getAsset(id);
      const collectionId = assetData.collection?.id || assetData.collection;
      invalidateCache.asset(collectionId, userId);
      frontendCache.delete(`asset_${id}`);
    } catch (error) {
      // Fallback - clear all caches if we can't get asset info
      console.warn('Failed to get asset for cache invalidation:', error);
      invalidateCache.all();
    }
  }
  
  return result;
}

export async function restockAsset(id: string, data: {
  quantity: number;
  note?: string;
}) {
  const res = await authFetch(`/assets/${id}/restock/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to restock asset');
  }
  
  const result = await res.json();
  
  // Invalidate related caches
  const { authClient } = await import('./auth');
  const session = await authClient.getSession();
  const userId = session?.data?.session?.user?.id;
  if (userId) {
    try {
      const assetData = await getAsset(id);
      const collectionId = assetData.collection?.id || assetData.collection;
      invalidateCache.asset(collectionId, userId);
      frontendCache.delete(`asset_${id}`);
    } catch (error) {
      console.warn('Failed to get asset for cache invalidation:', error);
      invalidateCache.all();
    }
  }
  
  return result;
}

export async function adjustAsset(id: string, data: {
  quantity: number;
  note?: string;
}) {
  const res = await authFetch(`/assets/${id}/adjust/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to adjust asset');
  }
  
  const result = await res.json();
  
  // Invalidate related caches
  const { authClient } = await import('./auth');
  const session = await authClient.getSession();
  const userId = session?.data?.session?.user?.id;
  if (userId) {
    try {
      const assetData = await getAsset(id);
      const collectionId = assetData.collection?.id || assetData.collection;
      invalidateCache.asset(collectionId, userId);
      frontendCache.delete(`asset_${id}`);
    } catch (error) {
      console.warn('Failed to get asset for cache invalidation:', error);
      invalidateCache.all();
    }
  }
  
  return result;
}

export async function moveAsset(id: string, data: {
  location: string;
  note?: string;
}) {
  const res = await authFetch(`/assets/${id}/move/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to move asset');
  }
  
  const result = await res.json();
  
  // Invalidate related caches
  const { authClient } = await import('./auth');
  const session = await authClient.getSession();
  const userId = session?.data?.session?.user?.id;
  if (userId) {
    try {
      const assetData = await getAsset(id);
      const collectionId = assetData.collection?.id || assetData.collection;
      invalidateCache.asset(collectionId, userId);
      frontendCache.delete(`asset_${id}`);
    } catch (error) {
      console.warn('Failed to get asset for cache invalidation:', error);
      invalidateCache.all();
    }
  }
  
  return result;
}

export async function bulkConsume(data: {
  collection_id: string;
  items: Array<{
    asset_id: string;
    quantity: number;
    note?: string;
  }>;
}) {
  const res = await authFetch('/assets/bulk_consume/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to bulk consume');
  }
  
  const result = await res.json();
  
  // Invalidate related caches
  const { authClient } = await import('./auth');
  const session = await authClient.getSession();
  const userId = session?.data?.session?.user?.id;
  if (userId) {
    invalidateCache.asset(data.collection_id, userId);
  }
  
  return result;
}

// Transactions
export async function getTransactions(filters: {
  asset?: string;
  collection?: string;
  type?: string;
} = {}) {
  const token = await getToken();
  if (!token) return [];

  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.append(key, value);
    }
  });

  const filterString = params.toString();
  const cacheKey = cacheKeys.transactions(filters.collection || '', filterString);

  return cachedFetch(
    cacheKey,
    async () => {
      const res = await authFetch(`/transactions/?${params}`);
      if (!res.ok) throw new Error('Failed to fetch transactions');
      return res.json();
    },
    cacheTTL.transactions
  );
}

// Dashboard & Analytics
export async function getDashboard(collectionId: string) {
  const token = await getToken();
  if (!token) return null;

  return cachedFetch(
    cacheKeys.dashboard(collectionId),
    async () => {
      const res = await authFetch(`/dashboard/?collection=${collectionId}`);
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      return res.json();
    },
    cacheTTL.dashboard
  );
}

export async function getShoppingRecommendations(collectionId: string, limit = 20) {
  const token = await getToken();
  if (!token) return [];

  return cachedFetch(
    cacheKeys.recommendations(collectionId),
    async () => {
      const res = await authFetch(`/recommendations/?collection=${collectionId}&limit=${limit}`);
      if (!res.ok) throw new Error('Failed to fetch recommendations');
      return res.json();
    },
    cacheTTL.recommendations
  );
}

export async function getAnalytics(collectionId: string, days = 30) {
  const res = await authFetch(`/analytics/?collection=${collectionId}&days=${days}`);
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}