'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { HeartHandshake, MapPin, Star, MessageSquare } from 'lucide-react';
import { MarketplacePost } from '@/lib/marketplace';

interface ServicesNearbySectionProps {
  posts: MarketplacePost[];
  onSelectPost: (post: MarketplacePost) => void;
  onChatService: (post: MarketplacePost) => void;
}

export default function ServicesNearbySection({
  posts,
  onSelectPost,
  onChatService,
}: ServicesNearbySectionProps) {
  const servicePosts = posts.filter((p) => p.post_type === 'service').slice(0, 4);

  if (servicePosts.length === 0) return null;

  return (
    <div className="mb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--success)] mb-1">
            <HeartHandshake size={16} />
            <span>Local Talents & Skills</span>
          </div>
          <h3 className="font-serif font-bold text-xl sm:text-2xl" style={{ color: 'var(--foreground)' }}>
            Services & Favors Around You
          </h3>
        </div>
        <span className="text-xs font-bold" style={{ color: 'var(--foreground-muted)' }}>
          {servicePosts.length} Active Services
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {servicePosts.map((post) => {
          const ownerName = post.owner_details?.first_name 
            ? `${post.owner_details.first_name} ${post.owner_details.last_name || ''}`.trim()
            : 'Service Provider';

          return (
            <motion.div
              key={post.id}
              whileHover={{ y: -3 }}
              className="p-5 rounded-3xl cursor-pointer flex flex-col justify-between"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-card)',
              }}
              onClick={() => onSelectPost(post)}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={post.owner_details?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(ownerName)}&background=5A7A5E&color=fff`}
                      alt={ownerName}
                      className="w-8 h-8 rounded-full object-cover border border-[var(--border)]"
                    />
                    <div>
                      <h5 className="text-xs font-bold truncate max-w-[100px]" style={{ color: 'var(--foreground)' }}>
                        {ownerName}
                      </h5>
                      <span className="text-[10px] text-[var(--success)] font-semibold">Verified Provider</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-semibold text-[var(--warning)]">
                    <Star size={12} className="fill-current" />
                    <span>4.9</span>
                  </div>
                </div>

                <h4 className="font-bold text-base line-clamp-1 mb-1" style={{ color: 'var(--foreground)' }}>
                  {post.title}
                </h4>
                <p className="text-xs line-clamp-2 mb-3 leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>
                  {post.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[var(--border-muted)] flex items-center justify-between">
                <div>
                  <span className="text-[10px] block uppercase" style={{ color: 'var(--foreground-muted)' }}>Rate</span>
                  <strong className="font-serif font-bold text-base" style={{ color: 'var(--foreground)' }}>
                    ₹{Number(post.price || 500).toLocaleString()}
                  </strong>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onChatService(post);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all hover:scale-105"
                  style={{
                    background: 'var(--success)',
                    color: '#FFFDF8',
                  }}
                >
                  <MessageSquare size={13} />
                  <span>Book Service</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
