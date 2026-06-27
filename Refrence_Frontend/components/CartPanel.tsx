'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useCart } from '@/lib/cart-context'
import { CartItemCard } from './CartItemCard'

interface CartPanelProps {
  isCompact?: boolean
}

export function CartPanel({ isCompact = false }: CartPanelProps) {
  const { cartItems, getCartTotal } = useCart()
  const [selectedCategory, setSelectedCategory] = useState<'Essential' | 'Optional' | 'Luxury' | 'All'>('All')

  const categories = ['Essential', 'Optional', 'Luxury'] as const
  const filteredItems =
    selectedCategory === 'All'
      ? cartItems
      : cartItems.filter((item) => item.category === selectedCategory)

  const containerClass = isCompact
    ? 'flex flex-col h-96 bg-white rounded-lg border border-sky-blue'
    : 'flex flex-col bg-white rounded-lg'

  const itemsClass = isCompact ? 'flex-1 overflow-y-auto' : 'flex-1 overflow-y-auto max-h-96'

  return (
    <div className={containerClass}>
      {/* Tabs */}
      <div className="flex border-b border-sky-blue bg-beige rounded-t-lg">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition ${
            selectedCategory === 'All'
              ? 'text-navy border-b-2 border-teal bg-white'
              : 'text-navy hover:bg-white'
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${
              selectedCategory === category
                ? 'text-navy border-b-2 border-teal bg-white'
                : 'text-navy hover:bg-white'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className={`${itemsClass} p-3 space-y-2`}>
        {filteredItems.length === 0 ? (
          <p className="text-center text-navy py-8">No items in cart</p>
        ) : (
          filteredItems.map((item) => (
            <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
              <CartItemCard item={item} />
            </motion.div>
          ))
        )}
      </div>

      {/* Footer */}
      {filteredItems.length > 0 && (
        <div className="border-t border-sky-blue p-4 bg-beige rounded-b-lg">
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold text-navy">Total:</span>
            <span className="text-2xl font-bold text-green">₹{getCartTotal()}</span>
          </div>
          <button className="w-full bg-green text-white py-2 rounded-lg font-semibold hover:bg-opacity-90 transition">
            Checkout
          </button>
        </div>
      )}
    </div>
  )
}
