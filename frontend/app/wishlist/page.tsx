'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Heart, Package, ArrowRight, Trash2 } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';

function formatPrice(price: string | number | null | undefined): string {
  if (price == null) return '';
  const n = parseFloat(String(price));
  return isNaN(n) ? '' : `₹${n.toFixed(0)}`;
}

export default function WishlistPage() {
  const { items, toggle, count } = useWishlist();

  return (
    <div className="min-h-screen px-6 py-10" style={{ background: 'var(--bg-page)' }}>
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <div
            className="flex items-center justify-center"
            style={{
              width: '52px',
              height: '52px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(233,186,195,0.25)',
            }}
          >
            <Heart size={24} style={{ color: '#025A5C', fill: count > 0 ? '#025A5C' : 'none' }} />
          </div>
          <div>
            <h1
              className="font-bold"
              style={{ fontSize: '32px', color: 'var(--text-primary)', lineHeight: 1.2 }}
            >
              Wishlist
            </h1>
            <p
              className="mt-1 font-medium"
              style={{ fontSize: '14px', color: 'var(--text-secondary)' }}
            >
              {count} {count === 1 ? 'item' : 'items'} saved
            </p>
          </div>
        </div>

        {/* Empty state */}
        {count === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div
              className="flex items-center justify-center mb-6"
              style={{
                width: '80px',
                height: '80px',
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(233,186,195,0.18)',
              }}
            >
              <Heart size={36} style={{ color: 'var(--color-pink)', opacity: 0.6 }} />
            </div>
            <h2
              className="font-bold mb-3"
              style={{ fontSize: '22px', color: 'var(--text-primary)' }}
            >
              Your wishlist is empty
            </h2>
            <p
              className="mb-8 max-w-xs"
              style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6 }}
            >
              Tap the heart icon on any product to save it here for later.
            </p>
            <Link href="/">
              <button
                className="flex items-center gap-2 font-semibold"
                style={{
                  padding: '14px 28px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--accent-primary)',
                  color: 'var(--color-core)',
                  border: 'none',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-button)',
                }}
              >
                Discover Products
                <ArrowRight size={16} />
              </button>
            </Link>
          </motion.div>
        )}

        {/* Item grid */}
        {count > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.18 } }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                  style={{
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-card)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Image area */}
                  <Link href={`/product/${item.id}`}>
                    <div
                      className="flex items-center justify-center p-6 cursor-pointer"
                      style={{ background: 'rgba(233,186,195,0.18)', height: '160px' }}
                    >
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <Package size={40} style={{ color: 'var(--color-core)', opacity: 0.25 }} />
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="p-4">
                    <span
                      className="uppercase tracking-wider font-semibold"
                      style={{ fontSize: '11px', color: 'var(--color-jade)' }}
                    >
                      {item.brand}
                    </span>
                    <Link href={`/product/${item.id}`}>
                      <h3
                        className="mt-1 font-semibold leading-snug line-clamp-2 cursor-pointer hover:underline"
                        style={{ fontSize: '15px', color: 'var(--text-primary)' }}
                      >
                        {item.name}
                      </h3>
                    </Link>

                    <div className="flex items-center justify-between mt-4">
                      {/* Price */}
                      <span
                        className="font-bold"
                        style={{ fontSize: '20px', color: 'var(--text-primary)' }}
                      >
                        {formatPrice(item.price) || '—'}
                      </span>

                      {/* Remove from wishlist */}
                      <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggle(item)}
                        className="flex items-center justify-center"
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: 'var(--radius-md)',
                          background: 'rgba(231,63,60,0.08)',
                          color: 'var(--color-heat)',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(231,63,60,0.16)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(231,63,60,0.08)';
                        }}
                        aria-label="Remove from wishlist"
                      >
                        <Trash2 size={16} />
                      </motion.button>
                    </div>

                    {/* Add to cart CTA */}
                    <Link href={`/product/${item.id}`}>
                      <button
                        className="mt-3 w-full flex items-center justify-center gap-2 font-semibold"
                        style={{
                          padding: '11px 16px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--accent-primary)',
                          color: 'var(--color-core)',
                          border: 'none',
                          fontSize: '13px',
                          cursor: 'pointer',
                          boxShadow: 'var(--shadow-button)',
                          transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                      >
                        View Product
                        <ArrowRight size={14} />
                      </button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
