'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ShieldCheck, 
  Star, 
  MessageSquare, 
  Loader2,
  Package,
  CheckCircle2
} from 'lucide-react';
import { 
  MarketplaceUser, 
  MarketplacePost, 
  MarketplaceReview, 
  ReviewSummary,
  getUserPosts, 
  getReviews, 
  getReviewSummary 
} from '@/lib/marketplace';
import MarketplaceCard from '@/components/MarketplaceCard';

interface SellerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  seller: MarketplaceUser;
  onSelectPost?: (post: MarketplacePost) => void;
  onChat?: (sellerId: string, sellerName: string) => void;
}

export default function SellerProfileModal({
  isOpen,
  onClose,
  seller,
  onSelectPost,
  onChat,
}: SellerProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'listings' | 'reviews' | 'completed' | 'about'>('listings');
  const [sellerPosts, setSellerPosts] = useState<MarketplacePost[]>([]);
  const [completedPosts, setCompletedPosts] = useState<MarketplacePost[]>([]);
  const [reviews, setReviews] = useState<MarketplaceReview[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && seller?.id) {
      setLoading(true);
      Promise.all([
        getUserPosts(seller.id, 'active').catch(() => []),
        getUserPosts(seller.id, 'completed').catch(() => []),
        getReviews({ user_id: seller.id }).catch(() => []),
        getReviewSummary(seller.id).catch(() => null),
      ]).then(([active, completed, revs, sum]) => {
        setSellerPosts(active);
        setCompletedPosts(completed);
        setReviews(revs);
        setSummary(sum);
        setLoading(false);
      });
    }
  }, [isOpen, seller]);

  if (!isOpen || !seller) return null;

  const sellerName = `${seller.first_name || ''} ${seller.last_name || ''}`.trim() || seller.email.split('@')[0];
  const isVerified = summary?.is_verified ?? false;
  const totalReviews = summary?.total_reviews ?? (seller.review_count || reviews.length || 0);
  const avgRating = summary?.average_rating ?? (seller.rating || 0);
  const trustScore = summary?.trust_score ?? null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl flex flex-col z-10 shadow-modal"
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border)',
          }}
        >
          {/* Header Banner */}
          <div className="relative h-32 bg-gradient-to-r from-[#A0623C] to-[#5A7A5E] shrink-0 p-6 flex justify-end items-start">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-md cursor-pointer hover:bg-black/60 transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Profile Header Card */}
          <div className="px-6 sm:px-8 pb-4 relative shrink-0 -mt-12">
            <div className="flex flex-wrap sm:flex-nowrap items-end justify-between gap-4 mb-4">
              <div className="flex items-end gap-4">
                <img
                  src={seller.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(sellerName)}&background=A0623C&color=fff`}
                  alt={sellerName}
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-[var(--surface-1)] shadow-md"
                />
                <div className="mb-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif font-extrabold text-2xl" style={{ color: 'var(--foreground)' }}>
                      {sellerName}
                    </h2>
                    {isVerified && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1" style={{ background: 'rgba(90, 122, 94, 0.15)', color: 'var(--success)' }}>
                        <ShieldCheck size={14} /> Verified Seller
                      </span>
                    )}
                  </div>
                  <div className="text-xs flex items-center gap-2 mt-1" style={{ color: 'var(--foreground-muted)' }}>
                    <span>Community Seller</span>
                    {totalReviews > 0 && avgRating > 0 && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-[var(--warning)] font-semibold">
                          <Star size={13} className="fill-current" /> {avgRating.toFixed(1)} ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Chat CTA Button */}
              <button
                onClick={() => {
                  onClose();
                  onChat?.(seller.id, sellerName);
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
                style={{
                  background: 'var(--accent)',
                  color: 'var(--accent-foreground)',
                }}
              >
                <MessageSquare size={15} />
                <span>Message Seller</span>
              </button>
            </div>

            {/* Performance Metrics Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <div className="text-center">
                <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Active Listings</p>
                <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                  {loading ? '...' : sellerPosts.length}
                </p>
              </div>
              <div className="text-center border-l border-[var(--border-muted)]">
                <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Completed Deals</p>
                <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                  {loading ? '...' : completedPosts.length}
                </p>
              </div>
              <div className="text-center border-l border-[var(--border-muted)]">
                <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Response Rate</p>
                <p className="text-lg font-bold" style={{ color: 'var(--foreground-muted)' }}>--</p>
              </div>
              <div className="text-center border-l border-[var(--border-muted)]">
                <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Trust Score</p>
                <p className="text-lg font-bold" style={{ color: trustScore ? 'var(--accent)' : 'var(--foreground-muted)' }}>
                  {trustScore ? `${trustScore} / 100` : '--'}
                </p>
              </div>
            </div>

            {/* Tabs Header */}
            <div className="flex items-center gap-6 mt-6 border-b border-[var(--border-muted)] text-sm font-semibold">
              <button
                onClick={() => setActiveTab('listings')}
                className={`pb-3 border-b-2 cursor-pointer transition-colors ${activeTab === 'listings' ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-[var(--foreground-muted)]'}`}
              >
                Listings ({sellerPosts.length})
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`pb-3 border-b-2 cursor-pointer transition-colors ${activeTab === 'reviews' ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-[var(--foreground-muted)]'}`}
              >
                {totalReviews > 0 ? `Reviews (${totalReviews})` : 'Reviews'}
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`pb-3 border-b-2 cursor-pointer transition-colors ${activeTab === 'completed' ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-[var(--foreground-muted)]'}`}
              >
                Completed ({completedPosts.length})
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`pb-3 border-b-2 cursor-pointer transition-colors ${activeTab === 'about' ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-[var(--foreground-muted)]'}`}
              >
                About
              </button>
            </div>
          </div>

          {/* Scrollable Tab Content Area */}
          <div className="p-6 sm:p-8 overflow-y-auto flex-1">
            {loading ? (
              <div className="py-12 text-center">
                <Loader2 className="animate-spin mx-auto text-[var(--accent)] mb-2" size={24} />
                <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Loading seller details...</p>
              </div>
            ) : (
              <>
                {/* Active Listings Tab */}
                {activeTab === 'listings' && (
                  <div>
                    {sellerPosts.length === 0 ? (
                      <p className="text-sm text-center py-8" style={{ color: 'var(--foreground-muted)' }}>
                        No active listings available.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sellerPosts.map((post) => (
                          <MarketplaceCard
                            key={post.id}
                            post={post}
                            onSelect={(p) => {
                              onClose();
                              onSelectPost?.(p);
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                  <div className="space-y-4">
                    {/* Optional Breakdown if summary & reviews exist */}
                    {summary && summary.total_reviews > 0 && summary.rating_distribution && (
                      <div className="p-4 rounded-2xl mb-4 flex items-center justify-between" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--foreground-muted)' }}>Average Rating</span>
                          <span className="font-serif font-extrabold text-3xl" style={{ color: 'var(--foreground)' }}>
                            {summary.average_rating.toFixed(1)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold block" style={{ color: 'var(--foreground)' }}>{summary.total_reviews} total reviews</span>
                        </div>
                      </div>
                    )}

                    {reviews.length === 0 ? (
                      <p className="text-sm text-center py-8" style={{ color: 'var(--foreground-muted)' }}>
                        No reviews yet.
                      </p>
                    ) : (
                      reviews.map((rev) => (
                        <div key={rev.id} className="p-4 rounded-2xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <img
                                src={rev.reviewer_details?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(rev.reviewer_details?.email || 'Reviewer')}`}
                                alt="Reviewer"
                                className="w-7 h-7 rounded-full object-cover"
                              />
                              <span className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>
                                {rev.reviewer_details?.first_name || rev.reviewer_details?.email?.split('@')[0] || 'Buyer'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-[var(--warning)] font-bold">
                              <Star size={13} className="fill-current" />
                              <span>{rev.rating}.0</span>
                            </div>
                          </div>
                          {rev.comment && (
                            <p className="text-xs leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>
                              {rev.comment}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Completed Deals Tab */}
                {activeTab === 'completed' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {completedPosts.length === 0 ? (
                      <p className="text-sm text-center py-8 col-span-2" style={{ color: 'var(--foreground-muted)' }}>
                        No completed deal history yet.
                      </p>
                    ) : (
                      completedPosts.map((post) => (
                        <div key={post.id} className="p-4 rounded-2xl flex items-center gap-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                          <img
                            src={typeof post.images?.[0] === 'string' ? post.images[0] : (post.images?.[0] as any)?.image_url || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200'}
                            alt={post.title}
                            className="w-16 h-16 rounded-xl object-cover"
                          />
                          <div>
                            <h4 className="text-sm font-bold truncate" style={{ color: 'var(--foreground)' }}>{post.title}</h4>
                            <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>₹{post.price || post.budget || 'Sold'}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(90, 122, 94, 0.15)', color: 'var(--success)' }}>
                              Completed
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* About Tab */}
                {activeTab === 'about' && (
                  <div className="space-y-4 text-sm" style={{ color: 'var(--foreground-muted)' }}>
                    <div>
                      <h4 className="font-bold text-sm mb-1" style={{ color: 'var(--foreground)' }}>About Seller</h4>
                      <p className="leading-relaxed">
                        Community marketplace seller. Feel free to message for inquiries, offers, or questions.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
