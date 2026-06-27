'use client'

import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { mockCategories, mockPriceRanges, mockRatingRanges } from '@/lib/mock-data'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface CategorySidebarProps {
  onCategoryChange: (categoryId: string | null) => void
  onPriceChange: (range: { min: number; max: number } | null) => void
  onRatingChange: (minRating: number | null) => void
}

export function CategorySidebar({
  onCategoryChange,
  onPriceChange,
  onRatingChange,
}: CategorySidebarProps) {
  const searchParams = useSearchParams()
  const selectedCategory = searchParams.get('category')

  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    rating: true,
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const handleCategoryClick = (categoryId: string) => {
    onCategoryChange(selectedCategory === categoryId ? null : categoryId)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-64 bg-white rounded-2xl border-2 border-sky-blue p-6 h-fit sticky top-24"
    >
      <h3 className="text-lg font-bold text-navy mb-6">Filters</h3>

      {/* Categories Section */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('categories')}
          className="flex items-center justify-between w-full mb-3 text-navy font-bold hover:text-teal transition"
        >
          <span>Categories</span>
          <ChevronDown
            className={`w-5 h-5 transition ${expandedSections.categories ? 'rotate-180' : ''}`}
          />
        </button>

        {expandedSections.categories && (
          <div className="space-y-2">
            {mockCategories.map((category) => (
              <label
                key={category.id}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={selectedCategory === category.id}
                  onChange={() => handleCategoryClick(category.id)}
                  className="w-4 h-4 rounded border-2 border-sky-blue accent-green"
                />
                <span className="text-navy group-hover:text-green transition font-medium">{category.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price Range Section */}
      <div className="mb-6 pb-6 border-b border-sky-blue">
        <button
          onClick={() => toggleSection('price')}
          className="flex items-center justify-between w-full mb-3 text-navy font-bold hover:text-teal transition"
        >
          <span>Price Range</span>
          <ChevronDown
            className={`w-5 h-5 transition ${expandedSections.price ? 'rotate-180' : ''}`}
          />
        </button>

        {expandedSections.price && (
          <div className="space-y-2">
            {mockPriceRanges.map((range) => (
              <label key={range.id} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="price"
                  onChange={() => onPriceChange({ min: range.min, max: range.max })}
                  className="w-4 h-4 accent-green"
                />
                <span className="text-navy group-hover:text-green transition font-medium">{range.label}</span>
              </label>
            ))}
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="price"
                onChange={() => onPriceChange(null)}
                className="w-4 h-4 accent-green"
              />
              <span className="text-navy group-hover:text-green transition font-medium">All Prices</span>
            </label>
          </div>
        )}
      </div>

      {/* Rating Section */}
      <div>
        <button
          onClick={() => toggleSection('rating')}
          className="flex items-center justify-between w-full mb-3 text-navy font-bold hover:text-teal transition"
        >
          <span>Rating</span>
          <ChevronDown
            className={`w-5 h-5 transition ${expandedSections.rating ? 'rotate-180' : ''}`}
          />
        </button>

        {expandedSections.rating && (
          <div className="space-y-2">
            {mockRatingRanges.map((range) => (
              <label key={range.id} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="rating"
                  onChange={() => onRatingChange(range.min)}
                  className="w-4 h-4 accent-green"
                />
                <span className="text-navy group-hover:text-green transition font-medium">{range.label}</span>
              </label>
            ))}
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="rating"
                onChange={() => onRatingChange(null)}
                className="w-4 h-4 accent-green"
              />
              <span className="text-navy group-hover:text-green transition font-medium">All Ratings</span>
            </label>
          </div>
        )}
      </div>
    </motion.div>
  )
}
