'use client'

import { motion } from 'framer-motion'
import { PantryItem } from '@/lib/types'

interface PantryCardProps {
  item: PantryItem
}

export function PantryCard({ item }: PantryCardProps) {
  const isExpiringSoon = item.expiryDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
  const isExpired = item.expiryDate.getTime() < Date.now()

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-lg p-4 border border-sky-blue hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="text-3xl">{item.icon}</div>
        {isExpired && (
          <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full font-semibold">
            Expired
          </span>
        )}
        {isExpiringSoon && !isExpired && (
          <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-600 rounded-full font-semibold">
            Expiring Soon
          </span>
        )}
      </div>

      <h3 className="font-bold text-navy mb-1">{item.name}</h3>
      <p className="text-navy text-sm mb-3">{item.category}</p>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-navy">Quantity:</span>
          <span className="font-semibold text-navy">
            {item.quantity} {item.unit}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-navy">Expires:</span>
          <span className={`font-semibold ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-green'}`}>
            {formatDate(item.expiryDate)}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
