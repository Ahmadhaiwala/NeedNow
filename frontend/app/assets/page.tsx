'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { getCollections, createCollection, getDashboard } from '@/lib/assets';
import { warmCache } from '@/lib/cache';
import Link from 'next/link';
import { Plus, Home, Package, AlertTriangle, Calendar, ArrowRight } from 'lucide-react';
import Navbar from '../navbar/Navbar';

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
      
      warmCache.collections();
      
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
        <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Loading assets...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col justify-between" style={{ background: 'var(--bg-page)' }}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="text-center max-w-sm">
            <Package size={48} className="mx-auto mb-4 opacity-30 text-[var(--text-secondary)]" />
            <h1 className="text-xl font-serif font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Sign in to manage your assets</h1>
            <p className="mb-6 text-xs" style={{ color: 'var(--text-secondary)' }}>Keep track of everything you own in your home inventory.</p>
            <Link href="/" className="px-6 py-2.5 text-xs font-bold rounded-full inline-block" style={{ background: 'var(--accent-primary)', color: '#FFFDF8' }}>
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ background: 'var(--bg-page)' }}>
      <Navbar />

      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between py-4 mb-6">
          <div>
            <h1 className="text-3xl font-serif font-bold" style={{ color: 'var(--text-primary)' }}>My Assets</h1>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
              Digital inventory of everything you own in your household
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 font-bold text-xs rounded-full transition-all cursor-pointer shadow-sm"
            style={{ background: 'var(--accent-primary)', color: '#FFFDF8' }}
          >
            <Plus size={16} />
            New Collection
          </button>
        </div>

        {/* Create Collection Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div 
              className="p-6 rounded-3xl max-w-md w-full"
              style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-modal)' }}
            >
              <h2 className="text-lg font-serif font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Create New Collection
              </h2>
              
              <form onSubmit={handleCreateCollection} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                    Collection Name
                  </label>
                  <input
                    type="text"
                    value={createData.name}
                    onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                    placeholder="e.g., Home Pantry, Electronics, Office"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border text-xs outline-none"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                    Description (Optional)
                  </label>
                  <textarea
                    value={createData.description}
                    onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
                    placeholder="Brief description of this collection"
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border text-xs resize-none outline-none"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 py-2.5 font-bold text-xs rounded-full cursor-pointer"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-primary)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 font-bold text-xs rounded-full cursor-pointer shadow-sm"
                    style={{ background: 'var(--accent-primary)', color: '#FFFDF8' }}
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
          <div className="text-center py-16 text-xs font-medium text-[var(--text-secondary)]">
            Loading collections...
          </div>
        ) : collections.length === 0 ? (
          <div 
            className="text-center py-16 rounded-3xl"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
          >
            <Home size={48} className="mx-auto mb-4 opacity-30 text-[var(--text-secondary)]" />
            <h2 className="text-lg font-serif font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              No collections yet
            </h2>
            <p className="mb-6 max-w-xs mx-auto text-xs" style={{ color: 'var(--text-secondary)' }}>
              Create your first collection to start tracking your home inventory.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-2.5 font-bold text-xs rounded-full shadow-sm"
              style={{ background: 'var(--accent-primary)', color: '#FFFDF8' }}
            >
              Create Collection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {collections.map((collection) => {
              const stats = dashboardStats[collection.id];
              
              return (
                <Link 
                  href={`/assets/${collection.id}`}
                  key={collection.id}
                  className="group block p-6 rounded-2xl transition-all duration-200 hover:-translate-y-1"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-card)',
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 rounded-xl" style={{ background: 'rgba(154, 101, 60, 0.12)' }}>
                      <Home size={20} style={{ color: 'var(--accent-primary)' }} />
                    </div>
                    <ArrowRight 
                      size={18} 
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: 'var(--accent-primary)' }}
                    />
                  </div>
                  
                  <h3 className="font-bold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
                    {collection.name}
                  </h3>
                  
                  {collection.description && (
                    <p className="text-xs mb-4 opacity-80 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {collection.description}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3 mb-3 p-3 rounded-xl bg-[var(--bg-page)]">
                    <div className="text-center">
                      <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {stats?.total_assets || collection.total_assets}
                      </div>
                      <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                        Total Items
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="font-bold text-sm" style={{ 
                        color: (stats?.low_stock || collection.low_stock_count) > 0 ? 'var(--color-heat)' : 'var(--text-primary)'
                      }}>
                        {stats?.low_stock || collection.low_stock_count}
                      </div>
                      <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                        Low Stock
                      </div>
                    </div>
                  </div>
                  
                  {stats && (
                    <div className="flex items-center gap-4 text-[10px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      {stats.expired > 0 && (
                        <div className="flex items-center gap-1">
                          <AlertTriangle size={11} style={{ color: 'var(--color-heat)' }} />
                          {stats.expired} expired
                        </div>
                      )}
                      {stats.expiring_soon > 0 && (
                        <div className="flex items-center gap-1">
                          <Calendar size={11} style={{ color: 'var(--accent-primary)' }} />
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
      </main>
    </div>
  );
}