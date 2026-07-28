'use client';

import React, { useEffect, useState } from 'react';
import { Star, X, User, Loader2, MessageSquare } from 'lucide-react';
import { getReviews, MarketplaceReview } from '@/lib/marketplace';

interface UserReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  userName?: string;
  myReviews?: boolean;
}

export default function UserReviewsModal({
  isOpen,
  onClose,
  userId,
  userName = 'User',
  myReviews = false,
}: UserReviewsModalProps) {
  const [reviews, setReviews] = useState<MarketplaceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const cacheKey = `user_reviews_cache_${myReviews ? 'me' : userId || 'user'}`;
      if (typeof window !== 'undefined') {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          try {
            setReviews(JSON.parse(cached));
            setLoading(false);
          } catch (e) {}
        } else {
          setLoading(true);
        }
      }
      fetchUserReviews(cacheKey);
    }
  }, [isOpen, userId, myReviews]);

  const fetchUserReviews = async (cacheKey: string) => {
    setError(null);
    try {
      const data = await getReviews({
        user_id: userId,
        my_reviews: myReviews,
      });
      setReviews(data || []);
      if (data && typeof window !== 'undefined') {
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
      }
    } catch (err: any) {
      console.error('Error fetching reviews:', err);
      setError('Could not load reviews.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 sm:p-8 relative my-auto scrollbar-thin"
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-modal)',
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-[var(--radius-sm)] bg-[rgba(202,206,0,0.12)]">
              <Star className="w-5 h-5 text-[#FFC107] fill-[#FFC107]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                {myReviews ? 'My Ratings & Reviews' : `${userName}'s Reviews`}
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Community feedback and deal reputation
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[var(--bg-page)] text-[var(--text-secondary)] transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Rating Summary Card */}
        <div className="p-4 mb-6 rounded-[var(--radius-md)] bg-[var(--bg-page)] border border-[rgba(31,54,53,0.06)] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-[var(--text-primary)]">{avgRating}</span>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    className={
                      star <= Math.round(Number(avgRating))
                        ? 'fill-[#FFC107] text-[#FFC107]'
                        : 'text-gray-300'
                    }
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Overall rating score</p>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-[var(--color-juice)]">{reviews.length}</span>
            <p className="text-xs text-[var(--text-secondary)]">Total Reviews</p>
          </div>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-juice)]" />
            <p className="text-xs text-[var(--text-secondary)]">Loading reviews...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-xs font-semibold rounded-[var(--radius-sm)] bg-[rgba(231,63,60,0.12)] text-[var(--color-heat)] text-center">
            {error}
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-12 text-center text-[var(--text-secondary)]">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40 text-[var(--color-sky)]" />
            <p className="text-sm font-semibold">No reviews yet</p>
            <p className="text-xs mt-1">Complete deals with neighbors to build community ratings!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {reviews.map((rev) => (
              <div 
                key={rev.id} 
                className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-page)] border border-[rgba(31,54,53,0.06)] flex flex-col gap-2"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[rgba(31,54,53,0.08)] flex items-center justify-center font-bold text-xs text-[var(--text-primary)]">
                      {rev.reviewer_details?.first_name ? rev.reviewer_details.first_name[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--text-primary)]">
                        {rev.reviewer_details?.display_name || rev.reviewer_details?.first_name || 'Neighbor'}
                      </p>
                      <p className="text-[10px] text-[var(--text-secondary)]">
                        {new Date(rev.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={14}
                        className={
                          star <= rev.rating ? 'fill-[#FFC107] text-[#FFC107]' : 'text-gray-300'
                        }
                      />
                    ))}
                  </div>
                </div>
                {rev.comment && (
                  <p className="text-xs leading-relaxed text-[var(--text-primary)] italic bg-[var(--bg-surface)] p-2.5 rounded-[var(--radius-sm)] border border-[rgba(31,54,53,0.04)]">
                    "{rev.comment}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
