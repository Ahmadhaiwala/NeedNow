'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/lib/auth';
import { 
  getCollections, getDashboard, getAssets, getLocationTree, 
  consumeAsset, restockAsset, getShoppingRecommendations 
} from '@/lib/assets';
import { warmCache } from '@/lib/cache';
import Link from 'next/link';
import { 
  ArrowLeft, Plus, Package, AlertTriangle, Calendar, 
  TrendingDown, TrendingUp, MapPin, Search, Filter,
  ShoppingCart, Lightbulb
} from 'lucide-react';
import Image from 'next/image';
import { LoadingSkeleton, LoadingSpinner, LoadingCard, LoadingStats } from '@/components/ui/loading';

interface Collection {
  id: string;
  name: string;
  description: string;
  total_assets: number;
  low_stock_count: number;
}

interface Asset {
  id: string;
  product: {
    id: string;
    name: string;
    image_url: string;
    brand: string;
    price: number;
  };
  location_name: string;
  quantity: number;
  low_stock_threshold: number;
  is_low_stock: boolean;
  is_expired: boolean;
  expiry_date?: string;
  updated_at: string;
}

interface DashboardData {
  stats: {
    total_assets: number;
    low_stock: number;
    expired: number;
    expiring_soon: number;
  };
  locations: Array<{
    id: string;
    name: string;
    asset_count: number;
    low_stock_count: number;
  }>;
  low_stock_items: Asset[];
  expired_items: Asset[];
  expiring_soon_items: Asset[];
  recent_transactions: Array<{
    id: string;
    asset_name: string;
    location_name: string;
    transaction_type: string;
    quantity_changed: number;
    display_change: string;
    created_at: string;
  }>;
}

