'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { useWishlist } from '@/context/WishlistContext';
import { useOrders } from '@/lib/orders';
import { getUserHistory, UserInteractionRecord } from '@/lib/interactions';
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

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
      <div
        className="animate-spin"
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '3px solid var(--bg-surface-alt)',
          borderTopColor: 'var(--color-juice)',
        }}
      />
    </div>
  );
}

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

  // Extract viewed products from interactions (deduplicated by product_id)
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

  // Wishlist history (combining interaction logs and live context)
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

    // Add items from backend interaction history
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

    // Include items currently in local WishlistContext if not already present
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
      <div style={{ minHeight: '100vh', background: 'var(--bg-page)', paddingTop: '96px' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '48px 24px', textAlign: 'center' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              margin: '0 auto 20px',
              background: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <AlertCircle size={32} style={{ color: 'var(--text-secondary)' }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
            Sign In Required
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
            Please sign in to view your activity history, wishlist, and past orders.
          </p>
        </div>
      </div>
    );
  }

  const isLoading = loadingHistory || ordersLoading;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', paddingTop: '96px', paddingBottom: '60px' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '40px 24px' }}>

        {/* Header Title */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--color-juice)22',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={20} style={{ color: 'var(--color-juice)' }} />
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Activity History
            </h1>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Track your recently viewed products, wishlist items, and past orders
          </p>
        </motion.div>

        {/* Stats Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 14,
            marginBottom: 32,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'var(--color-sky)22',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Eye size={20} style={{ color: 'var(--color-sky)' }} />
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Products Viewed
              </p>
              <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
                {viewedProducts.length}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'var(--color-heat)22',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Heart size={20} style={{ color: 'var(--color-heat)' }} />
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Wishlisted Items
              </p>
              <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
                {wishlistHistory.length}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'var(--color-jade)22',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShoppingBag size={20} style={{ color: 'var(--color-jade)' }} />
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Past Orders
              </p>
              <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
                {orders.length}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 24,
            borderBottom: 'var(--divider-row)',
            paddingBottom: 12,
            overflowX: 'auto',
          }}
        >
          {(
            [
              { id: 'all', label: 'All Activity', icon: Sparkles },
              { id: 'views', label: `Recently Viewed (${viewedProducts.length})`, icon: Eye },
              { id: 'wishlist', label: `Wishlist (${wishlistHistory.length})`, icon: Heart },
              { id: 'orders', label: `Past Orders (${orders.length})`, icon: ShoppingBag },
            ] as const
          ).map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  border: 'none',
                  cursor: 'pointer',
                  background: active ? 'var(--color-juice)' : 'var(--bg-surface)',
                  color: active ? 'var(--color-core)' : 'var(--text-secondary)',
                  boxShadow: active ? 'var(--shadow-button)' : 'var(--shadow-card)',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon size={15} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        {isLoading ? (
          <Spinner />
        ) : (
          <AnimatePresence mode="wait">
            {/* ── RECENTLY VIEWED TAB ── */}
            {(activeTab === 'all' || activeTab === 'views') && (
              <motion.div
                key="views-section"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{ marginBottom: activeTab === 'all' ? 40 : 0 }}
              >
                {activeTab === 'all' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Eye size={18} style={{ color: 'var(--color-sky)' }} /> Recently Viewed Products
                    </h2>
                    {viewedProducts.length > 4 && (
                      <button
                        onClick={() => setActiveTab('views')}
                        style={{ background: 'none', border: 'none', color: 'var(--color-juice)', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        See all ({viewedProducts.length}) <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                )}

                {viewedProducts.length === 0 ? (
                  activeTab === 'views' && (
                    <div style={{ textAlign: 'center', padding: '60px 24px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)' }}>
                      <Eye size={36} style={{ color: 'var(--text-secondary)', marginBottom: 12 }} />
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>No product view history yet</h3>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Browse the marketplace to see your recently viewed products here.</p>
                    </div>
                  )
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                    {(activeTab === 'all' ? viewedProducts.slice(0, 4) : viewedProducts).map((item) => {
                      const wishlisted = isWishlisted(item.product_id || '');
                      return (
                        <motion.div
                          key={item.id}
                          whileHover={{ y: -3, boxShadow: 'var(--shadow-hover)' }}
                          style={{
                            background: 'var(--bg-surface)',
                            borderRadius: 'var(--radius-lg)',
                            padding: 16,
                            boxShadow: 'var(--shadow-card)',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                          }}
                        >
                          {/* Top row: Image & Wishlist Button */}
                          <div style={{ position: 'relative', height: 140, borderRadius: 'var(--radius-md)', background: 'var(--bg-page)', overflow: 'hidden', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {item.product_image ? (
                              <img src={item.product_image} alt={item.product_name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <Package size={32} style={{ color: 'var(--text-secondary)' }} />
                            )}
                            {item.product_id && (
                              <button
                                onClick={() =>
                                  toggleWishlist({
                                    id: item.product_id!,
                                    name: item.product_name || 'Product',
                                    price: item.product_price,
                                    image_url: item.product_image || undefined,
                                  })
                                }
                                style={{
                                  position: 'absolute',
                                  top: 8,
                                  right: 8,
                                  width: 32,
                                  height: 32,
                                  borderRadius: '50%',
                                  background: 'var(--bg-surface)',
                                  border: 'none',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                                }}
                              >
                                <Heart size={16} style={{ color: wishlisted ? 'var(--color-heat)' : 'var(--text-secondary)', fill: wishlisted ? 'var(--color-heat)' : 'none' }} />
                              </button>
                            )}
                          </div>

                          <div>
                            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 2 }}>
                              {item.product_category || item.product_brand || 'Product'}
                            </p>
                            <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: 36 }}>
                              {item.product_name}
                            </h4>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                                {item.product_price ? `₹${item.product_price}` : 'Check details'}
                              </p>
                              {item.product_id && (
                                <a
                                  href={`/product/${item.product_id}`}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: 'var(--color-juice)',
                                    textDecoration: 'none',
                                  }}
                                >
                                  View <ExternalLink size={12} />
                                </a>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── WISHLIST TAB ── */}
            {(activeTab === 'all' || activeTab === 'wishlist') && (
              <motion.div
                key="wishlist-section"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{ marginBottom: activeTab === 'all' ? 40 : 0 }}
              >
                {activeTab === 'all' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Heart size={18} style={{ color: 'var(--color-heat)' }} /> Saved Wishlist Items
                    </h2>
                    {wishlistHistory.length > 4 && (
                      <button
                        onClick={() => setActiveTab('wishlist')}
                        style={{ background: 'none', border: 'none', color: 'var(--color-juice)', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        See all ({wishlistHistory.length}) <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                )}

                {wishlistHistory.length === 0 ? (
                  activeTab === 'wishlist' && (
                    <div style={{ textAlign: 'center', padding: '60px 24px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)' }}>
                      <Heart size={36} style={{ color: 'var(--text-secondary)', marginBottom: 12 }} />
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Your wishlist is empty</h3>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Click the heart icon on any product to save it to your wishlist.</p>
                    </div>
                  )
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                    {(activeTab === 'all' ? wishlistHistory.slice(0, 4) : wishlistHistory).map((item) => (
                      <motion.div
                        key={item.id}
                        whileHover={{ y: -3, boxShadow: 'var(--shadow-hover)' }}
                        style={{
                          background: 'var(--bg-surface)',
                          borderRadius: 'var(--radius-lg)',
                          padding: 16,
                          boxShadow: 'var(--shadow-card)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ position: 'relative', height: 140, borderRadius: 'var(--radius-md)', background: 'var(--bg-page)', overflow: 'hidden', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {item.image ? (
                            <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <Package size={32} style={{ color: 'var(--text-secondary)' }} />
                          )}
                          <button
                            onClick={() =>
                              toggleWishlist({
                                id: item.id,
                                name: item.name,
                                price: item.price,
                                image_url: item.image || undefined,
                              })
                            }
                            style={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: 'var(--bg-surface)',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                            }}
                          >
                            <Heart size={16} style={{ color: 'var(--color-heat)', fill: 'var(--color-heat)' }} />
                          </button>
                        </div>

                        <div>
                          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 2 }}>
                            {item.category || 'Wishlist'}
                          </p>
                          <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: 36 }}>
                            {item.name}
                          </h4>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                              {item.price ? `₹${item.price}` : ''}
                            </p>
                            <a
                              href={`/product/${item.id}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 12,
                                fontWeight: 600,
                                color: 'var(--color-juice)',
                                textDecoration: 'none',
                              }}
                            >
                              View <ExternalLink size={12} />
                            </a>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── PAST ORDERS TAB ── */}
            {(activeTab === 'all' || activeTab === 'orders') && (
              <motion.div
                key="orders-section"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {activeTab === 'all' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ShoppingBag size={18} style={{ color: 'var(--color-jade)' }} /> Past Orders History
                    </h2>
                    {orders.length > 3 && (
                      <button
                        onClick={() => setActiveTab('orders')}
                        style={{ background: 'none', border: 'none', color: 'var(--color-juice)', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        See all ({orders.length}) <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                )}

                {orders.length === 0 ? (
                  activeTab === 'orders' && (
                    <div style={{ textAlign: 'center', padding: '60px 24px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)' }}>
                      <Package size={36} style={{ color: 'var(--text-secondary)', marginBottom: 12 }} />
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>No orders found</h3>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Your order history will appear here once you place orders.</p>
                      <a href="/marketplace" style={{ display: 'inline-flex', padding: '10px 20px', borderRadius: 'var(--radius-full)', background: 'var(--color-juice)', color: 'var(--color-core)', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
                        Browse Marketplace
                      </a>
                    </div>
                  )
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {(activeTab === 'all' ? orders.slice(0, 3) : orders).map((order) => (
                      <motion.div
                        key={order.id}
                        style={{
                          background: 'var(--bg-surface)',
                          borderRadius: 'var(--radius-lg)',
                          padding: 20,
                          boxShadow: 'var(--shadow-card)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <div>
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Order #{order.id}</span>
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 10 }}>
                              {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span
                              style={{
                                padding: '3px 10px',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: 11,
                                fontWeight: 600,
                                background: 'var(--color-jade)22',
                                color: 'var(--color-jade)',
                                textTransform: 'capitalize',
                              }}
                            >
                              {order.status}
                            </span>
                            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>₹{order.total_amount}</span>
                          </div>
                        </div>

                        {/* Order Items Preview */}
                        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6, marginBottom: 12 }}>
                          {order.items.map((item) => (
                            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-page)', padding: '6px 10px', borderRadius: 'var(--radius-md)', flexShrink: 0 }}>
                              {item.product_image ? (
                                <img src={item.product_image} alt={item.product_name} style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover' }} />
                              ) : (
                                <Package size={16} style={{ color: 'var(--text-secondary)' }} />
                              )}
                              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{item.product_name} (x{item.quantity})</span>
                            </div>
                          ))}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleReorder(order.id)}
                            disabled={reorderingId === order.id}
                            style={{
                              padding: '6px 14px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: 12,
                              fontWeight: 600,
                              border: 'none',
                              cursor: 'pointer',
                              background: 'var(--color-juice)',
                              color: 'var(--color-core)',
                            }}
                          >
                            {reorderingId === order.id ? 'Reordering...' : 'Reorder Items'}
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
