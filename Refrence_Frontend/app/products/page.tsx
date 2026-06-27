'use client'

import { useMemo, useState } from 'react'
import { SearchX } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { mockProducts } from '@/lib/mock-data'
import { AnimatedPage } from '@/components/AnimatedPage'
import { SearchHeader } from '@/components/SearchHeader'
import { ActiveFilters } from '@/components/ActiveFilters'
import { ProductCard } from '@/components/ProductCard'
import { CategorySidebar } from '@/components/CategorySidebar'
import { CategoryBanner } from '@/components/CategoryBanner'

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get('category')

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam)
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null)
  const [minRating, setMinRating] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState('relevance')

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let products = mockProducts

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.tags.some((tag) => tag.toLowerCase().includes(term))
      )
    }

    // Category filter
    if (selectedCategory) {
      products = products.filter((p) => p.category === selectedCategory)
    }

    // Price filter
    if (priceRange) {
      products = products.filter((p) => p.price >= priceRange.min && p.price <= priceRange.max)
    }

    // Rating filter
    if (minRating) {
      products = products.filter((p) => p.rating >= minRating)
    }

    // Sort
    switch (sortBy) {
      case 'price_low':
        products.sort((a, b) => a.price - b.price)
        break
      case 'price_high':
        products.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        products.sort((a, b) => b.rating - a.rating)
        break
      case 'newest':
        // Default order is newest
        break
      case 'relevance':
      default:
        // Keep default order
        break
    }

    return products
  }, [searchTerm, selectedCategory, priceRange, minRating, sortBy])

  const handleClearAll = () => {
    setSelectedCategory(null)
    setPriceRange(null)
    setMinRating(null)
    setSearchTerm('')
  }

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-beige pt-20">
        {/* Search Header */}
        <SearchHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedFilters={[]}
          onFilterChange={() => {}}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Category Banner */}
          {selectedCategory && (
            <CategoryBanner
              categoryId={selectedCategory}
              onClose={() => setSelectedCategory(null)}
            />
          )}

          <div className="flex gap-8">
            {/* Sidebar */}
            <div className="hidden lg:block">
              <CategorySidebar
                onCategoryChange={setSelectedCategory}
                onPriceChange={setPriceRange}
                onRatingChange={setMinRating}
              />
            </div>

            {/* Products Section */}
            <div className="flex-1">
              {/* Active Filters */}
              {(selectedCategory || priceRange || minRating || searchTerm) && (
                <div className="mb-6 pb-4 border-b border-sky-blue">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-navy font-bold">Active Filters</h3>
                    <button
                      onClick={handleClearAll}
                      className="text-navy hover:text-green text-sm font-medium transition"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedCategory && (
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className="px-3 py-1 bg-navy text-white rounded-full text-sm font-medium hover:bg-teal transition flex items-center gap-2"
                      >
                        {selectedCategory}
                        <span className="text-xs">✕</span>
                      </button>
                    )}
                    {priceRange && (
                      <button
                        onClick={() => setPriceRange(null)}
                        className="px-3 py-1 bg-navy text-white rounded-full text-sm font-medium hover:bg-teal transition flex items-center gap-2"
                      >
                        ₹{priceRange.min.toLocaleString()} - ₹{priceRange.max.toLocaleString()}
                        <span className="text-xs">✕</span>
                      </button>
                    )}
                    {minRating && (
                      <button
                        onClick={() => setMinRating(null)}
                        className="px-3 py-1 bg-navy text-white rounded-full text-sm font-medium hover:bg-teal transition flex items-center gap-2"
                      >
                        {minRating}+ Stars
                        <span className="text-xs">✕</span>
                      </button>
                    )}
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="px-3 py-1 bg-navy text-white rounded-full text-sm font-medium hover:bg-teal transition flex items-center gap-2"
                      >
                        {searchTerm}
                        <span className="text-xs">✕</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Products Grid */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-16">
                  <SearchX className="w-16 h-16 text-teal mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-navy mb-2">
                    No products found
                  </h2>
                  <p className="text-navy">Try different keywords or filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  )
}
