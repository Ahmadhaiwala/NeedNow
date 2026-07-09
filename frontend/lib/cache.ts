'use client';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class FrontendCache {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
    });

    // Clean up expired items periodically
    if (this.cache.size > 100) {
      this.cleanup();
    }
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Delete keys matching a pattern
  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern.replace('*', '.*'));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache stats for debugging
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Create global cache instance
export const frontendCache = new FrontendCache();

// Cache wrapper for API calls with enhanced metrics
export async function cachedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Check cache first
  const cached = frontendCache.get<T>(key);
  if (cached) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log(`🟢 CACHE HIT: ${key}`);
    }
    return cached;
  }

  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log(`🔴 CACHE MISS: ${key}`);
  }
  
  // Fetch data and cache it
  try {
    const data = await fetchFn();
    frontendCache.set(key, data, ttl);
    return data;
  } catch (error) {
    // Don't cache errors
    throw error;
  }
}

// Cache invalidation helpers
export const cacheKeys = {
  collections: (userId: string) => `collections_${userId}`,
  collection: (collectionId: string) => `collection_${collectionId}`,
  assets: (collectionId: string, filters?: string) => 
    `assets_${collectionId}${filters ? `_${filters}` : ''}`,
  dashboard: (collectionId: string) => `dashboard_${collectionId}`,
  recommendations: (collectionId: string) => `recommendations_${collectionId}`,
  locations: (collectionId: string) => `locations_${collectionId}`,
  transactions: (collectionId: string, filters?: string) => 
    `transactions_${collectionId}${filters ? `_${filters}` : ''}`,
};

// Invalidate related cache keys when data changes
export const invalidateCache = {
  collection: (collectionId: string, userId: string) => {
    frontendCache.delete(cacheKeys.collections(userId));
    frontendCache.delete(cacheKeys.collection(collectionId));
    frontendCache.delete(cacheKeys.dashboard(collectionId));
    frontendCache.deletePattern(`assets_${collectionId}_*`);
    frontendCache.deletePattern(`transactions_${collectionId}_*`);
  },
  
  asset: (collectionId: string, userId: string) => {
    frontendCache.delete(cacheKeys.dashboard(collectionId));
    frontendCache.delete(cacheKeys.recommendations(collectionId));
    frontendCache.deletePattern(`assets_${collectionId}_*`);
    frontendCache.deletePattern(`transactions_${collectionId}_*`);
    // Update collections cache as it contains asset counts
    frontendCache.delete(cacheKeys.collections(userId));
  },

  dashboard: (collectionId: string) => {
    frontendCache.delete(cacheKeys.dashboard(collectionId));
  },

  all: () => {
    frontendCache.clear();
  }
};

// TTL constants (in milliseconds)
export const cacheTTL = {
  collections: 10 * 60 * 1000,    // 10 minutes - relatively static
  assets: 5 * 60 * 1000,          // 5 minutes - can change frequently
  dashboard: 3 * 60 * 1000,       // 3 minutes - aggregated data changes often
  recommendations: 15 * 60 * 1000, // 15 minutes - AI recommendations are expensive
  locations: 30 * 60 * 1000,      // 30 minutes - very static
  transactions: 2 * 60 * 1000,    // 2 minutes - recent activity
};

// Cache warming - preload commonly accessed data
export const warmCache = {
  // Warm dashboard and assets for a collection
  collection: async (collectionId: string) => {
    try {
      // Warm in parallel
      await Promise.allSettled([
        getDashboard(collectionId),
        getAssets({ collection: collectionId }),
        getShoppingRecommendations(collectionId, 10)
      ]);
    } catch (error) {
      console.warn('Cache warming failed:', error);
    }
  },

  // Warm collections on app load
  collections: async () => {
    try {
      const collections = await getCollections();
      // Warm the most recently used collection
      if (collections.length > 0) {
        const firstCollection = collections[0];
        await warmCache.collection(firstCollection.id);
      }
    } catch (error) {
      console.warn('Collections cache warming failed:', error);
    }
  }
};

// Performance monitoring
export const cacheMetrics = {
  hits: 0,
  misses: 0,
  
  recordHit: () => cacheMetrics.hits++,
  recordMiss: () => cacheMetrics.misses++,
  
  getHitRatio: () => {
    const total = cacheMetrics.hits + cacheMetrics.misses;
    return total > 0 ? (cacheMetrics.hits / total * 100).toFixed(2) : '0';
  },
  
  reset: () => {
    cacheMetrics.hits = 0;
    cacheMetrics.misses = 0;
  }
};

// Enhanced cached fetch with metrics
export async function cachedFetchWithMetrics<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Check cache first
  const cached = frontendCache.get<T>(key);
  if (cached) {
    cacheMetrics.recordHit();
    return cached;
  }

  cacheMetrics.recordMiss();
  
  // Fetch data and cache it
  try {
    const data = await fetchFn();
    frontendCache.set(key, data, ttl);
    return data;
  } catch (error) {
    // Don't cache errors
    throw error;
  }
}