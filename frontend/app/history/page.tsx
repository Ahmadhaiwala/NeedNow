'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { useWishlist } from '@/context/WishlistContext';
import { useOrders } from '@/lib/orders';
import { getUserHistory, UserInteractionRecord } from '@/lib/interactions';
import Navbar from '../navbar/Navbar';
import {
  Clock,
  Eye,
  Heart,
  ShoppingBag,
  Package,
  ArrowRight,
  Sparkles,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

type TabType = 'all' | 'views' | 'wishlist' | 'orders';

export default function HistoryPage() {
  const { user } = useAuth();
  const { items: wishlistItems, toggle: toggleWishlist, isWishlisted } = useWishlist();
  const { orders, loading: ordersLoading, reorder } = useOrders();

  const [interactions, setInteractions] = useState<UserInteractionRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [reorderingId, setReorderingId] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      setLoadingHistory(true);
      getUserHistory()
        .then((records) => setInteractions(records))
        .catch(console.error)
        .finally(() => setLoadingHistory(false));
    }
  }, [user]);

  const viewedProducts = useMemo(() => {
    const map = new Map<string, UserInteractionRecord>();
    for (const record of interactions) {
      if (
        (record.interaction_type === 'view' || record.interaction_type === 'click') &&
        record.product_id
      ) {
        if (!map.has(record.product_id)) {
          map.set(record.product_id, record);
        }
      }
    }
    return Array.from(map.values());
  }, [interactions]);

  const wishlistHistory = useMemo(() => {
    const recordedIds = new Set<string>();
    const list: Array<{
      id: string;
      name: string;
      image?: string | null;
      price?: number | null;
      category?: string | null;
      date?: string;
    }> = [];

    for (const record of interactions) {
      if (record.interaction_type === 'wishlist' && record.product_id) {
        if (!recordedIds.has(record.product_id)) {
          recordedIds.add(record.product_id);
          list.push({
            id: record.product_id,
            name: record.product_name || 'Wishlisted Product',
            image: record.product_image,
            price: record.product_price,
            category: record.product_category,
            date: record.created_at,
          });
        }
      }
    }

    for (const item of wishlistItems) {
      if (!recordedIds.has(item.id)) {
        recordedIds.add(item.id);
        list.push({
          id: item.id,
          name: item.name,
          image: item.image_url,
          price: typeof item.price === 'number' ? item.price : Number(item.price) || null,
          category: item.brand,
          date: new Date().toISOString(),
        });
      }
    }

    return list;
  }, [interactions, wishlistItems]);

  const handleReorder = async (orderId: number) => {
    setReorderingId(orderId);
    try {
      const newOrder = await reorder(orderId);
      alert(`Reordered successfully! New Order #${newOrder.id} created.`);
    } catch (err) {
      console.error(err);
    } finally {
      setReorderingId(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <div 
            className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-card)' }}
          >
            <AlertCircle size={24} style={{ color: 'var(--text-secondary)' }} />
          </div>
          <h1 className="text-xl font-serif font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Sign In Required
          </h1>
          <p className="text-xs text-secondary mb-6">
            Please sign in to view your activity history, wishlist, and past orders.
          </p>
        </div>
      </div>
    );
  }

  const isLoading = loadingHistory || ordersLoading;

  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ background: 'var(--bg-page)' }}>
      <Navbar />

      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(154,101,60,0.12)' }}>
              <Clock size={16} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <h1 className="text-3xl font-serif font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Activity History
            </h1>
          </div>
          <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Track your recently viewed products, saved items, and past orders
          </p>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div
            className="p-4 rounded-2xl flex items-center gap-3"
            style={{
              background: 'var(--surface-2)',
              boxShadow: 'var(--shadow-card)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(90, 123, 142, 0.12)' }}>
              <Eye size={18} style={{ color: 'var(--color-sky)' }} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Products Viewed</p>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{viewedProducts.length}</p>
            </div>
          </div>

          <div
            className="p-4 rounded-2xl flex items-center gap-3"
            style={{
              background: 'var(--surface-2)',
              boxShadow: 'var(--shadow-card)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(185, 74, 62, 0.12)' }}>
              <Heart size={18} style={{ color: 'var(--color-heat)' }} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Wishlisted Items</p>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{wishlistHistory.length}</p>
            </div>
          </div>

          <div
            className="p-4 rounded-2xl flex items-center gap-3"
            style={{
              background: 'var(--surface-2)',
              boxShadow: 'var(--shadow-card)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(78, 112, 85, 0.12)' }}>
              <ShoppingBag size={18} style={{ color: 'var(--color-jade)' }} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Past Orders</p>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{orders.length}</p>
            </div>
          </div>
        </div>

        {/* Tab Filter Pills */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {(
            [
              { id: 'all', label: 'All Activity', icon: Sparkles },
              { id: 'views', label: `Recently Viewed (${viewedProducts.length})`, icon: Eye },
              { id: 'wishlist', label: `Wishlist (${wishlistHistory.length})`, icon: Heart },
              { id: 'orders', label: `Past Orders (${orders.length})`, icon: ShoppingBag },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
              style={{
                background: activeTab === id ? 'var(--accent-primary)' : 'var(--surface-2)',
                color: activeTab === id ? '#FFFDF8' : 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {isLoading ? (
          <div className="py-16 text-center text-xs font-medium text-[var(--text-secondary)]">
            Loading activity history...
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Recently Viewed */}
            {(activeTab === 'all' || activeTab === 'views') && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-serif font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Eye size={18} style={{ color: 'var(--color-sky)' }} /> Recently Viewed
                  </h2>
                </div>

                {viewedProducts.length === 0 ? (
                  <p className="text-xs text-[var(--text-secondary)]">No product view history yet.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {(activeTab === 'all' ? viewedProducts.slice(0, 4) : viewedProducts).map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl flex flex-col justify-between"
                        style={{
                          background: 'var(--surface-2)',
                          border: '1px solid var(--border)',
                          boxShadow: 'var(--shadow-card)',
                        }}
                      >
                        <div className="h-32 rounded-xl mb-3 flex items-center justify-center p-2" style={{ background: 'var(--surface-1)' }}>
                          {item.product_image ? (
                            <img src={item.product_image} alt={item.product_name || ''} className="w-full h-full object-contain" />
                          ) : (
                            <Package size={28} className="opacity-30" />
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--accent-primary)' }}>
                            {item.product_category || 'Product'}
                          </p>
                          <h4 className="text-xs font-semibold line-clamp-2 mt-0.5" style={{ color: 'var(--text-primary)' }}>
                            {item.product_name}
                          </h4>
                          <p className="text-xs font-bold mt-2" style={{ color: 'var(--text-primary)' }}>
                            {item.product_price ? `₹${item.product_price}` : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Saved for Later / Wishlist */}
            {(activeTab === 'all' || activeTab === 'wishlist') && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-serif font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Heart size={18} style={{ color: 'var(--color-heat)' }} /> Saved for Later
                  </h2>
                </div>

                {wishlistHistory.length === 0 ? (
                  <p className="text-xs text-[var(--text-secondary)]">Your wishlist is empty.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {(activeTab === 'all' ? wishlistHistory.slice(0, 4) : wishlistHistory).map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl flex flex-col justify-between"
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-subtle)',
                          boxShadow: 'var(--shadow-card)',
                        }}
                      >
                        <div className="h-32 rounded-xl mb-3 flex items-center justify-center p-2" style={{ background: 'rgba(240, 232, 216, 0.4)' }}>
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                          ) : (
                            <Package size={28} className="opacity-30" />
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--accent-primary)' }}>
                            {item.category || 'Wishlist'}
                          </p>
                          <h4 className="text-xs font-semibold line-clamp-2 mt-0.5" style={{ color: 'var(--text-primary)' }}>
                            {item.name}
                          </h4>
                          <p className="text-xs font-bold mt-2" style={{ color: 'var(--text-primary)' }}>
                            {item.price ? `₹${item.price}` : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Past Orders */}
            {(activeTab === 'all' || activeTab === 'orders') && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-serif font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <ShoppingBag size={18} style={{ color: 'var(--color-jade)' }} /> Past Purchases
                  </h2>
                </div>

                {orders.length === 0 ? (
                  <p className="text-xs text-[var(--text-secondary)]">No past orders found.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {(activeTab === 'all' ? orders.slice(0, 3) : orders).map((order) => (
                      <div
                        key={order.id}
                        className="p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4"
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-subtle)',
                          boxShadow: 'var(--shadow-card)',
                        }}
                      >
                        <div>
                          <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Order #{order.id}</p>
                          <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                            {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>₹{order.total_amount}</span>
                          <button
                            onClick={() => handleReorder(order.id)}
                            disabled={reorderingId === order.id}
                            className="px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer"
                            style={{ background: 'var(--accent-primary)', color: '#FFFDF8' }}
                          >
                            {reorderingId === order.id ? 'Reordering...' : 'Reorder'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
