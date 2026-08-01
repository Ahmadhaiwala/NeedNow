'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  ShieldCheck, 
  MapPin, 
  Search, 
  ChevronDown, 
  SlidersHorizontal,
  Users,
  HeartHandshake
} from 'lucide-react';

interface CommunityHeroProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
  selectedRadius: number;
  onRadiusChange: (r: number) => void;
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

export default function CommunityHero({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedType,
  onTypeChange,
  selectedRadius,
  onRadiusChange,
  locationName,
  onOpenLocationPicker,
}: CommunityHeroProps) {
  return (
    <div className="mb-10">
      {/* Top Hero Section: People-Centric Community Headline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-6">
        
        {/* Left Column: Editorial Headline & Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-7 flex flex-col justify-between p-8 sm:p-12 relative overflow-hidden rounded-3xl"
          style={{
            background: 'var(--surface-1)',
            boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--border)',
          }}
        >
          <div>
            {/* Community Pill Badge */}
            <div className="flex items-center gap-2 mb-4">
              <span
                className="px-3.5 py-1 font-semibold rounded-full uppercase tracking-wider text-[11px] flex items-center gap-1.5"
                style={{
                  background: 'rgba(160, 98, 60, 0.12)',
                  color: 'var(--accent)',
                }}
              >
                <Users size={12} />
                NeedNow Local Community
              </span>
            </div>

            <h1
              className="font-serif font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.1] mb-4"
              style={{ color: 'var(--foreground)' }}
            >
              Buy. Sell. Trade.<br />
              <span className="italic font-normal" style={{ color: 'var(--accent)' }}>
                Connect locally.
              </span>
            </h1>

            <p
              className="font-serif italic text-xl sm:text-2xl mb-4 font-normal"
              style={{ color: 'var(--foreground-muted)' }}
            >
              Everything around you, directly from your neighbors.
            </p>

            <p
              className="text-sm sm:text-base max-w-lg leading-relaxed mb-6"
              style={{ color: 'var(--foreground-muted)' }}
            >
              Join thousands of verified neighbors buying, selling, renting, and sharing skills locally with 100% trust scores.
            </p>
          </div>

          {/* Location Badge & Distance Selector */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[var(--border-muted)]">
            <button
              onClick={onOpenLocationPicker}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold cursor-pointer transition-all hover:scale-[1.02]"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            >
              <MapPin size={14} className="text-[var(--accent)]" />
              <span>{locationName || 'Set Location'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
                Change
              </span>
            </button>

            <div className="text-xs font-medium" style={{ color: 'var(--foreground-muted)' }}>
              Showing items within <strong style={{ color: 'var(--foreground)' }}>{selectedRadius} km</strong>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Warm People-Centric Community Photo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="lg:col-span-5 relative min-h-[340px] rounded-3xl overflow-hidden shadow-card"
          style={{ border: '1px solid var(--border)' }}
        >
          <img
            src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80"
            alt="NeedNow Local Community Members"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to top, rgba(27, 21, 16, 0.8) 0%, rgba(27, 21, 16, 0.15) 60%)',
            }}
          />

          {/* Floating Trusted Community Badge Overlay */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="absolute bottom-5 left-5 right-5 p-4 rounded-2xl backdrop-blur-md"
            style={{
              background: 'rgba(33, 25, 20, 0.88)',
              border: '1px solid rgba(217, 186, 131, 0.3)',
              color: '#FFF9EF',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#D4A574] mb-1">
                  <ShieldCheck size={15} />
                  <span>Trusted Community</span>
                </div>
                <p className="text-sm font-bold">100% Verified Neighbor Profiles</p>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end -space-x-2 mb-1">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" className="w-6 h-6 rounded-full border-2 border-[#1F1712]" alt="User" />
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" className="w-6 h-6 rounded-full border-2 border-[#1F1712]" alt="User" />
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" className="w-6 h-6 rounded-full border-2 border-[#1F1712]" alt="User" />
                </div>
                <span className="text-[11px] opacity-80" style={{ color: '#E5DED5' }}>
                  2,400+ Active Neighbors
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Community Search & Filter Bar */}
      <div
        className="p-3 sm:p-4 rounded-2xl flex flex-wrap lg:flex-nowrap items-center gap-3"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-hover)',
        }}
      >
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--foreground-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search local listings, neighbors, or needs..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{
              background: 'var(--surface-1)',
              border: '1px solid var(--border-muted)',
              color: 'var(--foreground)',
            }}
          />
        </div>

        {/* Location Trigger */}
        <button
          onClick={onOpenLocationPicker}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all"
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border-muted)',
            color: 'var(--foreground)',
          }}
        >
          <MapPin size={15} className="text-[var(--accent)]" />
          <span>Nearby</span>
          <ChevronDown size={14} className="opacity-60" />
        </button>

        {/* Category Select */}
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl text-xs font-medium outline-none cursor-pointer"
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
          className="px-3.5 py-2.5 rounded-xl text-xs font-medium outline-none cursor-pointer"
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

        {/* Post Type Selector */}
        <select
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl text-xs font-medium outline-none cursor-pointer"
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border-muted)',
            color: 'var(--foreground)',
          }}
        >
          <option value="all">All Intent Types</option>
          <option value="sell">For Sale</option>
          <option value="need">Wants / Needs</option>
          <option value="rent">For Rent</option>
          <option value="exchange">Trade & Swap</option>
          <option value="donate">Free / Donate</option>
          <option value="service">Services Offered</option>
        </select>

        {/* Filters Badge */}
        <div
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
          style={{
            background: 'var(--accent)',
            color: 'var(--accent-foreground)',
          }}
        >
          <SlidersHorizontal size={15} />
          <span>Filters</span>
        </div>
      </div>
    </div>
  );
}
