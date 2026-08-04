'use client';

import React, { useState } from 'react';
import { Star, ThumbsUp, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  verified: boolean;
  helpfulCount: number;
}

const INITIAL_REVIEWS: Review[] = [
  {
    id: '1',
    author: 'Ahmad Haiwala',
    rating: 5,
    date: '24 Jul 2026',
    title: 'Exceeded my expectations! Super fast delivery.',
    comment: 'The product arrived within 25 minutes in perfect condition. Quality is top-notch and exactly as described.',
    verified: true,
    helpfulCount: 14,
  },
  {
    id: '2',
    author: 'Priya Sharma',
    rating: 4,
    date: '18 Jul 2026',
    title: 'Very solid quality for the price',
    comment: 'Good value for money. Packaging was neat and clean. Would buy again.',
    verified: true,
    helpfulCount: 8,
  },
];

export default function ProductReviews({ productName }: { productName: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const averageRating = (
    reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)
  ).toFixed(1);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const newRev: Review = {
      id: `rev-${Date.now()}`,
      author: user?.name || 'Anonymous User',
      rating: newRating,
      date: 'Just now',
      title: newTitle.trim() || 'Great Product',
      comment: newComment.trim(),
      verified: true,
      helpfulCount: 0,
    };

    setReviews([newRev, ...reviews]);
    setNewTitle('');
    setNewComment('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <div className="mt-16 pt-12 border-t border-[rgba(31,54,53,0.1)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-serif font-bold" style={{ color: 'var(--text-primary)' }}>
            Customer Reviews & Ratings
          </h2>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center text-amber-500">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={18}
                  className={star <= Math.round(Number(averageRating)) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                />
              ))}
            </div>
            <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{averageRating} out of 5</span>
            <span className="text-xs text-secondary">({reviews.length} verified review{reviews.length !== 1 ? 's' : ''})</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Review Form */}
        <div className="lg:col-span-5 p-6 rounded-3xl shadow-card border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
          <h3 className="font-bold text-base mb-2" style={{ color: 'var(--text-primary)' }}>
            Write a Review
          </h3>
          <p className="text-xs text-secondary mb-4">
            Share your experience with {productName}
          </p>

          {submitted && (
            <div className="p-3 rounded-2xl mb-4 text-xs font-bold flex items-center gap-2" style={{ background: 'rgba(112,137,122,0.2)', color: '#70897A' }}>
              <CheckCircle2 size={16} /> Review submitted successfully!
            </div>
          )}

          <form onSubmit={handleSubmitReview} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary mb-1.5">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 cursor-pointer transition-transform hover:scale-110"
                  >
                    <Star
                      size={22}
                      className={
                        star <= (hoverRating || newRating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300'
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1.5">Review Title</label>
              <input
                type="text"
                placeholder="e.g. Excellent quality & fast shipping"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-[var(--surface-1)] text-[var(--text-primary)] border focus:ring-2 focus:ring-[var(--color-core)] outline-none"
                style={{ borderColor: 'var(--border)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1.5">Your Feedback</label>
              <textarea
                rows={3}
                placeholder="What did you like or dislike about this item?"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-[var(--surface-1)] text-[var(--text-primary)] border focus:ring-2 focus:ring-[var(--color-core)] outline-none resize-none"
                style={{ borderColor: 'var(--border)' }}
              />
            </div>

            <button
              type="submit"
              disabled={!newComment.trim()}
              className="mt-2 py-3 rounded-full font-bold text-xs cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
              style={{
                background: newComment.trim() ? 'var(--accent-primary)' : 'rgba(31,54,53,0.2)',
                color: newComment.trim() ? '#FFFDF8' : 'var(--text-secondary)',
              }}
            >
              <Send size={14} /> Submit Review
            </button>
          </form>
        </div>

        {/* Right Column: Review List */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-6 rounded-3xl shadow-card border"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{rev.author}</span>
                  {rev.verified && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(112,137,122,0.15)', color: '#70897A' }}>
                      Verified Purchase
                    </span>
                  )}
                </div>
                <span className="text-xs text-secondary">{rev.date}</span>
              </div>

              <div className="flex items-center text-amber-400 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={14}
                    className={star <= rev.rating ? 'fill-amber-400' : 'text-gray-300'}
                  />
                ))}
              </div>

              <h4 className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{rev.title}</h4>
              <p className="text-xs text-secondary leading-relaxed mb-3">{rev.comment}</p>

              <button
                onClick={() => {
                  setReviews(reviews.map(r => r.id === rev.id ? { ...r, helpfulCount: r.helpfulCount + 1 } : r));
                }}
                className="inline-flex items-center gap-1.5 text-xs text-secondary hover:text-[var(--text-primary)] cursor-pointer"
              >
                <ThumbsUp size={12} /> Helpful ({rev.helpfulCount})
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
