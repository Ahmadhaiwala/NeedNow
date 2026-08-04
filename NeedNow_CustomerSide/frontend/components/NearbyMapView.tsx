'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Compass, Sliders, ChevronRight } from 'lucide-react';
import { MarketplacePost, getNearbyPosts } from '@/lib/marketplace';
import MarketplaceCard from '@/components/MarketplaceCard';

interface NearbyMapViewProps {
  userLat: number;
  userLng: number;
  userLocationName: string;
  onSelectPost?: (post: MarketplacePost) => void;
}

export default function NearbyMapView({
  userLat,
  userLng,
  userLocationName,
  onSelectPost,
}: NearbyMapViewProps) {
  const [radius, setRadius] = useState<number>(10);
  const [nearbyPosts, setNearbyPosts] = useState<MarketplacePost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getNearbyPosts(userLat, userLng, radius)
      .then((data) => {
        setNearbyPosts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userLat, userLng, radius]);

  return (
    <div className="space-y-6">
      {/* Header & Radius Control */}
      <div className="p-6 rounded-3xl flex flex-wrap items-center justify-between gap-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent)] mb-1">
            <Compass size={16} />
            <span>Geo-Discovery</span>
          </div>
          <h2 className="font-serif font-extrabold text-2xl" style={{ color: 'var(--foreground)' }}>
            Explore Nearby Listings around {userLocationName}
          </h2>
          <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
            Find items, swaps, and services within driving or walking distance.
          </p>
        </div>

        {/* Radius Slider */}
        <div className="flex items-center gap-3 bg-[var(--surface-2)] p-3 rounded-2xl border border-[var(--border)]">
          <span className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>Search Radius:</span>
          <input
            type="range"
            min={1}
            max={50}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="accent-[var(--accent)] cursor-pointer"
          />
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-[var(--accent-muted)] text-[var(--accent)]">
            {radius} km
          </span>
        </div>
      </div>

      {/* Map Graphic Container & Listing Overlay Grid matching Inspiration */}
      <div className="relative min-h-[380px] rounded-3xl overflow-hidden border border-[var(--border)] p-6 flex flex-col justify-end bg-slate-900/10">
        <img
          src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1400&q=80"
          alt="Map Background"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1F1712] via-[#1F1712]/50 to-transparent" />

        {/* Center Pulse Pin */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-[var(--accent)]/30 animate-ping absolute" />
          <div className="w-10 h-10 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shadow-lg relative z-10">
            <MapPin size={20} />
          </div>
          <span className="mt-2 px-3 py-1 rounded-full bg-black/80 text-white text-xs font-bold backdrop-blur-md">
            {userLocationName} ({radius} km)
          </span>
        </div>
      </div>

      {/* Nearby Listings Cards Grid */}
      <div>
        <h3 className="font-serif font-bold text-xl mb-4" style={{ color: 'var(--foreground)' }}>
          Listings Near You ({nearbyPosts.length})
        </h3>

        {loading ? (
          <p className="text-xs text-center py-8" style={{ color: 'var(--foreground-muted)' }}>Searching nearby radius...</p>
        ) : nearbyPosts.length === 0 ? (
          <p className="text-xs text-center py-8" style={{ color: 'var(--foreground-muted)' }}>No nearby listings found within {radius} km.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {nearbyPosts.map((post) => (
              <MarketplaceCard
                key={post.id}
                post={post}
                onSelect={(p) => onSelectPost?.(p)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
