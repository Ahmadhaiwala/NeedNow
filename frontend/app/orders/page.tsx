'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { useOrders, OrderSummary } from '@/lib/orders';
import Navbar from '../navbar/Navbar';
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  RotateCcw,
  AlertCircle,
  IndianRupee,
  ShoppingBag,
  Eye,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

const statusIcons = {
  pending: Clock,
  placed: Package,
  confirmed: CheckCircle,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
  refunded: RotateCcw,
};

export default function OrdersPage() {
  const { user } = useAuth();
  const { orders, cancelOrder, reorder, getOrderSummary } = useOrders();
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    if (user) {
      getOrderSummary().then(setSummary).catch(console.error);
    }
  }, [user]);

  const filteredOrders = useMemo(() => {
    if (selectedStatusFilter === 'all') return orders;
    if (selectedStatusFilter === 'pending') return orders.filter(o => ['pending', 'placed', 'processing'].includes(o.status));
    if (selectedStatusFilter === 'completed') return orders.filter(o => ['delivered', 'confirmed'].includes(o.status));
    if (selectedStatusFilter === 'cancelled') return orders.filter(o => ['cancelled', 'refunded'].includes(o.status));
    return orders;
  }, [orders, selectedStatusFilter]);

  const handleCancelOrder = async (orderId: number) => {
    setActionLoading(orderId);
    try { await cancelOrder(orderId); }
    catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const handleReorder = async (orderId: number) => {
    setActionLoading(orderId);
    try {
      const newOrder = await reorder(orderId);
      alert(`Order #${orderId} items added again. New order created — #${newOrder.id}`);
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
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
          <h1 className="text-xl font-serif font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Sign In Required</h1>
          <p className="text-xs text-secondary mb-6">Please sign in to view and track your orders.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ background: 'var(--bg-page)' }}>
      <Navbar />

      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-serif font-bold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
            My Orders
          </h1>
          <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Track and manage all your orders
          </p>
        </motion.div>

        {/* 4 Compact Stat Metrics matching Inspiration reference image */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div
            className="p-4 rounded-2xl flex items-center gap-3"
            style={{
              background: 'var(--bg-surface)',
              boxShadow: 'var(--shadow-card)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(90, 123, 142, 0.12)' }}>
              <ShoppingBag size={18} style={{ color: 'var(--color-sky)' }} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Total Orders</p>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{summary?.total_orders ?? orders.length}</p>
            </div>
          </div>

          <div
            className="p-4 rounded-2xl flex items-center gap-3"
            style={{
              background: 'var(--bg-surface)',
              boxShadow: 'var(--shadow-card)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(154, 101, 60, 0.12)' }}>
              <Clock size={18} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Pending</p>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{summary?.pending_orders ?? 0}</p>
            </div>
          </div>

          <div
            className="p-4 rounded-2xl flex items-center gap-3"
            style={{
              background: 'var(--bg-surface)',
              boxShadow: 'var(--shadow-card)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(78, 112, 85, 0.12)' }}>
              <CheckCircle size={18} style={{ color: 'var(--color-jade)' }} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Completed</p>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{summary?.completed_orders ?? 0}</p>
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
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(217, 186, 131, 0.2)' }}>
              <IndianRupee size={18} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Total Spent</p>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>₹{summary?.total_spent ?? '0'}</p>
            </div>
          </div>
        </div>

        {/* Filter Status Chips */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {(['all', 'pending', 'completed', 'cancelled'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedStatusFilter(filter)}
              className="px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all cursor-pointer"
              style={{
                background: selectedStatusFilter === filter ? 'var(--accent-primary)' : 'var(--surface-2)',
                color: selectedStatusFilter === filter ? '#FFFDF8' : 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="flex flex-col gap-5">
          {filteredOrders.length === 0 ? (
            <div 
              className="p-12 text-center rounded-3xl"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
            >
              <Package size={36} className="mx-auto mb-3 opacity-30 text-[var(--text-secondary)]" />
              <h3 className="font-serif font-bold text-base mb-1" style={{ color: 'var(--text-primary)' }}>No orders found</h3>
              <p className="text-xs text-secondary mb-6">Looks like you haven't placed any orders matching this status.</p>
              <Link href="/">
                <button 
                  className="px-6 py-2.5 rounded-full font-bold text-xs cursor-pointer shadow-sm"
                  style={{ background: 'var(--accent-primary)', color: '#FFFDF8' }}
                >
                  Browse Products
                </button>
              </Link>
            </div>
          ) : (
            filteredOrders.map((order, i) => {
              const StatusIcon = statusIcons[order.status as keyof typeof statusIcons] || Package;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-2xl p-6 shadow-card flex flex-col gap-5"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {/* Order Top Header Row */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(154, 101, 60, 0.12)' }}>
                        <StatusIcon size={16} style={{ color: 'var(--accent-primary)' }} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                          Order #{order.id}
                        </h3>
                        <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                          {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • {order.items.length} item{order.items.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span 
                        className="px-3 py-1 rounded-full text-xs font-bold capitalize"
                        style={{
                          background: order.status === 'delivered' ? 'rgba(78, 112, 85, 0.12)' : 'rgba(154, 101, 60, 0.12)',
                          color: order.status === 'delivered' ? 'var(--color-jade)' : 'var(--accent-primary)',
                        }}
                      >
                        {order.status}
                      </span>
                      <span className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                        ₹{order.total_amount}
                      </span>
                    </div>
                  </div>

                  {/* Order Status Timeline matching Inspiration requirements */}
                  <div className="px-2 py-1">
                    <div className="flex items-center justify-between relative text-[11px] font-bold">
                      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-stone-200 dark:bg-stone-800 z-0" />
                      {['Placed', 'Confirmed', 'Shipped', 'Delivered'].map((stepName, idx) => {
                        const stepLower = stepName.toLowerCase();
                        const isDone = ['delivered', 'shipped', 'confirmed', 'placed'].indexOf(order.status) >= (3 - idx);
                        return (
                          <div key={stepName} className="relative z-10 flex flex-col items-center gap-1 bg-[var(--bg-surface)] px-2">
                            <div 
                              className="w-3.5 h-3.5 rounded-full border-2 transition-all"
                              style={{
                                background: isDone ? 'var(--accent-primary)' : 'var(--bg-surface)',
                                borderColor: 'var(--accent-primary)',
                              }}
                            />
                            <span style={{ color: isDone ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                              {stepName}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="flex flex-col gap-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                          style={{ background: 'rgba(240, 232, 216, 0.4)' }}
                        >
                          {item.product_image ? (
                            <img src={item.product_image} alt={item.product_name} className="w-full h-full object-contain p-1" />
                          ) : (
                            <Package size={18} className="opacity-30" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>{item.product_name}</h4>
                          <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Qty: {item.quantity} • ₹{item.unit_price}</p>
                        </div>
                        <p className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>₹{item.total_price}</p>
                      </div>
                    ))}
                  </div>

                  {/* Order Action Buttons */}
                  <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between flex-wrap gap-3">
                    <button
                      onClick={() => alert(`Showing tracking details for Order #${order.id}`)}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold cursor-pointer border text-[var(--text-primary)]"
                      style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-page)' }}
                    >
                      <Eye size={13} /> View Details
                    </button>

                    <div className="flex items-center gap-2">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={actionLoading === order.id}
                          className="px-4 py-1.5 rounded-full text-xs font-bold cursor-pointer text-red-600 bg-red-50 dark:bg-red-950/20"
                        >
                          {actionLoading === order.id ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                      )}

                      <button
                        onClick={() => handleReorder(order.id)}
                        disabled={actionLoading === order.id}
                        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold cursor-pointer transition-all shadow-sm"
                        style={{ background: 'var(--accent-primary)', color: '#FFFDF8' }}
                      >
                        <RefreshCw size={12} /> {actionLoading === order.id ? 'Reordering...' : 'Buy Again'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}