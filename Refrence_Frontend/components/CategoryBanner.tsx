'use client'

import { motion } from 'framer-motion'
import { mockCategories } from '@/lib/mock-data'
import { X } from 'lucide-react'

interface CategoryBannerProps {
  categoryId: string
  onClose: () => void
}

export function CategoryBanner({ categoryId, onClose }: CategoryBannerProps) {
  const category = mockCategories.find((cat) => cat.id === categoryId)

  if (!category) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`bg-gradient-to-r ${category.color} rounded-2xl p-8 mb-8 text-white relative overflow-hidden`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold mb-2">{category.name}</h2>
          <p className="text-lg opacity-90">Browse {category.productCount} amazing products</p>
        </div>
        <div className="text-7xl opacity-20">{category.icon}</div>
      </div>

      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
      >
        <X className="w-6 h-6" />
      </button>
    </motion.div>
  )
}
