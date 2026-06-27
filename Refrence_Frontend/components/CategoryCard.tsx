'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

interface CategoryCardProps {
  id: string
  name: string
  icon: string
  color: string
  productCount: number
}

export function CategoryCard({ id, name, icon, color, productCount }: CategoryCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="flex-shrink-0"
    >
      <Link href={`/products?category=${id}`}>
        <div
          className={`bg-gradient-to-br ${color} rounded-2xl p-6 w-48 h-48 flex flex-col items-center justify-center cursor-pointer shadow-lg hover:shadow-xl transition`}
        >
          <div className="text-6xl mb-3">{icon}</div>
          <h3 className="text-white font-bold text-lg text-center">{name}</h3>
          <p className="text-white text-sm opacity-90 mt-1">{productCount} products</p>
        </div>
      </Link>
    </motion.div>
  )
}
