'use client';

/**
 * WishlistButton
 * ---------------
 * Standalone wishlist toggle rendered on the product detail page.
 * Calls WishlistContext.toggle() which records the interaction immediately.
 */

import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';

interface Props {
  product: {
    id: string;
    name: string;
    price?: string | number | null;
    image_url?: string;
    brand?: string;
  };
}

export default function WishlistButton({ product }: Props) {
  const { isWishlisted, toggle } = useWishlist();
  const wishlisted = isWishlisted(product.id);

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      onClick={() =>
        toggle({
          id: product.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
          brand: product.brand,
        })
      }
      className="w-full flex items-center justify-center gap-2 font-semibold"
      style={{
        padding: '14px 20px',
        borderRadius: 'var(--radius-full)',
        background: wishlisted
          ? 'rgba(233,186,195,0.35)'
          : 'rgba(233,186,195,0.12)',
        color: wishlisted ? '#1F3635' : 'var(--text-primary)',
        border: wishlisted
          ? '1.5px solid rgba(233,186,195,0.7)'
          : '1.5px solid rgba(233,186,195,0.25)',
        cursor: 'pointer',
        transition: 'all 0.22s ease',
        fontSize: '14px',
      }}
      aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        size={16}
        style={{
          fill: wishlisted ? 'currentColor' : 'none',
          transition: 'fill 0.22s',
        }}
      />
      {wishlisted ? 'Wishlisted' : 'Add to Wishlist'}
    </motion.button>
  );
}
