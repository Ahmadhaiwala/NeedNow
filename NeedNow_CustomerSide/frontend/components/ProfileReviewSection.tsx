'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Star,
  ShieldCheck,
  MessageSquare,
  Loader2,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { getReviews, getReviewSummary, MarketplaceReview, ReviewSummary } from '@/lib/marketplace';
import UserReviewsModal from '@/components/UserReviewsModal';

// ─── Star Row ────────────────────────────────────────────────────────────────

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={13}
          className={
            star <= rating
              ? 'fill-[var(--warning,#f59e0b)] text-[var(--warning,#f59e0b)]'
              : 'text-gray-300 dark:text-gray-600'
          }
        />
      ))}
    </div>
  );
}

// ─── Distribution Bar ────────────────────────────────────────────────────────

function DistributionBar({
  star,
  count,
  total,
}: {
  star: number;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2.5 text-xs">
      <span
        className="w-5 text-right font-semibold shrink-0"
        style={{ color: 'var(--text-secondary)' }}
      >
        {star}★
      </span>
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: 'var(--border)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: 'var(--accent-primary, #9a653c)',
          }}
        />
      </div>
      <span
        className="w-7 text-left font-medium shrink-0"
        style={{ color: 'var(--text-secondary)' }}
      >
        {count}
      </span>
    </div>
  );
}

