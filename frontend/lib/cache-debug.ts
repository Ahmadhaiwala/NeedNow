'use client';

import { frontendCache, cacheMetrics } from './cache';

// Debug utilities for cache performance
export const debugCache = {
  // Log cache performance stats
  logStats: () => {
    const stats = frontendCache.getStats();
    const hitRatio = cacheMetrics.getHitRatio();
    
    console.group('🚀 Frontend Cache Statistics');
    console.log(`📊 Cache Size: ${stats.size} items`);
    console.log(`🎯 Hit Ratio: ${hitRatio}%`);
    console.log(`✅ Cache Hits: ${cacheMetrics.hits}`);
    console.log(`❌ Cache Misses: ${cacheMetrics.misses}`);
    console.log(`🗝️ Cached Keys:`, stats.keys);
    console.groupEnd();
    
    return { stats, hitRatio, hits: cacheMetrics.hits, misses: cacheMetrics.misses };
  },

  // Monitor API calls
  monitorApiCall: (endpoint: string, cached: boolean, duration?: number) => {
    const icon = cached ? '🟢' : '🔴';
    const source = cached ? 'CACHE' : 'API';
    const time = duration ? ` (${duration}ms)` : '';
    
    console.log(`${icon} ${source}: ${endpoint}${time}`);
  },

  // Clear all cache data
  clearAll: () => {
    frontendCache.clear();
    cacheMetrics.reset();
    console.log('🧹 Cache cleared and metrics reset');
  },

  // Simulate cache warming for testing
  warmTestData: () => {
    const testData = {
      collections: [{ id: 'test-1', name: 'Test Collection' }],
      dashboard: { stats: { total_assets: 42 } },
      assets: [{ id: 'asset-1', name: 'Test Asset' }]
    };

    frontendCache.set('collections_test-user', testData.collections, 60000);
    frontendCache.set('dashboard_test-collection', testData.dashboard, 60000);
    frontendCache.set('assets_test-collection', testData.assets, 60000);
    
    console.log('🔥 Test cache data warmed');
    return testData;
  }
};

// Expose cache debug to window for browser console access
if (typeof window !== 'undefined') {
  (window as any).cacheDebug = debugCache;
  console.log('💡 Cache debugging available via window.cacheDebug');
}