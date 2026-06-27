'use client'

import { motion } from 'framer-motion'
import { Plus, Minus, Trash2 } from 'lucide-react'
import { CartItem } from '@/lib/types'
import { useCart } from '@/lib/cart-context'

interface CartItemCardProps {
  item: CartItem
}

export function CartItemCard({ item }: CartItemCardProps) {
  const { updateQuantity, removeItem } = useCart()

  return (
    <motion.div
      className="bg-beige rounded-lg p-3 border border-sky-blue hover:shadow-md transition"
      whileHover={{ y: -2 }}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <h4 className="font-semibold text-navy text-sm line-clamp-1">{item.name}</h4>
          <p className="text-navy text-xs">{item.description}</p>
        </div>
        <button
          onClick={() => removeItem(item.id)}
          className="text-red-500 hover:bg-red-50 p-1 rounded transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 flex justify-between items-center">
        <span className="font-bold text-green text-sm">₹{item.price}</span>

        <div className="flex items-center gap-2 bg-white rounded-full border border-sky-blue px-2 py-1">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            className="text-navy hover:text-green transition"
          >
            <Minus className="w-3 h-3" />
          </motion.button>
          <span className="text-navy text-sm font-semibold w-6 text-center">{item.quantity}</span>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            className="text-navy hover:text-green transition"
          >
            <Plus className="w-3 h-3" />
          </motion.button>
        </div>
      </div>

      <div className="mt-2 text-right">
        <span className="text-navy text-xs">Subtotal: ₹{item.price * item.quantity}</span>
      </div>
    </motion.div>
  )
}