export default function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, isLoading: authLoading } = useAuth();
  const resolvedParams = use(params);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'assets' | 'recommendations'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    low_stock: false,
    expired: false,
    expiring_soon: false,
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, resolvedParams.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load collection info
      const collections = await getCollections();
      const currentCollection = collections.find((c: Collection) => c.id === resolvedParams.id);
      setCollection(currentCollection);
      
      if (currentCollection) {
        // Warm cache for this collection in the background
        warmCache.collection(resolvedParams.id);
        
        // Load all data in parallel
        const [dashboardData, assetsData, recsData] = await Promise.allSettled([
          getDashboard(resolvedParams.id),
          getAssets({ collection: resolvedParams.id }),
          getShoppingRecommendations(resolvedParams.id)
        ]);
        
        if (dashboardData.status === 'fulfilled') {
          setDashboard(dashboardData.value);
        }
        
        if (assetsData.status === 'fulfilled') {
          setAssets(assetsData.value);
        }
        
        if (recsData.status === 'fulfilled') {
          setRecommendations(recsData.value.recommendations || []);
        }
      }
    } catch (error) {
      console.error('Failed to load collection data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (assetId: string, action: 'consume' | 'restock', quantity: number) => {
    // Find the asset for optimistic update
    const targetAsset = assets.find(a => a.id === assetId);
    if (!targetAsset) return;

    // Optimistic update
    const optimisticAssets = assets.map(asset => {
      if (asset.id === assetId) {
        const newQuantity = action === 'consume' 
          ? Math.max(0, asset.quantity - quantity)
          : asset.quantity + quantity;
        
        return {
          ...asset,
          quantity: newQuantity,
          is_low_stock: newQuantity <= asset.low_stock_threshold
        };
      }
      return asset;
    });
    
    // Update UI immediately
    setAssets(optimisticAssets);

    try {
      if (action === 'consume') {
        await consumeAsset(assetId, { quantity, note: 'Quick consume' });
      } else {
        await restockAsset(assetId, { quantity, note: 'Quick restock' });
      }
      
      // Reload data to get accurate state (cache will be invalidated by the API)
      const [assetsData, dashboardData] = await Promise.allSettled([
        getAssets({ collection: resolvedParams.id }),
        getDashboard(resolvedParams.id)
      ]);
      
      if (assetsData.status === 'fulfilled') {
        setAssets(assetsData.value);
      }
      
      if (dashboardData.status === 'fulfilled') {
        setDashboard(dashboardData.value);
      }
    } catch (error) {
      console.error('Failed to perform action:', error);
      
      // Revert optimistic update on error
      setAssets(assets);
      alert(error instanceof Error ? error.message : 'Action failed');
    }
  };

  const filteredAssets = assets.filter(asset => {
    // Text search
    if (searchQuery && !asset.product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !asset.product.brand.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !asset.location_name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Filters
    if (filters.low_stock && !asset.is_low_stock) return false;
    if (filters.expired && !asset.is_expired) return false;
    if (filters.expiring_soon && asset.is_expired) return false; // TODO: Add expiring soon logic
    
    return true;
  });

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
        <div className="text-center">
          <Package size={64} className="mx-auto mb-6 opacity-30" style={{ color: 'var(--text-secondary)' }} />
          <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Sign in required</h1>
          <Link href="/" className="px-8 py-3 font-semibold rounded-full" style={{ background: 'var(--accent-primary)', color: 'var(--color-core)' }}>
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <div className="animate-pulse" style={{ color: 'var(--text-secondary)' }}>Loading collection...</div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-page)' }}>
        <div className="text-center">
          <Package size={64} className="mx-auto mb-6 opacity-30" style={{ color: 'var(--text-secondary)' }} />
          <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Collection not found</h1>
          <Link href="/assets" className="px-8 py-3 font-semibold rounded-full" style={{ background: 'var(--accent-primary)', color: 'var(--color-core)' }}>
            Back to Assets
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
          <div className="flex items-center gap-4">
            <Link 
              href="/assets"
              className="p-2 rounded-full hover:scale-110 transition-transform"
              style={{ background: 'rgba(123,163,206,0.1)' }}
            >
              <ArrowLeft size={20} style={{ color: 'var(--color-sky)' }} />
            </Link>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {collection.name}
              </h1>
              {collection.description && (
                <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {collection.description}
                </p>
              )}
            </div>
          </div>
          
          <Link
            href={`/assets/${resolvedParams.id}/add`}
            className="flex items-center gap-2 px-6 py-3 font-semibold rounded-full transition-all hover:opacity-90 hover:scale-105"
            style={{ background: 'var(--accent-primary)', color: 'var(--color-core)' }}
          >
            <Plus size={20} />
            Add Item
          </Link>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 mb-8 p-1 rounded-2xl w-fit" style={{ background: 'rgba(123,163,206,0.1)' }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Package },
            { id: 'assets', label: 'All Items', icon: Package },
            { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setView(id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                view === id ? 'shadow-sm' : ''
              }`}
              style={{
                background: view === id ? 'var(--bg-surface)' : 'transparent',
                color: view === id ? 'var(--text-primary)' : 'var(--text-secondary)'
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Dashboard View */}
        {view === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            {loading || !dashboard ? (
              <LoadingStats />
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}>
                  <div className="text-2xl font-bold" style={{ color: 'var(--color-jade)' }}>
                    {dashboard.stats.total_assets}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Items</div>
                </div>
                
                <div className="p-4 rounded-2xl border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}>
                  <div className="text-2xl font-bold" style={{ color: dashboard.stats.low_stock > 0 ? 'var(--color-heat)' : 'var(--text-secondary)' }}>
                    {dashboard.stats.low_stock}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Low Stock</div>
                </div>
                
                <div className="p-4 rounded-2xl border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}>
                  <div className="text-2xl font-bold" style={{ color: dashboard.stats.expired > 0 ? 'var(--color-heat)' : 'var(--text-secondary)' }}>
                    {dashboard.stats.expired}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Expired</div>
                </div>
                
                <div className="p-4 rounded-2xl border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}>
                  <div className="text-2xl font-bold" style={{ color: dashboard.stats.expiring_soon > 0 ? 'var(--color-juice)' : 'var(--text-secondary)' }}>
                    {dashboard.stats.expiring_soon}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Expiring Soon</div>
                </div>
              </div>
            )}

            {/* Low Stock Items */}
            {(dashboard?.low_stock_items?.length ?? 0) > 0 && (
              <div className="p-6 rounded-3xl border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle size={20} style={{ color: 'var(--color-heat)' }} />
                  <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Low Stock Items</h3>
                </div>
                
                <div className="space-y-3">
                  {dashboard?.low_stock_items?.slice(0, 5).map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between p-3 rounded-2xl" style={{ background: 'rgba(239,68,68,0.05)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center" style={{ background: 'rgba(123,163,206,0.1)' }}>
                          {asset.product.image_url ? (
                            <Image src={asset.product.image_url} alt={asset.product.name} width={40} height={40} className="object-contain" />
                          ) : (
                            <Package size={20} style={{ color: 'var(--text-secondary)' }} />
                          )}
                        </div>
                        <div>
                          <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                            {asset.product.name}
                          </div>
                          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {asset.location_name} • {asset.quantity} left
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuickAction(asset.id, 'restock', 5)}
                          className="px-3 py-1 text-sm font-medium rounded-full"
                          style={{ background: 'var(--color-jade)', color: 'white' }}
                        >
                          Restock
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="p-6 rounded-3xl" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-card)' }}>
              <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Activity</h3>
              
              <div className="space-y-3">
                {dashboard?.recent_transactions?.slice(0, 8).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${
                        transaction.transaction_type === 'consume' ? 'bg-red-100' :
                        transaction.transaction_type === 'add' ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        {transaction.transaction_type === 'consume' ? 
                          <TrendingDown size={14} style={{ color: 'var(--color-heat)' }} /> :
                          transaction.transaction_type === 'add' ?
                          <TrendingUp size={14} style={{ color: 'var(--color-jade)' }} /> :
                          <Package size={14} style={{ color: 'var(--color-sky)' }} />
                        }
                      </div>
                      <div>
                        <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                          {transaction.transaction_type === 'consume' ? 'Used' : 
                           transaction.transaction_type === 'add' ? 'Restocked' : 'Adjusted'} {transaction.asset_name}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {transaction.location_name}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        transaction.quantity_changed > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.display_change}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Assets View */}
        {view === 'assets' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border-0"
                  style={{ background: 'rgba(123,163,206,0.1)', color: 'var(--text-primary)' }}
                />
              </div>
              
              <div className="flex gap-2">
                {[
                  { key: 'low_stock', label: 'Low Stock', icon: AlertTriangle },
                  { key: 'expired', label: 'Expired', icon: Calendar },
                  { key: 'expiring_soon', label: 'Expiring', icon: Calendar },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setFilters(prev => ({ ...prev, [key]: !prev[key as keyof typeof filters] }))}
                    className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-medium transition-all ${
                      filters[key as keyof typeof filters] ? 'shadow-sm' : ''
                    }`}
                    style={{
                      background: filters[key as keyof typeof filters] ? 'var(--accent-primary)' : 'rgba(123,163,206,0.1)',
                      color: filters[key as keyof typeof filters] ? 'var(--color-core)' : 'var(--text-secondary)'
                    }}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Assets Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <LoadingCard count={8} />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredAssets.map((asset) => (
                <div key={asset.id} className="p-4 rounded-2xl group" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-card)' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center" style={{ background: 'rgba(123,163,206,0.1)' }}>
                      {asset.product.image_url ? (
                        <Image src={asset.product.image_url} alt={asset.product.name} width={48} height={48} className="object-contain" />
                      ) : (
                        <Package size={24} style={{ color: 'var(--text-secondary)' }} />
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      {asset.is_low_stock && (
                        <AlertTriangle size={16} style={{ color: 'var(--color-heat)' }} />
                      )}
                      {asset.is_expired && (
                        <Calendar size={16} style={{ color: 'var(--color-heat)' }} />
                      )}
                    </div>
                  </div>
                  
                  <h4 className="font-medium mb-1 line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                    {asset.product.name}
                  </h4>
                  
                  <div className="flex items-center gap-1 mb-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <MapPin size={12} />
                    {asset.location_name}
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-lg font-bold" style={{ color: 'var(--color-jade)' }}>
                      {asset.quantity}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      min: {asset.low_stock_threshold}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleQuickAction(asset.id, 'consume', 1)}
                      className="flex-1 py-2 text-sm font-medium rounded-lg"
                      style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-heat)' }}
                    >
                      Use
                    </button>
                    <button
                      onClick={() => handleQuickAction(asset.id, 'restock', 1)}
                      className="flex-1 py-2 text-sm font-medium rounded-lg"
                      style={{ background: 'rgba(2,90,92,0.1)', color: 'var(--color-jade)' }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

        {/* Recommendations View */}
        {view === 'recommendations' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-card)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb size={20} style={{ color: 'var(--color-juice)' }} />
                <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Smart Recommendations</h3>
              </div>
              
              <div className="space-y-3">
                {recommendations.map((rec, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-2xl" style={{ background: 'rgba(123,163,206,0.05)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center" style={{ background: 'rgba(123,163,206,0.1)' }}>
                        {rec.product?.image_url ? (
                          <Image src={rec.product.image_url} alt={rec.product.name} width={48} height={48} className="object-contain" />
                        ) : (
                          <Package size={24} style={{ color: 'var(--text-secondary)' }} />
                        )}
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {rec.product?.name || 'Product'}
                        </div>
                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {rec.suggestion}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {rec.location} • Qty: {rec.recommended_quantity}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      className="flex items-center gap-2 px-4 py-2 font-medium rounded-full"
                      style={{ background: 'var(--accent-primary)', color: 'var(--color-core)' }}
                    >
                      <ShoppingCart size={16} />
                      Add to Cart
                    </button>
                  </div>
                ))}
                
                {recommendations.length === 0 && (
                  <div className="text-center py-8">
                    <Lightbulb size={48} className="mx-auto mb-4 opacity-30" style={{ color: 'var(--text-secondary)' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>No recommendations available yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}