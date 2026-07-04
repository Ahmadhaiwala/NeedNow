'use client';

import { useCart } from '@/context/CartContext';
import { useAuth } from '@/lib/auth';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, ShoppingCart } from 'lucide-react';

function isValidUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch { return false; }
}

export default function CartPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { state, updateItem, removeItem, clearItems } = useCart();
  const { items, total, item_count, loading } = state;

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
          <ShoppingCart size={64} className="mx-auto mb-6 opacity-30" style={{ color: 'var(--text-secondary)' }} />
          <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Sign in to view your cart</h1>
          <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>You need to be logged in to add and view items in your cart.</p>
          <Link href="/" className="px-8 py-3 font-semibold rounded-full" style={{ background: 'var(--accent-primary)', color: 'var(--color-core)' }}>
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-page)' }}>
        <div className="text-center max-w-sm">
          <ShoppingBag size={64} className="mx-auto mb-6 opacity-30" style={{ color: 'var(--text-secondary)' }} />
          <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Your cart is empty</h1>
          <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>Looks like you haven't added anything yet. Let's change that!</p>
          <Link href="/" className="px-8 py-3 font-semibold rounded-full inline-flex items-center gap-2"
            style={{ background: 'var(--accent-primary)', color: 'var(--color-core)' }}>
            <ArrowLeft size={16} />
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const delivery = total > 499 ? 0 : 49;
  const finalTotal = total + delivery;

  return (
    <div className="min-h-screen px-4 pb-16" style={{ background: 'var(--bg-page)' }}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between py-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Your Cart</h1>
            <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>{item_count} item{item_count !== 1 ? 's' : ''}</p>
          </div>
          <Link href="/" className="flex items-center gap-2 font-medium" style={{ color: 'var(--color-jade)' }}>
            <ArrowLeft size={16} />
            Continue Shopping
          </Link>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">

          {/* ── Cart Items ── */}
          <div className="lg:col-span-8 space-y-4">
            {/* Clear All */}
            <div className="flex justify-end">
              <button onClick={clearItems} disabled={loading}
                className="text-sm font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-opacity"
                style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)' }}>
                <Trash2 size={13} />
                Clear All
              </button>
            </div>

            {items.map((item) => (
              <div key={item.id} className="flex gap-4 p-4 rounded-2xl"
                style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-card)' }}>

                {/* Image */}
                <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden flex items-center justify-center"
                  style={{ background: 'rgba(123,163,206,0.1)' }}>
                  {isValidUrl(item.product.image_url) ? (
                    <Image src={item.product.image_url} alt={item.product.name} width={96} height={96}
                      className="w-full h-full object-contain" unoptimized />
                  ) : (
                    <ShoppingBag size={32} style={{ color: 'var(--text-secondary)', opacity: 0.3 }} />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/product/${item.product.id}`}>
                    <p className="font-semibold leading-tight hover:underline line-clamp-2"
                      style={{ color: 'var(--text-primary)', fontSize: '15px' }}>
                      {item.product.name}
                    </p>
                  </Link>
                  {item.product.brand && (
                    <p className="mt-0.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{item.product.brand}</p>
                  )}
                  <p className="mt-2 font-bold text-lg" style={{ color: 'var(--color-jade)' }}>
                    {item.product.price != null ? `₹${parseFloat(String(item.product.price)).toFixed(2)}` : 'N/A'}
                  </p>
                </div>

                {/* Quantity + Remove */}
                <div className="flex flex-col items-end justify-between">
                  {/* Quantity controls */}
                  <div className="flex items-center gap-2 rounded-full px-2 py-1"
                    style={{ background: 'rgba(123,163,206,0.1)', border: '1px solid rgba(123,163,206,0.2)' }}>
                    <button onClick={() => updateItem(item.id, item.quantity - 1)} disabled={loading}
                      className="w-7 h-7 flex items-center justify-center rounded-full transition-all hover:scale-110"
                      style={{ color: 'var(--color-jade)' }}>
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {item.quantity}
                    </span>
                    <button onClick={() => updateItem(item.id, item.quantity + 1)} disabled={loading}
                      className="w-7 h-7 flex items-center justify-center rounded-full transition-all hover:scale-110"
                      style={{ color: 'var(--color-jade)' }}>
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Line total */}
                  {item.line_total != null && (
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      ₹{item.line_total.toFixed(2)}
                    </p>
                  )}

                  {/* Remove */}
                  <button onClick={() => removeItem(item.id)} disabled={loading}
                    className="p-1.5 rounded-full transition-all hover:scale-110"
                    style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Order Summary ── */}
          <div className="lg:col-span-4">
            <div className="sticky top-28 p-6 rounded-2xl" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-card)' }}>
              <h2 className="font-bold text-xl mb-6" style={{ color: 'var(--text-primary)' }}>Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span>Subtotal ({item_count} items)</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span>Delivery</span>
                  <span className={delivery === 0 ? 'text-green-500 font-semibold' : ''}>
                    {delivery === 0 ? 'Free' : `₹${delivery}`}
                  </span>
                </div>
                {delivery === 0 && (
                  <p className="text-xs rounded-lg px-3 py-2" style={{ background: 'rgba(2,90,92,0.1)', color: 'var(--color-jade)' }}>
                    Free delivery on orders above ₹499!
                  </p>
                )}
                {delivery > 0 && (
                  <p className="text-xs rounded-lg px-3 py-2" style={{ background: 'rgba(123,163,206,0.1)', color: 'var(--color-sky)' }}>
                    Add ₹{(499 - total).toFixed(0)} more for free delivery
                  </p>
                )}
              </div>

              <div className="border-t pt-4 mb-6" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                <div className="flex justify-between font-bold text-lg">
                  <span style={{ color: 'var(--text-primary)' }}>Total</span>
                  <span style={{ color: 'var(--color-jade)' }}>₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <button className="w-full py-4 font-bold rounded-full text-center transition-all hover:opacity-90 hover:scale-[1.02]"
                style={{ background: 'var(--color-jade)', color: 'white', fontSize: '16px' }}>
                Proceed to Checkout
              </button>

              <p className="text-center text-xs mt-4" style={{ color: 'var(--text-secondary)' }}>
                Secure checkout powered by NeedNow
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
