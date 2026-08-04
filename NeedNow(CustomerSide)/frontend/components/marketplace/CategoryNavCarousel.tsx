'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  BookOpen, 
  Laptop, 
  Home, 
  Wrench, 
  Shirt, 
  Briefcase, 
  Gift, 
  Grid,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface CategoryNavCarouselProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const CATEGORY_ITEMS = [
  { id: 'All', label: 'All Items', icon: Grid },
  { id: 'Electronics & Gadgets', label: 'Electronics', icon: Laptop },
  { id: 'Home & Kitchen', label: 'Home & Living', icon: Home },
  { id: 'Tools & Equipment', label: 'Tools', icon: Wrench },
  { id: 'Books & Education', label: 'Books', icon: BookOpen },
  { id: 'Clothing & Apparel', label: 'Apparel', icon: Shirt },
  { id: 'Services & Favors', label: 'Services', icon: Briefcase },
  { id: 'Others', label: 'Others', icon: Sparkles },
];

export default function CategoryNavCarousel({
  selectedCategory,
  onSelectCategory,
}: CategoryNavCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group/nav mb-6">
      {/* Scroll Left Button */}
      <button
        onClick={() => scroll('left')}
        className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-8 h-8 rounded-full items-center justify-center shadow-lg transition-all opacity-0 group-hover/nav:opacity-100 cursor-pointer"
        style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
        aria-label="Scroll left"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Scroll Right Button */}
      <button
        onClick={() => scroll('right')}
        className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-8 h-8 rounded-full items-center justify-center shadow-lg transition-all opacity-0 group-hover/nav:opacity-100 cursor-pointer"
        style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
        aria-label="Scroll right"
      >
        <ChevronRight size={16} />
      </button>

      {/* Scroll Container */}
      <div
        ref={scrollRef}
        className="flex items-center gap-2.5 overflow-x-auto scrollbar-none py-1 px-1 scroll-smooth"
      >
        {CATEGORY_ITEMS.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;

          return (
            <motion.button
              key={cat.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all duration-200 shrink-0 ${
                isSelected
                  ? 'bg-[var(--accent)] text-white shadow-md'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]'
              }`}
              style={{
                background: isSelected ? 'var(--accent)' : 'var(--surface-1)',
                border: isSelected ? '1px solid transparent' : '1px solid var(--border-muted)',
              }}
            >
              <Icon size={15} className={isSelected ? 'text-white' : 'text-[var(--accent)]'} />
              <span>{cat.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
