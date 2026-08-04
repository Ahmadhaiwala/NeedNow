'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, XCircle, ArrowUpRight, DollarSign, Clock, Star } from 'lucide-react';
import { MarketplaceOffer, getMyOffers, acceptOffer, rejectOffer, withdrawOffer } from '@/lib/marketplace';
import ReviewModal from '@/components/ReviewModal';

interface MyOffersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MyOffersModal({ isOpen, onClose }: MyOffersModalProps) {
  const [offers, setOffers] = useState<MarketplaceOffer[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'accepted' | 'rejected' | 'withdrawn'>('all');
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState<{
    postId: number;
    postTitle: string;
    sellerId: string;
    sellerName: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getMyOffers()
        .then((data) => {
          setOffers(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredOffers = filterStatus === 'all' 
    ? offers 
    : offers.filter((o) => o.status === filterStatus);

  const handleAccept = async (id: number) => {
    await acceptOffer(id);
    setOffers(offers.map((o) => (o.id === id ? { ...o, status: 'accepted' } : o)));
  };

  const handleReject = async (id: number) => {
    await rejectOffer(id);
    setOffers(offers.map((o) => (o.id === id ? { ...o, status: 'rejected' } : o)));
  };

  const handleWithdraw = async (id: number) => {
    await withdrawOffer(id);
    setOffers(offers.map((o) => (o.id === id ? { ...o, status: 'withdrawn' } : o)));
  };

  const handleLeaveReview = (offer: MarketplaceOffer) => {
    // CORRECT FLOW: Buyer reviews the SELLER (post owner)
    const postId = typeof offer.post === 'number' ? offer.post : offer.post_details?.id;
    const sellerId = offer.post_details?.owner;
    const sellerName = offer.post_details?.owner_details?.first_name 
      ? `${offer.post_details.owner_details.first_name} ${offer.post_details.owner_details.last_name || ''}`.trim()
      : offer.post_details?.owner_details?.email?.split('@')[0] || 'Seller';

    if (postId && sellerId) {
      setReviewModal({
        postId,
        postTitle: offer.post_title || offer.post_details?.title || `Post #${offer.post}`,
        sellerId: String(sellerId),
        sellerName,
      });
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          className="relative w-full max-w-3xl max-h-[85vh] rounded-3xl overflow-hidden flex flex-col z-10 shadow-modal"
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border)',
          }}
        >
          {/* Header */}
          <div className="p-6 border-b border-[var(--border-muted)] flex items-center justify-between shrink-0">
            <div>
              <h3 className="font-serif font-bold text-2xl" style={{ color: 'var(--foreground)' }}>
                Offers Management
              </h3>
              <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                Track and manage submitted & received offers
              </p>
            </div>
            <button onClick={onClose} className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
              <X size={18} />
            </button>
          </div>

          {/* Status Filter Tabs */}
          <div className="px-6 py-3 bg-[var(--surface-2)] border-b border-[var(--border-muted)] flex items-center gap-2 overflow-x-auto shrink-0">
            {['all', 'pending', 'accepted', 'rejected', 'withdrawn'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st as any)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold capitalize transition-all cursor-pointer ${
                  filterStatus === st ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface-1)] text-[var(--foreground-muted)]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Offers List */}
          <div className="p-6 overflow-y-auto flex-1 space-y-3">
            {loading ? (
              <p className="text-xs text-center py-8" style={{ color: 'var(--foreground-muted)' }}>Loading offers...</p>
            ) : filteredOffers.length === 0 ? (
              <p className="text-xs text-center py-8" style={{ color: 'var(--foreground-muted)' }}>No offers found.</p>
            ) : (
              filteredOffers.map((of) => (
                <div key={of.id} className="p-4 rounded-2xl flex items-center justify-between gap-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-serif font-bold text-lg" style={{ color: 'var(--foreground)' }}>
                        ₹{Number(of.price).toLocaleString()}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        of.status === 'accepted' ? 'bg-green-500/10 text-green-600' : of.status === 'rejected' ? 'bg-red-500/10 text-red-600' : 'bg-yellow-500/10 text-yellow-600'
                      }`}>
                        {of.status}
                      </span>
                    </div>
                    <p className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>
                      Listing: {of.post_title || `Post #${of.post}`}
                    </p>
                    <p className="text-xs mt-0.5 opacity-80" style={{ color: 'var(--foreground-muted)' }}>
                      "{of.message}"
                    </p>
                  </div>

                  {of.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleWithdraw(of.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold border border-red-500/30 text-red-600 hover:bg-red-500/10"
                      >
                        Withdraw
                      </button>
                    </div>
                  )}

                  {of.status === 'accepted' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLeaveReview(of)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--accent)] text-white hover:opacity-90 flex items-center gap-1.5"
                      >
                        <Star size={14} />
                        Leave Review
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Review Modal - Buyer reviews the SELLER */}
        {reviewModal && (
          <ReviewModal
            isOpen={!!reviewModal}
            onClose={() => setReviewModal(null)}
            postId={reviewModal.postId}
            postTitle={reviewModal.postTitle}
            revieweeId={reviewModal.sellerId}
            revieweeName={reviewModal.sellerName}
            onReviewSubmitted={() => {
              setReviewModal(null);
              // Refresh offers to show updated state
              getMyOffers().then(setOffers);
            }}
          />
        )}
      </div>
    </AnimatePresence>
  );
}
