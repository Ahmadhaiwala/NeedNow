'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Star, X, Check, Loader2, MessageSquare } from 'lucide-react';
import { submitReview, getReviews } from '@/lib/marketplace';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: number;
  postTitle: string;
  revieweeId: string;
  revieweeName: string;
  onReviewSubmitted?: () => void;
}

export default function ReviewModal({
  isOpen,
  onClose,
  postId,
  postTitle,
  revieweeId,
  revieweeName,
  onReviewSubmitted,
}: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [initialRating, setInitialRating] = useState(5);
  const [initialComment, setInitialComment] = useState('');
  const [isExistingReview, setIsExistingReview] = useState(false);
  const [fetchingExisting, setFetchingExisting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkExistingReview();
    }
  }, [isOpen, postId]);

  const checkExistingReview = async () => {
    setFetchingExisting(true);
    setError(null);
    try {
      // Check if current user has already reviewed this post
      // We want reviews WRITTEN by current user (as_reviewer=true)
      const reviews = await getReviews({ post_id: postId, as_reviewer: true });
      if (reviews && reviews.length > 0) {
        const existing = reviews[0];
        setRating(existing.rating);
        setComment(existing.comment || '');
        setInitialRating(existing.rating);
        setInitialComment(existing.comment || '');
        setIsExistingReview(true);
      } else {
        setRating(5);
        setComment('');
        setInitialRating(5);
        setInitialComment('');
        setIsExistingReview(false);
      }
    } catch (e) {
      // ignore
    } finally {
      setFetchingExisting(false);
    }
  };

  const isFormDirty = useMemo(() => {
    if (!isExistingReview) return true;
    return rating !== initialRating || comment.trim() !== initialComment.trim();
  }, [isExistingReview, rating, comment, initialRating, initialComment]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await submitReview({
        post: postId,
        reviewee: revieweeId,
        rating,
        comment: comment.trim(),
      });
      setSuccess(true);
      if (onReviewSubmitted) onReviewSubmitted();
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Error submitting review:', err);
      setError(err.message || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="w-full max-w-md p-6 sm:p-8 relative my-auto scrollbar-thin"
        style={{
          background: 'var(--surface-3)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-modal)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              {isExistingReview ? 'Edit Your Rating & Review' : 'Rate & Review Experience'}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {isExistingReview ? 'Update your review for ' : 'How was your experience dealing with '}
              <span className="font-semibold text-[var(--text-primary)]">{revieweeName}</span>?
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[var(--surface-2)] text-[var(--text-secondary)] transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Post Title Badge */}
        <div className="p-3 mb-6 rounded-[var(--radius-md)] bg-[var(--bg-page)] border border-[rgba(31,54,53,0.06)]">
          <p className="text-xs font-semibold text-[var(--text-secondary)]">Deal Item / Need:</p>
          <p className="text-sm font-bold text-[var(--text-primary)] truncate mt-0.5">{postTitle}</p>
        </div>

        {fetchingExisting ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-juice)]" />
            <p className="text-xs text-[var(--text-secondary)]">Checking existing review...</p>
          </div>
        ) : success ? (
          <div className="py-8 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center text-success">
              <Check size={28} />
            </div>
            <p className="text-sm font-bold text-[var(--text-primary)]">
              {isExistingReview ? 'Review Updated Successfully!' : 'Review Submitted Successfully!'}
            </p>
            <p className="text-xs text-[var(--text-secondary)]">Thank you for building community trust.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {error && (
              <div className="p-3 text-xs font-semibold rounded-[var(--radius-sm)] bg-[rgba(231,63,60,0.12)] text-[var(--color-heat)] border border-[rgba(231,63,60,0.2)]">
                {error}
              </div>
            )}

            {/* STAR RATING SELECTION */}
            <div className="flex flex-col items-center gap-2">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Your Star Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = star <= (hoverRating || rating);
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform transform hover:scale-125 focus:outline-none cursor-pointer"
                    >
                      <Star
                        size={32}
                        className={isFilled ? 'fill-warning text-warning' : 'text-gray-300'}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-bold text-[var(--color-juice)]">
                {rating === 5 && '⭐⭐⭐⭐⭐ Excellent (5/5)'}
                {rating === 4 && '⭐⭐⭐⭐ Good (4/5)'}
                {rating === 3 && '⭐⭐⭐ Average (3/5)'}
                {rating === 2 && '⭐⭐ Below Average (2/5)'}
                {rating === 1 && '⭐ Poor (1/5)'}
              </span>
            </div>

            {/* COMMENT INPUT */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <MessageSquare size={14} className="text-[var(--color-sky)]" />
                Comments / Feedback (Optional)
              </label>
              <textarea
                placeholder="Share details about punctuality, item condition, or communication..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full min-h-[90px] p-3 text-xs bg-[var(--bg-page)] text-[var(--text-primary)] rounded-[var(--radius-md)] border-0 focus:ring-2 focus:ring-[var(--color-juice)] outline-none resize-none"
              />
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex justify-end items-center gap-3 pt-3 border-t border-[rgba(31,54,53,0.08)]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold rounded-[var(--radius-md)] bg-[var(--bg-page)] text-[var(--text-primary)] hover:bg-[rgba(31,54,53,0.08)] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isFormDirty || loading}
                className={`px-5 py-2.5 text-xs font-bold rounded-[var(--radius-md)] transition-all flex items-center gap-2 ${
                  isFormDirty && !loading
                    ? 'bg-[var(--accent-primary)] text-[var(--color-core)] cursor-pointer hover:opacity-90 active:scale-[0.98] shadow-md'
                    : 'bg-[var(--bg-page)] text-[var(--text-secondary)] border border-[rgba(31,54,53,0.1)] opacity-50 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Saving Review...
                  </>
                ) : isFormDirty ? (
                  isExistingReview ? 'Update Review & Rating' : 'Submit Rating & Review'
                ) : (
                  'No Changes Made'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
