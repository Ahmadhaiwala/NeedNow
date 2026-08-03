'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { MarketplacePost } from '@/lib/marketplace';
import HumanListingCard from './HumanListingCard';

interface ListingCarouselProps {
  title: string;
  subtitle?: string;
  badgeText?: string;
  badgeIcon?: React.ElementType;
  posts: MarketplacePost[];
  savedPostIds: number[];
  onToggleSave: (post: MarketplacePost) => void;
  onSelectPost: (post: MarketplacePost) => void;
  onMakeOffer: (post: MarketplacePost) => void;
  onChat: (post: MarketplacePost) => void;
  loading?: boolean;
}

export default function ListingCarousel({
  title,
  subtitle,
  badgeText,
  badgeIcon: BadgeIcon,
  posts,
  savedPostIds,
  onToggleSave,
  onSelectPost,
  onMakeOffer,
  onChat,
  loading = false,
}: ListingCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!loading && posts.length === 0) return null;

  return (
    <section className="mb-8">
      {/* Section Header */}
      <div className="flex items-end justify-between mb-4 px-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {badgeText && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
                {BadgeIcon && <BadgeIcon size={12} />}
                {badgeText}
              </span>
            )}
          </div>
          <h2 className="font-serif font-extrabold text-xl sm:text-2xl tracking-tight" style={{ color: 'var(--foreground)' }}>
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--foreground-muted)' }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Carousel Arrow Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-105"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            aria-label="Scroll left"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-105"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            aria-label="Scroll right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Carousel Container */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-4 overflow-x-auto scrollbar-none py-2 px-1 scroll-smooth snap-x snap-mandatory"
      >
        {loading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="w-[280px] sm:w-[300px] h-[320px] rounded-3xl animate-pulse shrink-0"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border-muted)' }}
            />
          ))
        ) : (
          posts.map((post) => (
            <div key={post.id} className="w-[280px] sm:w-[310px] shrink-0 snap-start">
              <HumanListingCard
                post={post}
                isSaved={savedPostIds.includes(post.id)}
                onSave={onToggleSave}
                onSelect={onSelectPost}
                onMakeOffer={onMakeOffer}
                onChat={onChat}
              />
            </div>
          ))
        )}
      </div>
    </section>
  );
}
