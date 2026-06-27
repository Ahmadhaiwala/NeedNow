'use client'

import { motion } from 'framer-motion'
import { X } from 'lucide-react'

interface ActiveFiltersProps {
  filters: string[]
  onRemove: (filter: string) => void
  onClearAll: () => void
}

export function ActiveFilters({ filters, onRemove, onClearAll }: ActiveFiltersProps) {
  if (filters.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-sky-blue bg-opacity-30 px-4 py-3 flex items-center gap-2 overflow-x-auto"
    >
      <span className="text-sm text-navy font-medium whitespace-nowrap">Active filters:</span>

      <div className="flex gap-2 overflow-x-auto">
        {filters.map((filter) => (
          <motion.div
            key={filter}
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-1 px-3 py-1 bg-navy text-white rounded-full text-sm"
          >
            <span>{filter}</span>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onRemove(filter)}
              className="hover:bg-teal rounded-full p-0.5 transition"
            >
              <X className="w-3 h-3" />
            </motion.button>
          </motion.div>
        ))}
      </div>

      <button
        onClick={onClearAll}
        className="ml-auto text-navy text-sm font-medium hover:text-teal transition whitespace-nowrap"
      >
        Clear All
      </button>
    </motion.div>
  )
}
