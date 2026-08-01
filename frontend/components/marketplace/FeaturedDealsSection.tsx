'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Tag, Sparkles, ArrowUpRight, Gift, Percent } from 'lucide-react';
import { MarketplacePost } from '@/lib/marketplace';

interface FeaturedDealsSectionProps {
  posts: MarketplacePost[];
  onSelectPost: (post: MarketplacePost) => void;
  onMakeOffer: (post: MarketplacePost) => void;
}

export default function FeaturedDealsSection({
  posts,
  onSelectPost,
  onMakeOffer,
}: FeaturedDealsSectionProps) {
  // Filter deal posts (e.g. free, donate, or low price items)
  const dealPosts = React.useMemo(() => {
    return posts.filter(
      (p) => p.post_type === 'donate' || p.post_type === 'rent' || (p.price && Number(p.price) > 0)
    ).slice(0, 3);
  }, [posts]);

  if (dealPosts.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'rgba(160, 98, 60, 0.15)', color: 'var(--accent)' }}>
            <Percent size={15} />
          </div>
          <div>
            <h2 className="font-serif font-extrabold text-xl sm:text-2xl tracking-tight" style={{ color: 'var(--foreground)' }}>
              Featured & Limited Time Deals
            </h2>
            <p className="text-xs font-medium" style={{ color: 'var(--foreground-muted)' }}>
              Direct neighbor offerings with competitive prices and free donations.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {dealPosts.map((post) => {
          const imageUrl =
            post.images && post.images.length > 0
              ? typeof post.images[0] === 'string'
                ? post.images[0]
                : (post.images[0] as any).image_url || (post.images[0] as any).image
              : 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80';

          const badgeLabel = post.post_type === 'donate' ? 'FREE DONATION' : post.post_type === 'rent' ? 'RENTAL DEAL' : 'BEST VALUE';

          return (
            <motion.div
              key={post.id}
              whileHover={{ y: -3 }}
              onClick={() => onSelectPost(post)}
              className="p-4 rounded-3xl cursor-pointer flex items-center gap-4 transition-all"
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 relative bg-black/10">
                <img src={imageUrl} alt={post.title} className="w-full h-full object-cover" />
                <span
                  className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-white"
                  style={{ background: 'var(--accent)' }}
                >
                  {badgeLabel}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider">
                  {post.category}
                </span>
                <h3 className="font-bold text-sm line-clamp-1 mt-0.5" style={{ color: 'var(--foreground)' }}>
                  {post.title}
                </h3>
                <p className="text-xs line-clamp-1 mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
                  {post.location_name || 'Downtown'}
                </p>

                <div className="mt-2 flex items-center justify-between">
                  <span className="font-serif font-extrabold text-base" style={{ color: 'var(--foreground)' }}>
                    {post.post_type === 'donate' ? 'FREE' : post.price ? `₹${Number(post.price).toLocaleString()}` : 'Offer'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMakeOffer(post);
                    }}
                    className="p-1.5 rounded-xl cursor-pointer transition-all hover:scale-105"
                    style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}
                  >
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
