'use client'

import { Search, SlidersHorizontal } from 'lucide-react'
import { motion } from 'framer-motion'

interface SearchHeaderProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  selectedFilters: string[]
  onFilterChange: (filter: string) => void
  sortBy: string
  onSortChange: (sort: string) => void
  onShowAllFilters?: () => void
}

const filterOptions = ['Categories', 'Price Range', 'Brand', 'Rating', 'Color', 'Material', 'Offer']
const sortOptions = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Rating' },
  { value: 'newest', label: 'Newest' },
]

export function SearchHeader({
  searchTerm,
  onSearchChange,
  selectedFilters,
  onFilterChange,
  sortBy,
  onSortChange,
  onShowAllFilters,
}: SearchHeaderProps) {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-16 z-40 bg-white border-b border-sky-blue p-4 space-y-4"
    >
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-teal" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search for products, brands, categories..."
            className="w-full pl-10 pr-4 py-2 rounded-full border border-sky-blue focus:outline-none focus:ring-2 focus:ring-teal bg-beige text-navy"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 rounded-full bg-green text-white font-semibold hover:bg-opacity-90 transition"
        >
          Search
        </motion.button>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {filterOptions.map((filter) => (
          <motion.button
            key={filter}
            whileTap={{ scale: 0.95 }}
            onClick={() => onFilterChange(filter)}
            className={`px-4 py-1 rounded-full whitespace-nowrap font-medium transition ${
              selectedFilters.includes(filter)
                ? 'bg-navy text-white'
                : 'border-2 border-navy text-navy hover:bg-navy hover:text-white'
            }`}
          >
            {filter}
          </motion.button>
        ))}

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onShowAllFilters}
          className="px-4 py-1 rounded-full whitespace-nowrap border-2 border-navy text-navy font-medium hover:bg-navy hover:text-white transition flex items-center gap-2"
        >
          <SlidersHorizontal className="w-4 h-4" />
          All Filters
        </motion.button>
      </div>

      {/* Sort Dropdown */}
      <div className="flex justify-end">
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="px-4 py-2 rounded-lg border border-sky-blue focus:outline-none focus:ring-2 focus:ring-teal bg-beige text-navy font-medium"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </motion.div>
  )
}
