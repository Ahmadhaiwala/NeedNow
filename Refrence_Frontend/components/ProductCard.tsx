'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, ShoppingCart, Check, Package } from 'lucide-react'
import { Product } from '@/lib/types'
import { useCart } from '@/lib/cart-context'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isAdded, setIsAdded] = useState(false)
  const { addItem } = useCart()

  const handleAddToCart = () => {
    addItem(product, 'Optional')
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2000)
  }

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted)
  }

  const stars = Array.from({ length: 5 }).map((_, i) => i < Math.floor(product.rating))

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl border border-sky-blue p-4 hover:shadow-lg transition-shadow h-full flex flex-col"
    >
      {/* Image Placeholder */}
      <div className="relative w-full aspect-square bg-sky-blue rounded-lg mb-3 flex items-center justify-center overflow-hidden">
        <Package className="w-12 h-12 text-teal" />

        {/* Wishlist Heart */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleWishlist}
          className="absolute top-3 right-3 p-2 rounded-full bg-white hover:bg-beige transition"
        >
          <Heart
            className={`w-5 h-5 transition ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-teal'}`}
          />
        </motion.button>
      </div>

      {/* Product Info */}
      <h3 className="font-bold text-navy text-sm line-clamp-2 mb-1">{product.name}</h3>
      <p className="text-navy text-xs line-clamp-1 mb-2">{product.description}</p>

      {/* Rating */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex gap-0.5">
          {stars.map((isFilled, i) => (
            <svg
              key={i}
              className={`w-3 h-3 ${isFilled ? 'fill-green' : 'fill-teal'}`}
              viewBox="0 0 20 20"
            >
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
          ))}
        </div>
        <span className="text-navy text-xs">{product.reviews} reviews</span>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        {product.tags.slice(0, 2).map((tag, i) => (
          <span key={i} className="text-xs px-2 py-1 bg-sky-blue text-navy border border-teal rounded-full font-medium">
            {tag}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-sky-blue">
        <span className="font-bold text-navy text-lg">₹{product.price}</span>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleAddToCart}
          className={`flex items-center gap-1 px-3 py-2 rounded-lg font-semibold text-sm transition ${
            isAdded
              ? 'bg-navy text-white'
              : 'bg-green text-white hover:bg-opacity-90'
          }`}
        >
          {isAdded ? (
            <>
              <Check className="w-4 h-4" />
              Added
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              Add
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  )
}