// ─── Review Card ─────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: MarketplaceReview }) {
  const reviewerName =
    review.reviewer_details?.first_name && review.reviewer_details?.last_name
      ? `${review.reviewer_details.first_name} ${review.reviewer_details.last_name}`.trim()
      : review.reviewer_details?.first_name ||
        review.reviewer_details?.email?.split('@')[0] ||
        'Neighbor';

  const initial = reviewerName[0]?.toUpperCase() || 'N';

  const dateStr = review.created_at
    ? new Date(review.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <div
      className="p-4 rounded-2xl space-y-2.5 transition-all hover:shadow-sm"
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Reviewer header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {review.reviewer_details?.avatar ? (
            <img
              src={review.reviewer_details.avatar}
              alt={reviewerName}
              className="w-8 h-8 rounded-full object-cover shrink-0"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{
                background: 'rgba(154,101,60,0.14)',
                color: 'var(--accent-primary)',
              }}
            >
              {initial}
            </div>
          )}
          <div>
            <p
              className="text-xs font-bold leading-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {reviewerName}
            </p>
            {dateStr && (
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                {dateStr}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <StarRow rating={review.rating} />
          <span
            className="text-xs font-bold"
            style={{ color: 'var(--warning,#f59e0b)' }}
          >
            {review.rating}.0
          </span>
        </div>
      </div>

      {/* Comment */}
      {review.comment ? (
        <p
          className="text-xs leading-relaxed italic px-1"
          style={{ color: 'var(--text-primary)' }}
        >
          "{review.comment}"
        </p>
      ) : (
        <p
          className="text-[10px] italic px-1"
          style={{ color: 'var(--text-secondary)' }}
        >
          No comment left.
        </p>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ProfileReviewSectionProps {
  userId?: string;
  userName?: string;
}

export default function ProfileReviewSection({
  userId,
  userName = 'You',
}: ProfileReviewSectionProps) {
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [reviews, setReviews] = useState<MarketplaceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sum, revs] = await Promise.all([
        getReviewSummary(userId).catch(() => null),
        getReviews({ user_id: userId, my_reviews: !userId }).catch(() => []),
      ]);
      setSummary(sum);
      setReviews(revs || []);
    } catch {
      setError('Could not load review data.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const previewReviews = reviews.slice(0, 4);
  const avgRating = summary?.average_rating ?? 0;
  const totalReviews = summary?.total_reviews ?? reviews.length;
  const trustScore = summary?.trust_score ?? 0;
  const isVerified = summary?.is_verified ?? false;
  const distribution = summary?.rating_distribution ?? {};

  return (
    <>
      <div
        className="p-6 rounded-2xl shadow-card space-y-5"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
      >
        {/* Section Header */}
        <div
          className="flex items-center justify-between pb-3 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <Star size={16} style={{ color: 'var(--accent-primary)' }} />
            <h3
              className="font-serif font-bold text-base"
              style={{ color: 'var(--text-primary)' }}
            >
              My Ratings &amp; Reviews
            </h3>
          </div>
          {isVerified && (
            <span
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
              style={{ background: 'rgba(90,122,94,0.14)', color: 'var(--success,#4ade80)' }}
            >
              <ShieldCheck size={11} />
              Verified Seller
            </span>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-8 flex flex-col items-center gap-2">
            <Loader2
              className="animate-spin"
              size={22}
              style={{ color: 'var(--accent-primary)' }}
            />
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Loading your reviews…
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div
            className="p-3 rounded-xl text-xs font-semibold text-center"
            style={{
              background: 'rgba(231,63,60,0.10)',
              color: '#e73f3c',
              border: '1px solid rgba(231,63,60,0.20)',
            }}
          >
            {error}
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {totalReviews === 0 ? (
              /* Empty state */
              <div className="py-8 text-center">
                <MessageSquare
                  size={36}
                  className="mx-auto mb-3 opacity-30"
                  style={{ color: 'var(--text-secondary)' }}
                />
                <p
                  className="text-sm font-semibold mb-1"
                  style={{ color: 'var(--text-primary)' }}
                >
                  No reviews yet
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Complete marketplace deals to earn community ratings!
                </p>
              </div>
            ) : (
              <>
                {/* Rating Overview */}
                <div
                  className="flex flex-col sm:flex-row gap-5 p-4 rounded-2xl"
                  style={{
                    background: 'var(--surface-1)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {/* Big average score */}
                  <div className="flex flex-col items-center justify-center shrink-0 sm:pr-5 sm:border-r sm:border-[var(--border)]">
                    <span
                      className="text-5xl font-black font-serif leading-none"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {avgRating.toFixed(1)}
                    </span>
                    <div className="flex items-center gap-0.5 mt-1.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={15}
                          className={
                            s <= Math.round(avgRating)
                              ? 'fill-[var(--warning,#f59e0b)] text-[var(--warning,#f59e0b)]'
                              : 'text-gray-300 dark:text-gray-600'
                          }
                        />
                      ))}
                    </div>
                    <p
                      className="text-[10px] mt-1.5 font-medium"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                    </p>
                  </div>

                  {/* Distribution bars */}
                  <div className="flex-1 flex flex-col justify-center gap-1.5">
                    {[5, 4, 3, 2, 1].map((star) => (
                      <DistributionBar
                        key={star}
                        star={star}
                        count={(distribution as Record<number, number>)[star] ?? 0}
                        total={totalReviews}
                      />
                    ))}
                  </div>

                  {/* Trust score */}
                  {trustScore > 0 && (
                    <div
                      className="flex flex-col items-center justify-center shrink-0 sm:pl-5 sm:border-l sm:border-[var(--border)]"
                    >
                      <div className="relative w-14 h-14">
                        <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
                          <circle
                            cx="28"
                            cy="28"
                            r="22"
                            fill="none"
                            stroke="var(--border)"
                            strokeWidth="5"
                          />
                          <circle
                            cx="28"
                            cy="28"
                            r="22"
                            fill="none"
                            stroke="var(--accent-primary,#9a653c)"
                            strokeWidth="5"
                            strokeDasharray={`${(trustScore / 100) * 138.2} 138.2`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span
                            className="text-xs font-black"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {trustScore}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-1.5">
                        <TrendingUp
                          size={11}
                          style={{ color: 'var(--accent-primary)' }}
                        />
                        <p
                          className="text-[10px] font-semibold"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          Trust Score
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Recent Reviews */}
                <div className="space-y-3">
                  <p
                    className="text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Recent Reviews
                  </p>
                  {previewReviews.map((rev) => (
                    <ReviewCard key={rev.id} review={rev} />
                  ))}
                </div>

                {/* View All Button */}
                {totalReviews > 4 && (
                  <button
                    onClick={() => setShowAll(true)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all hover:opacity-80"
                    style={{
                      background: 'rgba(154,101,60,0.10)',
                      color: 'var(--accent-primary)',
                      border: '1px solid rgba(154,101,60,0.20)',
                    }}
                  >
                    View All {totalReviews} Reviews
                    <ChevronRight size={13} />
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Full Reviews Modal */}
      <UserReviewsModal
        isOpen={showAll}
        onClose={() => setShowAll(false)}
        userId={userId}
        userName={userName}
        myReviews={!userId}
      />
    </>
  );
}
