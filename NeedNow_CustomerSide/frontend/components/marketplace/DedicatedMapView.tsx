'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Compass, Sliders, Search, Layers, Navigation } from 'lucide-react';
import { MarketplacePost, getNearbyPosts } from '@/lib/marketplace';
import HumanListingCard from '@/components/marketplace/HumanListingCard';

interface DedicatedMapViewProps {
  userLat: number | null;
  userLng: number | null;
  userLocationName: string;
  onSelectPost: (post: MarketplacePost) => void;
  onMakeOffer?: (post: MarketplacePost) => void;
  onChat?: (post: MarketplacePost) => void;
}

export default function DedicatedMapView({
  userLat,
  userLng,
  userLocationName,
  onSelectPost,
  onMakeOffer,
  onChat,
}: DedicatedMapViewProps) {
  const [radius, setRadius] = useState<number>(10);
  const [nearbyPosts, setNearbyPosts] = useState<MarketplacePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPinPost, setSelectedPinPost] = useState<MarketplacePost | null>(null);

  useEffect(() => {
    setLoading(true);
    getNearbyPosts(userLat, userLng, radius)
      .then((data) => {
        setNearbyPosts(data);
        if (data.length > 0) setSelectedPinPost(data[0]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userLat, userLng, radius]);

  return (
    <div className="space-y-6">
      {/* Top Header & Radius Control */}
      <div className="p-6 rounded-3xl flex flex-wrap items-center justify-between gap-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent)] mb-1">
            <Compass size={16} />
            <span>Dedicated Geo-Discovery</span>
          </div>
          <h2 className="font-serif font-extrabold text-2xl sm:text-3xl" style={{ color: 'var(--foreground)' }}>
            Nearby Community Map around {userLocationName}
          </h2>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--foreground-muted)' }}>
            Explore items, needs, and services within driving or walking distance.
          </p>
        </div>

        {/* Radius Slider Pill */}
        <div className="flex items-center gap-3 bg-[var(--surface-2)] p-3 rounded-2xl border border-[var(--border)]">
          <span className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>Radius:</span>
          <input
            type="range"
            min={1}
            max={50}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="accent-[var(--accent)] cursor-pointer"
          />
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[var(--accent-muted)] text-[var(--accent)]">
            {radius} km
          </span>
        </div>
      </div>

      {/* Split Layout: Interactive Map (Left) + Listing Cards Feed (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px] items-stretch">
        
        {/* Left Column: Map Canvas Container */}
        <div className="lg:col-span-7 relative rounded-3xl overflow-hidden border border-[var(--border)] shadow-card flex flex-col justify-end bg-slate-900/10 min-h-[400px]">
          <img
            src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1400&q=80"
            alt="Map Canvas"
            className="absolute inset-0 w-full h-full object-cover opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1F1712] via-transparent to-transparent" />

          {/* Map Location Badge Controls */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-black/75 text-white backdrop-blur-md flex items-center gap-1.5 shadow-md">
              <Navigation size={14} className="text-[var(--accent)]" />
              {userLocationName} ({radius} km)
            </span>
          </div>

          {/* Center User Location Pin */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-[var(--accent)]/30 animate-ping absolute" />
            <div className="w-10 h-10 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shadow-lg relative z-10">
              <MapPin size={20} />
            </div>
          </div>

          {/* Selected Pin Post Preview Card overlay */}
          {selectedPinPost && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative z-10 m-4 p-4 rounded-2xl backdrop-blur-md flex items-center justify-between gap-4"
              style={{
                background: 'rgba(33, 26, 22, 0.92)',
                border: '1px solid rgba(217, 186, 131, 0.3)',
                color: '#FFF9EF',
              }}
            >
              <div className="flex items-center gap-3">
                <img
                  src={
                    typeof selectedPinPost.images?.[0] === 'string'
                      ? selectedPinPost.images[0]
                      : (selectedPinPost.images?.[0] as any)?.image_url || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200'
                  }
                  alt={selectedPinPost.title}
                  className="w-14 h-14 rounded-xl object-cover"
                />
                <div>
                  <h4 className="font-bold text-sm truncate max-w-[180px]">{selectedPinPost.title}</h4>
                  <p className="text-xs text-[#D4A574]">₹{selectedPinPost.price || selectedPinPost.budget || 'Free'}</p>
                </div>
              </div>

              <button
                onClick={() => onSelectPost(selectedPinPost)}
                className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                style={{ background: 'var(--accent)', color: '#FFF' }}
              >
                Inspect
              </button>
            </motion.div>
          )}
        </div>

        {/* Right Column: Listing Cards Feed */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-serif font-bold text-xl" style={{ color: 'var(--foreground)' }}>
              Nearby Feed ({nearbyPosts.length})
            </h3>
            <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
              Within {radius} km radius
            </span>
          </div>

          {loading ? (
            <p className="text-xs text-center py-12" style={{ color: 'var(--foreground-muted)' }}>
              Loading nearby listings...
            </p>
          ) : nearbyPosts.length === 0 ? (
            <div className="p-8 text-center rounded-3xl" style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
              <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                No nearby listings found within {radius} km. Try increasing the search radius slider!
              </p>
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto max-h-[560px] pr-1">
              {nearbyPosts.map((post) => (
                <div key={post.id} onClick={() => setSelectedPinPost(post)}>
                  <HumanListingCard
                    post={post}
                    onSelect={onSelectPost}
                    onMakeOffer={onMakeOffer}
                    onChat={onChat}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
