'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { getCollections, createCollection, getDashboard } from '@/lib/assets';
import { warmCache } from '@/lib/cache';
import Link from 'next/link';
import { Plus, Home, Package, AlertTriangle, Calendar, ArrowRight } from 'lucide-react';

interface Collection {
  id: string;
  name: string;
  description: string;
  total_assets: number;
  low_stock_count: number;
  created_at: string;
}

interface DashboardStats {
  total_assets: number;
  low_stock: number;
  expired: number;
  expiring_soon: number;
}

export default function AssetsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [dashboardStats, setDashboardStats] = useState<Record<string, DashboardStats>>({});
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createData, setCreateData] = useState({ name: '', description: '' });

  const loadCollections = async () => {
    try {
      setLoading(true);
      const data = await getCollections();
      setCollections(data);
      
      // Warm cache for collections in the background
      warmCache.collections();
      
      // Load dashboard stats for each collection in parallel
      const statsPromises = data.map(async (collection: Collection) => {
        try {
          const dashboard = await getDashboard(collection.id);
          return { id: collection.id, stats: dashboard?.stats ?? { total_assets: 0, low_stock: 0, expired: 0, expiring_soon: 0 } };
        } catch (error) {
          console.warn(`Failed to load stats for collection ${collection.id}:`, error);
          return { id: collection.id, stats: { total_assets: 0, low_stock: 0, expired: 0, expiring_soon: 0 } };
        }
      });
      
      const statsResults = await Promise.allSettled(statsPromises);
      const stats: Record<string, DashboardStats> = {};
      
      statsResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          stats[result.value.id] = result.value.stats;
        }
      });
      
      setDashboardStats(stats);
    } catch (error) {
      console.error('Failed to load collections:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      // Small settling delay to ensure the auth token has propagated
      // before we call getCollections (which itself has retry logic)
      const t = setTimeout(() => loadCollections(), 100);
      return () => clearTimeout(t);
    }
  }, [user]);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCollection(createData);
      setCreateData({ name: '', description: '' });
      setShowCreateForm(false);
      loadCollections();
    } catch (error) {
      console.error('Failed to create collection:', error);
      alert(error instanceof Error ? error.message : 'Failed to create collection');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <div className="animate-pulse" style={{ color: 'var(--text-secondary)' }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-page)' }}>
        <div className="text-center max-w-sm">
          <Package size={64} className="mx-auto mb-6 opacity-30" style={{ color: 'var(--text-secondary)' }} />
          <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Sign in to manage your assets</h1>
          <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>Keep track of everything you own in your home with intelligent recommendations.</p>
          <Link href="/" className="px-8 py-3 font-semibold rounded-full" style={{ background: 'var(--accent-primary)', color: 'var(--color-core)' }}>
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pb-16" style={{ background: 'var(--bg-page)' }}>
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between py-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>My Assets</h1>
            <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
              Digital inventory of everything you own
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-6 py-3 font-semibold rounded-full transition-all hover:opacity-90 hover:scale-105"
            style={{ background: 'var(--accent-primary)', color: 'var(--color-core)' }}
          >
            <Plus size={20} />
            New Collection
          </button>
        </div>

        {/* Create Collection Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="p-6 rounded-3xl max-w-md w-full mx-4" style={{ background: 'var(--bg-surface)' }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Create New Collection
              </h2>
              
              <form onSubmit={handleCreateCollection}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Collection Name
                  </label>
                  <input
                    type="text"
                    value={createData.name}
                    onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                    placeholder="e.g., Home, Apartment, Office"
                    required
                    className="w-full px-4 py-3 rounded-2xl border-0"
                    style={{ background: 'rgba(123,163,206,0.1)', color: 'var(--text-primary)' }}
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Description (Optional)
                  </label>
                  <textarea
                    value={createData.description}
                    onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
                    placeholder="Brief description of this collection"
                    rows={3}
                    className="w-full px-4 py-3 rounded-2xl border-0 resize-none"
                    style={{ background: 'rgba(123,163,206,0.1)', color: 'var(--text-primary)' }}
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 py-3 font-semibold rounded-full"
                    style={{ background: 'rgba(0,0,0,0.1)', color: 'var(--text-secondary)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 font-semibold rounded-full"
                    style={{ background: 'var(--accent-primary)', color: 'var(--color-core)' }}
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Collections Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-pulse" style={{ color: 'var(--text-secondary)' }}>Loading collections...</div>
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-12">
            <Home size={64} className="mx-auto mb-6 opacity-30" style={{ color: 'var(--text-secondary)' }} />
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              No collections yet
            </h2>
            <p className="mb-6 max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Create your first collection to start tracking your home inventory.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 font-semibold rounded-full"
              style={{ background: 'var(--accent-primary)', color: 'var(--color-core)' }}
            >
              Create Collection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => {
              const stats = dashboardStats[collection.id];
              
              return (
                <Link 
                  href={`/assets/${collection.id}`}
                  key={collection.id}
                  className="group block p-6 rounded-3xl transition-all hover:scale-105 duration-300"
                  style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-card)' }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-2xl" style={{ background: 'rgba(123,163,206,0.1)' }}>
                      <Home size={24} style={{ color: 'var(--color-sky)' }} />
                    </div>
                    <ArrowRight 
                      size={20} 
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: 'var(--text-secondary)' }}
                    />
                  </div>
                  
                  <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
                    {collection.name}
                  </h3>
                  
                  {collection.description && (
                    <p className="text-sm mb-4 opacity-75" style={{ color: 'var(--text-secondary)' }}>
                      {collection.description}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="font-bold text-lg" style={{ color: 'var(--color-jade)' }}>
                        {stats?.total_assets || collection.total_assets}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Total Items
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="font-bold text-lg" style={{ 
                        color: (stats?.low_stock || collection.low_stock_count) > 0 ? 'var(--color-heat)' : 'var(--text-secondary)'
                      }}>
                        {stats?.low_stock || collection.low_stock_count}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Low Stock
                      </div>
                    </div>
                  </div>
                  
                  {stats && (
                    <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {stats.expired > 0 && (
                        <div className="flex items-center gap-1">
                          <AlertTriangle size={12} style={{ color: 'var(--color-heat)' }} />
                          {stats.expired} expired
                        </div>
                      )}
                      {stats.expiring_soon > 0 && (
                        <div className="flex items-center gap-1">
                          <Calendar size={12} style={{ color: 'var(--color-juice)' }} />
                          {stats.expiring_soon} expiring
                        </div>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}