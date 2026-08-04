'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../navbar/Navbar';
import TrustFooter from '@/components/TrustFooter';
import { ProductCard, Product } from '@/components/CategorySection';
import { Search, SlidersHorizontal, Loader2, Package, ArrowUpDown } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  product_count: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'popularity' | 'price_low' | 'price_high' | 'discount'>('popularity');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetch('http://localhost:8000/api/catalog/categories/')
      .then((res) => res.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('page_size', '16');

        if (selectedCategory !== 'all') {
          params.set('category', selectedCategory);
        }
        if (searchQuery.trim()) {
          params.set('search', searchQuery.trim());
        }
        if (inStockOnly) {
          params.set('in_stock', 'true');
        }

        const res = await fetch(`http://localhost:8000/api/catalog/api/products/?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          let items: Product[] = Array.isArray(data) ? data : (data.results ?? []);

          if (sortBy === 'price_low') {
            items.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
          } else if (sortBy === 'price_high') {
            items.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
          } else if (sortBy === 'discount') {
            items.sort((a, b) => parseFloat(b.discount_percentage) - parseFloat(a.discount_percentage));
          }

          setProducts(items);
          setTotalCount(data.count ?? items.length);
          setTotalPages(data.count ? Math.ceil(data.count / 16) : 1);
        }
      } catch (err) {
        console.error('Failed to fetch products catalog:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [selectedCategory, searchQuery, inStockOnly, sortBy, page]);

  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ background: 'var(--bg-page)' }}>
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex-1">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
            Explore Product Catalog
          </h1>
          <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Browse {totalCount > 0 ? totalCount : ''} high-quality products delivered to your doorstep in 30 minutes.
          </p>
        </div>

        {/* Filter & Controls Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sidebar Filters */}
          <div 
            className="lg:col-span-3 p-6 rounded-2xl shadow-card flex flex-col gap-6"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <SlidersHorizontal size={16} style={{ color: 'var(--accent-primary)' }} />
              <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Filters</h3>
            </div>

            {/* Search Input */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Search Products
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="e.g. Earbuds, Milk, Chips..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-8 pr-3 py-2 rounded-xl text-xs outline-none border"
                  style={{
                    background: 'var(--surface-1)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border)',
                  }}
                />
                <Search size={13} className="absolute left-2.5 text-[var(--text-secondary)]" />
              </div>
            </div>

            {/* Categories List */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Categories
              </label>
              <div className="flex flex-col gap-1 max-h-60 overflow-y-auto no-scrollbar">
                <button
                  onClick={() => { setSelectedCategory('all'); setPage(1); }}
                  className="text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex justify-between"
                  style={{
                    background: selectedCategory === 'all' ? 'var(--accent-primary)' : 'transparent',
                    color: selectedCategory === 'all' ? '#FFFDF8' : 'var(--text-primary)',
                  }}
                >
                  <span>All Categories</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.id); setPage(1); }}
                    className="text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex justify-between"
                    style={{
                      background: selectedCategory === cat.id ? 'var(--accent-primary)' : 'transparent',
                      color: selectedCategory === cat.id ? '#FFFDF8' : 'var(--text-primary)',
                    }}
                  >
                    <span>{cat.name}</span>
                    <span className="opacity-60">{cat.product_count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* In Stock Checkbox */}
            <div className="pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer" style={{ color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => { setInStockOnly(e.target.checked); setPage(1); }}
                  className="rounded text-[var(--accent-primary)] focus:ring-0"
                />
                In Stock Only
              </label>
            </div>
          </div>

          {/* Right Product Grid */}
          <div className="lg:col-span-9 flex flex-col gap-6">
            <div 
              className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl shadow-card"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Showing {products.length} of {totalCount} items
              </span>

              <div className="flex items-center gap-2">
                <ArrowUpDown size={13} style={{ color: 'var(--text-secondary)' }} />
                <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold outline-none border cursor-pointer"
                  style={{
                    background: 'var(--bg-page)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <option value="popularity">Popularity</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="discount">Biggest Discount</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="h-64 flex items-center justify-center gap-3 text-xs font-medium text-secondary rounded-3xl bg-[var(--bg-surface)]">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--accent-primary)]" />
                Fetching catalog products...
              </div>
            ) : products.length === 0 ? (
              <div className="p-12 text-center rounded-3xl shadow-card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                <Package size={40} className="mx-auto mb-3 opacity-30 text-[var(--text-secondary)]" />
                <h3 className="font-serif font-bold text-base mb-1" style={{ color: 'var(--text-primary)' }}>No products found</h3>
                <p className="text-xs text-secondary mb-4">Try adjusting your search query or categories.</p>
                <button
                  onClick={() => { setSelectedCategory('all'); setSearchQuery(''); setInStockOnly(false); }}
                  className="px-5 py-2.5 rounded-full font-bold text-xs cursor-pointer shadow-sm"
                  style={{ background: 'var(--accent-primary)', color: '#FFFDF8' }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <AnimatePresence>
                  {products.map((product, idx) => (
                    <ProductCard key={product.id} product={product} index={idx} />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-4 py-1.5 rounded-full text-xs font-bold disabled:opacity-40 cursor-pointer"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
                >
                  Previous
                </button>
                <span className="text-xs font-medium px-3 text-[var(--text-secondary)]">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-4 py-1.5 rounded-full text-xs font-bold disabled:opacity-40 cursor-pointer"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <TrustFooter />
    </div>
  );
}
