'use client';

import { useCart } from '@/context/CartContext';
import { useAuth } from '@/lib/auth';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, ShoppingCart, Truck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Navbar from '../navbar/Navbar';

function isValidUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch { return false; }
}

export default function CartPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { state, updateItem, removeItem, clearItems, checkout } = useCart();
  const { items, total, item_count, loading } = state;
  const router = useRouter();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Loading cart...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col justify-between" style={{ background: 'var(--bg-page)' }}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="text-center max-w-sm">
            <ShoppingCart size={48} className="mx-auto mb-4 opacity-30 text-[var(--text-secondary)]" />
            <h1 className="text-xl font-serif font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Sign in to view your cart</h1>
            <p className="mb-6 text-xs" style={{ color: 'var(--text-secondary)' }}>You need to be logged in to add and view items in your cart.</p>
            <Link href="/" className="px-6 py-2.5 font-bold text-xs rounded-full inline-block" style={{ background: 'var(--accent-primary)', color: '#FFFDF8' }}>
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col justify-between" style={{ background: 'var(--bg-page)' }}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="text-center max-w-sm">
            <ShoppingBag size={48} className="mx-auto mb-4 opacity-30 text-[var(--text-secondary)]" />
            <h1 className="text-xl font-serif font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Your cart is empty</h1>
            <p className="mb-6 text-xs" style={{ color: 'var(--text-secondary)' }}>Looks like you haven't added anything yet. Let's change that!</p>
            <Link href="/" className="px-6 py-2.5 font-bold text-xs rounded-full inline-flex items-center gap-2"
              style={{ background: 'var(--accent-primary)', color: '#FFFDF8' }}>
              <ArrowLeft size={14} />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const delivery = total > 499 ? 0 : 49;
  const finalTotal = total + delivery;

  const handleCheckout = async () => {
    if (items.length === 0) return;
    
    setCheckoutLoading(true);
    try {
      const result = await checkout('neednow');
      alert(`Order created successfully! Order ID: ${result.order.id}`);
      router.push('/orders');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to proceed to checkout';
      alert(message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ background: 'var(--bg-page)' }}>
      <Navbar />

      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between py-4 mb-6">
          <div>
            <h1 className="text-3xl font-serif font-bold" style={{ color: 'var(--text-primary)' }}>Your Cart</h1>
            <p className="mt-0.5 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{item_count} item{item_count !== 1 ? 's' : ''}</p>
          </div>
          <Link href="/" className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--accent-primary)' }}>
            <ArrowLeft size={14} />
            Continue Shopping
          </Link>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex justify-end">
              <button 
                onClick={clearItems} 
                disabled={loading}
                className="text-xs font-bold flex items-center gap-1 px-3 py-1 rounded-full cursor-pointer transition-opacity"
                style={{ color: 'var(--color-heat)', background: 'rgba(185, 74, 62, 0.1)' }}
              >
                <Trash2 size={12} />
                Clear All
              </button>
            </div>

            {items.map((item) => (
              <div 
                key={item.id} 
                className="flex gap-4 p-4 rounded-2xl shadow-card"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
              >
                {/* Image */}
                <div 
                  className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden flex items-center justify-center p-2"
                  style={{ background: 'var(--surface-1)' }}
                >
                  {isValidUrl(item.product.image_url) ? (
                    <Image 
                      src={item.product.image_url} 
                      alt={item.product.name} 
                      width={80} 
                      height={80}
                      className="w-full h-full object-contain" 
                      unoptimized 
                    />
                  ) : (
                    <ShoppingBag size={24} style={{ color: 'var(--text-secondary)', opacity: 0.3 }} />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/product/${item.product.id}`}>
                    <p 
                      className="font-semibold text-xs leading-tight hover:underline line-clamp-2"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {item.product.name}
                    </p>
                  </Link>
                  {item.product.brand && (
                    <p className="mt-0.5 text-[11px]" style={{ color: 'var(--text-secondary)' }}>{item.product.brand}</p>
                  )}
                  <p className="mt-2 font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {item.product.price != null ? `₹${parseFloat(String(item.product.price)).toFixed(0)}` : 'N/A'}
                  </p>
                </div>

                {/* Quantity Controls & Remove */}
                <div className="flex flex-col items-end justify-between">
                  <div 
                    className="flex items-center gap-1.5 rounded-full px-2 py-0.5"
                    style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
                  >
                    <button 
                      onClick={() => updateItem(item.id, item.quantity - 1)} 
                      disabled={loading}
                      className="w-6 h-6 flex items-center justify-center rounded-full cursor-pointer"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-5 text-center font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
                      {item.quantity}
                    </span>
                    <button 
                      onClick={() => updateItem(item.id, item.quantity + 1)} 
                      disabled={loading}
                      className="w-6 h-6 flex items-center justify-center rounded-full cursor-pointer"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  <button 
                    onClick={() => removeItem(item.id)} 
                    disabled={loading}
                    className="p-1 rounded-full cursor-pointer transition-colors"
                    style={{ color: 'var(--color-heat)', background: 'rgba(185, 74, 62, 0.08)' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-4">
            <div 
              className="sticky top-24 p-6 rounded-2xl shadow-card" 
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
            >
              <h2 className="font-serif font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>Order Summary</h2>

              <div className="space-y-3 text-xs mb-6">
                <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
                  <span>Subtotal ({item_count} items)</span>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>₹{total.toFixed(0)}</span>
                </div>
                <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
                  <span>Delivery Fee</span>
                  <span className={delivery === 0 ? 'font-bold text-emerald-600' : 'font-semibold'}>
                    {delivery === 0 ? 'FREE' : `₹${delivery}`}
                  </span>
                </div>
                {delivery === 0 && (
                  <p className="text-[11px] font-semibold rounded-lg p-2.5 flex items-center gap-1.5" style={{ background: 'rgba(78, 112, 85, 0.12)', color: 'var(--color-jade)' }}>
                    <Truck size={14} /> Free 30-min express delivery unlocked!
                  </p>
                )}
                {delivery > 0 && (
                  <p className="text-[11px] rounded-lg p-2.5" style={{ background: 'rgba(154, 101, 60, 0.12)', color: 'var(--accent-primary)' }}>
                    Add ₹{(499 - total).toFixed(0)} more for free delivery
                  </p>
                )}
              </div>

              <div className="border-t pt-4 mb-6" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex justify-between font-bold text-base">
                  <span style={{ color: 'var(--text-primary)' }}>Total Amount</span>
                  <span style={{ color: 'var(--accent-primary)' }}>₹{finalTotal.toFixed(0)}</span>
                </div>
              </div>

              <button 
                onClick={handleCheckout}
                disabled={loading || checkoutLoading || items.length === 0}
                className="w-full py-3.5 font-bold text-xs rounded-full text-center transition-all cursor-pointer shadow-sm"
                style={{ background: 'var(--accent-primary)', color: '#FFFDF8' }}
              >
                {checkoutLoading ? 'Processing Checkout...' : 'Proceed to Checkout'}
              </button>

              <p className="text-center text-[10px] mt-3" style={{ color: 'var(--text-secondary)' }}>
                100% Secure Checkout powered by NeedNow
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
