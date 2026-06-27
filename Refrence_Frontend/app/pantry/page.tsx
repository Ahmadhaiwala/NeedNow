'use client'

import { useState } from 'react'
import { mockPantryItems } from '@/lib/mock-data'
import { AnimatedPage } from '@/components/AnimatedPage'
import { PantryCard } from '@/components/PantryCard'
import { Plus } from 'lucide-react'
import { motion } from 'framer-motion'

export default function PantryPage() {
  const [items] = useState(mockPantryItems)
  const categories = Array.from(new Set(items.map((item) => item.category)))

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-beige pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-navy">My Pantry</h1>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-teal text-white rounded-lg font-semibold hover:bg-navy transition"
            >
              <Plus className="w-5 h-5" />
              Add Item
            </motion.button>
          </div>

          {/* Categories */}
          {categories.map((category) => {
            const categoryItems = items.filter((item) => item.category === category)

            return (
              <div key={category} className="mb-12">
                <h2 className="text-2xl font-bold text-navy mb-4">{category}</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryItems.map((item) => (
                    <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <PantryCard item={item} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AnimatedPage>
  )
}
