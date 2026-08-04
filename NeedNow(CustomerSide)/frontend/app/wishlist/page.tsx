'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Heart, Package, ArrowRight, Trash2, ShoppingCart } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { useFlyToCart } from '@/context/FlyToCartContext';
import Navbar from '../navbar/Navbar';

function formatPrice(price: string | number | null | undefined): string {
  if (price == null) return '';
  const n = parseFloat(String(price));
  return isNaN(n) ? '' : `₹${n.toFixed(0)}`;
}

export default function WishlistPage() {
  const { items, toggle, count } = useWishlist();
  const { addItem } = useCart();
  const { triggerFlyAnimation } = useFlyToCart();

  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ background: 'var(--bg-page)' }}>
      <Navbar />

      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div
            className="flex items-center justify-center rounded-2xl"
            style={{
              width: '48px',
              height: '48px',
              background: 'rgba(185,74,62,0.12)',
            }}
          >
            <Heart size={22} style={{ color: 'var(--color-heat)', fill: count > 0 ? 'var(--color-heat)' : 'none' }} />
          </div>
          <div>
            <h1
              className="font-serif font-bold text-3xl"
              style={{ color: 'var(--text-primary)', lineHeight: 1.2 }}
            >
              Saved for Later
            </h1>
            <p
              className="mt-0.5 text-xs font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              {count} {count === 1 ? 'item' : 'items'} saved in your wishlist
            </p>
          </div>
        </div>

        {/* Empty state */}
        {count === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center rounded-3xl"
            style={{
              background: 'var(--surface-1)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div
              className="flex items-center justify-center mb-4 rounded-2xl"
              style={{
                width: '64px',
                height: '64px',
                background: 'rgba(185,74,62,0.12)',
              }}
            >
              <Heart size={28} style={{ color: 'var(--color-heat)', opacity: 0.6 }} />
            </div>
            <h2
              className="font-serif font-bold text-xl mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Your wishlist is empty
            </h2>
            <p
              className="mb-6 max-w-xs text-xs"
              style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}
            >
              Tap the heart icon on any product to save it here for later.
            </p>
            <Link href="/">
              <button
                className="flex items-center gap-2 font-bold text-xs px-6 py-3 rounded-full cursor-pointer shadow-sm"
                style={{
                  background: 'var(--accent-primary)',
                  color: '#FFFDF8',
                }}
              >
                Discover Products
                <ArrowRight size={14} />
              </button>
            </Link>
          </motion.div>
        )}

        {/* Item grid with layout animation */}
        {count > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="flex flex-col justify-between rounded-2xl overflow-hidden shadow-card"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {/* Image area */}
                  <Link href={`/product/${item.id}`}>
                    <div
                      className="flex items-center justify-center p-6 cursor-pointer relative"
                      style={{ background: 'var(--surface-1)', height: '160px' }}
                    >
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <Package size={36} style={{ color: 'var(--text-secondary)', opacity: 0.3 }} />
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="p-4 flex flex-col flex-1">
                    <span
                      className="uppercase tracking-wider font-bold text-[10px]"
                      style={{ color: 'var(--accent-primary)' }}
                    >
                      {item.brand || 'Wishlist Item'}
                    </span>
                    <Link href={`/product/${item.id}`}>
                      <h3
                        className="mt-1 font-semibold text-xs leading-snug line-clamp-2 cursor-pointer hover:underline"
                        style={{ color: 'var(--text-primary)', minHeight: '32px' }}
                      >
                        {item.name}
                      </h3>
                    </Link>

                    <div className="flex items-center justify-between mt-4 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                      <span
                        className="font-bold text-sm"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {formatPrice(item.price) || '—'}
                      </span>

                      {/* Remove from wishlist button */}
                      <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggle(item)}
                        className="flex items-center justify-center p-2 rounded-full cursor-pointer transition-colors"
                        style={{
                          background: 'rgba(185, 74, 62, 0.1)',
                          color: 'var(--color-heat)',
                          border: 'none',
                        }}
                        aria-label="Remove from wishlist"
                      >
                        <Trash2 size={14} />
                      </motion.button>
                    </div>

                    {/* Add to cart CTA */}
                    <button
                      onClick={(e) => {
                        triggerFlyAnimation(e, item.image_url || '');
                        addItem(item.id, 1).catch(console.error);
                      }}
                      className="mt-3 w-full flex items-center justify-center gap-1.5 font-bold text-xs py-2.5 rounded-full cursor-pointer transition-all shadow-sm"
                      style={{
                        background: 'var(--accent-primary)',
                        color: '#FFFDF8',
                        border: 'none',
                      }}
                    >
                      <ShoppingCart size={13} />
                      Add to Cart
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
