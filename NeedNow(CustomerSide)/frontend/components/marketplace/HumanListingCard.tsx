'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Star, 
  MessageSquare, 
  Bookmark, 
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { MarketplacePost } from '@/lib/marketplace';

interface HumanListingCardProps {
  post: MarketplacePost;
  onSelect: (post: MarketplacePost) => void;
  onMakeOffer?: (post: MarketplacePost) => void;
  onChat?: (post: MarketplacePost) => void;
  onSave?: (post: MarketplacePost) => void;
  isSaved?: boolean;
}

export default function HumanListingCard({
  post,
  onSelect,
  onMakeOffer,
  onChat,
  onSave,
  isSaved = false,
}: HumanListingCardProps) {
  // Resolve Image
  const imageUrl = React.useMemo(() => {
    if (post.images && post.images.length > 0) {
      const img = post.images[0];
      if (typeof img === 'string') return img;
      if (typeof img === 'object' && (img as any).image_url) return (img as any).image_url;
      if (typeof img === 'object' && (img as any).image) return (img as any).image;
    }
    return 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80';
  }, [post.images]);

  // Format Seller Name
  const ownerName = post.owner_details?.first_name 
    ? `${post.owner_details.first_name} ${post.owner_details.last_name || ''}`.trim()
    : (post.owner_details?.email?.split('@')[0] || 'Community Neighbor');

  const rating = post.owner_details?.rating || 4.8;
  const reviewCount = post.owner_details?.review_count || 14;

  // Price Display
  const priceDisplay = React.useMemo(() => {
    if (post.post_type === 'need' && post.budget) {
      return `Budget ₹${Number(post.budget).toLocaleString()}`;
    }
    if (post.price) {
      return `₹${Number(post.price).toLocaleString()}`;
    }
    if (post.post_type === 'donate') {
      return 'FREE';
    }
    return 'Offer';
  }, [post.post_type, post.price, post.budget]);

  // Distance Text
  const distanceText = post.distance !== undefined
    ? `${post.distance.toFixed(1)} km away`
    : (post.location_name || 'Nearby');

  // Type badge styling
  const typeBadgeStyle = React.useMemo(() => {
    switch (post.post_type) {
      case 'sell':
        return { bg: 'rgba(160, 98, 60, 0.12)', color: 'var(--accent)', label: 'For Sale' };
      case 'need':
        return { bg: 'rgba(90, 123, 142, 0.12)', color: 'var(--info)', label: 'Want / Need' };
      case 'rent':
        return { bg: 'rgba(212, 165, 116, 0.15)', color: 'var(--warning)', label: 'For Rent' };
      case 'exchange':
        return { bg: 'rgba(122, 107, 72, 0.12)', color: '#7A6B48', label: 'Trade & Swap' };
      case 'donate':
        return { bg: 'rgba(90, 122, 94, 0.12)', color: 'var(--success)', label: 'Free / Donate' };
      default:
        return { bg: 'rgba(160, 98, 60, 0.12)', color: 'var(--accent)', label: 'Listing' };
    }
  }, [post.post_type]);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group rounded-3xl overflow-hidden cursor-pointer flex flex-col justify-between"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}
      onClick={() => onSelect(post)}
    >
      {/* Thumbnail Stage */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/5">
        <img
          src={imageUrl}
          alt={post.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Intent Badge Top Left */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span
            className="px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md shadow-sm"
            style={{ background: typeBadgeStyle.bg, color: typeBadgeStyle.color }}
          >
            {typeBadgeStyle.label}
          </span>
          {post.condition && (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-md"
              style={{ background: 'rgba(255, 255, 255, 0.85)', color: 'var(--foreground)' }}
            >
              {post.condition}
            </span>
          )}
        </div>

        {/* Bookmark Trigger Top Right */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSave?.(post);
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all hover:scale-110"
          style={{
            background: isSaved ? 'var(--accent)' : 'rgba(255, 255, 255, 0.85)',
            color: isSaved ? '#FFFDF8' : 'var(--foreground)',
          }}
        >
          <Bookmark size={15} className={isSaved ? 'fill-current' : ''} />
        </button>

        {/* Distance Pill Bottom Left */}
        <div
          className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1 backdrop-blur-md"
          style={{ background: 'rgba(33, 26, 22, 0.78)', color: '#FFF9EF' }}
        >
          <MapPin size={12} className="text-[#D4A574]" />
          <span>{distanceText}</span>
        </div>
      </div>

      {/* Card Content & Human Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Seller Metadata Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <img
                src={post.owner_details?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(ownerName)}&background=A0623C&color=fff`}
                alt={ownerName}
                className="w-7 h-7 rounded-full object-cover border border-[var(--border)]"
              />
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold truncate max-w-[100px]" style={{ color: 'var(--foreground)' }}>
                  {ownerName}
                </span>
                <ShieldCheck size={13} className="text-[var(--success)]" />
              </div>
            </div>

            {/* Rating */}
            {post.owner_details?.review_count && post.owner_details.review_count > 0 ? (
              <div className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: 'var(--warning)' }}>
                <Star size={12} className="fill-current" />
                <span>{Number(post.owner_details.rating || 0).toFixed(1)}</span>
                <span className="text-[10px]" style={{ color: 'var(--foreground-muted)' }}>
                  ({post.owner_details.review_count})
                </span>
              </div>
            ) : null}
          </div>

          {/* Title */}
          <h3 className="font-sans font-bold text-base line-clamp-1 mb-1 group-hover:text-[var(--accent)] transition-colors" style={{ color: 'var(--foreground)' }}>
            {post.title}
          </h3>

          {/* Category */}
          <p className="text-xs mb-3 truncate" style={{ color: 'var(--foreground-muted)' }}>
            {post.category}
          </p>
        </div>

        {/* Price & Action Footer */}
        <div className="pt-3 border-t border-[var(--border-muted)] flex items-center justify-between">
          <div className="font-serif font-extrabold text-lg" style={{ color: 'var(--foreground)' }}>
            {priceDisplay}
          </div>

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {/* Direct Chat Button */}
            <button
              onClick={() => onChat?.(post)}
              className="p-2 rounded-xl transition-all cursor-pointer hover:scale-105"
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
              title="Chat with neighbor"
            >
              <MessageSquare size={15} />
            </button>

            {/* Make Offer Button */}
            <button
              onClick={() => onMakeOffer?.(post)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer hover:scale-105 flex items-center gap-1"
              style={{
                background: 'var(--accent)',
                color: 'var(--accent-foreground)',
              }}
            >
              <span>Make Offer</span>
              <ArrowUpRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
