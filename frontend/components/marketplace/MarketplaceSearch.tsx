'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  MapPin, 
  ChevronDown, 
  SlidersHorizontal, 
  Filter,
  X,
  Tag,
  DollarSign
} from 'lucide-react';

interface MarketplaceSearchProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
  selectedRadius: number;
  onRadiusChange: (r: number) => void;
  selectedCondition: string;
  onConditionChange: (cond: string) => void;
  locationName: string;
  onOpenLocationPicker: () => void;
}

const CATEGORIES = [
  'All',
  'Books & Education',
  'Electronics & Gadgets',
  'Home & Kitchen',
  'Tools & Equipment',
  'Clothing & Apparel',
  'Services & Favors',
  'Others',
];

const RADII = [
  { label: 'Within 5 km', value: 5 },
  { label: 'Within 10 km', value: 10 },
  { label: 'Within 25 km', value: 25 },
  { label: 'Within 50 km', value: 50 },
];

const CONDITIONS = [
  'All Conditions',
  'New',
  'Like New',
  'Good',
  'Fair',
];

export default function MarketplaceSearch({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedType,
  onTypeChange,
  selectedRadius,
  onRadiusChange,
  selectedCondition,
  onConditionChange,
  locationName,
  onOpenLocationPicker,
}: MarketplaceSearchProps) {
  const [showExtendedFilters, setShowExtendedFilters] = useState(false);

  return (
    <div className="mb-8 space-y-3">
      {/* Prominent Main Search Bar */}
      <div
        className="p-3 sm:p-4 rounded-3xl flex flex-wrap lg:flex-nowrap items-center gap-3"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-hover)',
        }}
      >
        {/* Search Input */}
        <div className="relative flex-1 min-w-[260px]">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--foreground-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search listings, neighbors, needs, or services..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm font-medium outline-none transition-all"
            style={{
              background: 'var(--surface-1)',
              border: '1px solid var(--border-muted)',
              color: 'var(--foreground)',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Location Picker Trigger */}
        <button
          onClick={onOpenLocationPicker}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-semibold cursor-pointer transition-all hover:scale-[1.02]"
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border-muted)',
            color: 'var(--foreground)',
          }}
        >
          <MapPin size={16} className="text-[var(--accent)]" />
          <span>{locationName || 'Nearby'}</span>
          <ChevronDown size={14} className="opacity-60" />
        </button>

        {/* Category Select */}
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="px-4 py-3 rounded-2xl text-xs font-semibold outline-none cursor-pointer"
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border-muted)',
            color: 'var(--foreground)',
          }}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'All' ? 'All Categories' : cat}
            </option>
          ))}
        </select>

        {/* Distance Select */}
        <select
          value={selectedRadius}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
          className="px-4 py-3 rounded-2xl text-xs font-semibold outline-none cursor-pointer"
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border-muted)',
            color: 'var(--foreground)',
          }}
        >
          {RADII.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

        {/* Intent / Post Type Selector */}
        <select
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value)}
          className="px-4 py-3 rounded-2xl text-xs font-semibold outline-none cursor-pointer"
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border-muted)',
            color: 'var(--foreground)',
          }}
        >
          <option value="all">All Post Types</option>
          <option value="sell">For Sale</option>
          <option value="need">Wants / Needs</option>
          <option value="rent">For Rent</option>
          <option value="exchange">Trade & Swap</option>
          <option value="donate">Free / Donate</option>
          <option value="service">Services Offered</option>
        </select>

        {/* Extended Filter Toggle Button */}
        <button
          onClick={() => setShowExtendedFilters(!showExtendedFilters)}
          className={`flex items-center gap-1.5 px-4 py-3 rounded-2xl text-xs font-bold shrink-0 cursor-pointer transition-all ${
            showExtendedFilters ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface-1)] text-[var(--foreground)] border border-[var(--border-muted)]'
          }`}
        >
          <SlidersHorizontal size={15} />
          <span>Filters</span>
        </button>
      </div>

      {/* Extended Filters Collapsible Bar */}
      {showExtendedFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4 rounded-2xl flex flex-wrap items-center gap-4 text-xs font-medium"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
        >
          {/* Condition Filter */}
          <div className="flex items-center gap-2">
            <span style={{ color: 'var(--foreground-muted)' }}>Condition:</span>
            <select
              value={selectedCondition}
              onChange={(e) => onConditionChange(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs outline-none cursor-pointer font-bold"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            >
              {CONDITIONS.map((cond) => (
                <option key={cond} value={cond}>{cond}</option>
              ))}
            </select>
          </div>

          {/* Reset Filters CTA */}
          <button
            onClick={() => {
              onSearchChange('');
              onCategoryChange('All');
              onTypeChange('all');
              onRadiusChange(10);
              onConditionChange('All Conditions');
            }}
            className="text-xs font-bold text-[var(--accent)] hover:underline ml-auto"
          >
            Reset All Filters
          </button>
        </motion.div>
      )}
    </div>
  );
}
