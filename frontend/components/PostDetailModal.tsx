'use client';

import React, { useState, useEffect } from 'react';
import { 
  MarketplacePost, 
  MarketplaceOffer, 
  getMarketplacePost,
  getPostOffers, 
  createPostOffer, 
  updateOfferStatus, 
  markPostCompleted 
} from '@/lib/marketplace';
import { 
  X, 
  MapPin, 
  HeartHandshake, 
  ShoppingBag, 
  Flame, 
  IndianRupee, 
  MessageSquare, 
  Check, 
  XCircle, 
  Send, 
  Loader2, 
  Info,
  CheckCircle2,
  Star
} from 'lucide-react';
import ReviewModal from '@/components/ReviewModal';
import UserReviewsModal from '@/components/UserReviewsModal';

interface PostDetailModalProps {
  post: MarketplacePost | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  currentUserEmail?: string;
  onOpenChat: (otherUserId: string, otherUserName: string, postId?: number) => void;
  onPostUpdated: () => void;
}

export default function PostDetailModal({
  post,
  isOpen,
  onClose,
  currentUserId,
  currentUserEmail,
  onOpenChat,
  onPostUpdated,
}: PostDetailModalProps) {
  const [offers, setOffers] = useState<MarketplaceOffer[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const [localStatus, setLocalStatus] = useState<string>(post?.status || 'active');

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ userId: string; userName: string } | null>(null);

  // User Reviews Modal State (for viewing offerer/seller reviews)
  const [reviewsModalUser, setReviewsModalUser] = useState<{ id: string; name: string } | null>(null);
  const [isUserReviewsOpen, setIsUserReviewsOpen] = useState(false);

  const isOwner = Boolean(
    post && (
      (currentUserId && String(currentUserId).toLowerCase() === String(post.owner).toLowerCase()) ||
      (currentUserId && String(currentUserId).toLowerCase() === String(post.owner_details?.id).toLowerCase()) ||
      (currentUserEmail && post.owner_details?.email && currentUserEmail.toLowerCase() === post.owner_details.email.toLowerCase())
    )
  );

  useEffect(() => {
    if (isOpen && post) {
      setLocalStatus(post.status);
      getMarketplacePost(post.id)
        .then((fresh) => {
          if (fresh) setLocalStatus(fresh.status);
        })
        .catch(() => {});
      fetchOffers();
      setError(null);
      setSuccessMsg(null);
      setOfferPrice(post.post_type === 'sell' && post.price ? post.price : post.budget || '');
      setOfferMessage('');
    }
  }, [isOpen, post]);

  const fetchOffers = async () => {
    if (!post) return;
    setOffersLoading(true);
    try {
      const data = await getPostOffers(post.id);
      setOffers(data || []);
    } catch (err) {
      console.error('Error fetching offers:', err);
      setOffers([]);
    } finally {
      setOffersLoading(false);
    }
  };

  const handleMakeOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;
    setError(null);
    setSuccessMsg(null);

    if (!offerPrice.trim()) {
      setError('Please specify your offered price or amount.');
      return;
    }
    if (!offerMessage.trim()) {
      setError('Please include a brief message with your offer.');
      return;
    }

    setSubmitLoading(true);
    try {
      await createPostOffer(post.id, {
        price: parseFloat(offerPrice),
        message: offerMessage.trim(),
      });
      setSuccessMsg('Your offer has been submitted successfully!');
      setOfferMessage('');
      fetchOffers();
      onPostUpdated();
    } catch (err: any) {
      console.error('Error submitting offer:', err);
      setError(err.message || 'Failed to submit offer.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdateOfferStatus = async (offerId: number, status: 'accepted' | 'rejected') => {
    setActionLoadingId(offerId);
    setError(null);
    setSuccessMsg(null);
    try {
      // Optimistically update offer status locally right away
      setOffers((prev) =>
        prev.map((o) => {
          if (o.id === offerId) return { ...o, status };
          if (status === 'accepted' && o.status === 'pending') return { ...o, status: 'rejected' };
          return o;
        })
      );
      await updateOfferStatus(offerId, status);
      setSuccessMsg(`Offer has been ${status}! Refreshing page...`);
      onPostUpdated();
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }, 500);
    } catch (err: any) {
      console.error('Error updating offer:', err);
      setError(err.message || 'Failed to update offer status.');
      fetchOffers(); // revert on failure
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCompletePost = async () => {
    if (!post) return;
    setSubmitLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      post.status = 'completed'; // Mutate post prop object in-place so parent references get updated status
      setLocalStatus('completed');
      await markPostCompleted(post.id);
      setSuccessMsg('Deal marked as completed! Refreshing page...');
      onPostUpdated();
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }, 500);
    } catch (err: any) {
      console.error('Error completing post:', err);
      setError(err.message || 'Failed to complete post.');
      setLocalStatus(post.status); // revert on failure
    } finally {
      setSubmitLoading(false);
    }
  };

  if (!isOpen || !post) return null;

  const isNeed = post.post_type === 'need';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div 
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 sm:p-8 relative my-auto scrollbar-thin flex flex-col gap-6"
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-[var(--bg-page)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Top Badges */}
        <div className="flex flex-wrap justify-between items-center gap-2 pr-8">
          <div className="flex items-center gap-2">
            <span 
              className="px-3 py-1 text-xs font-extrabold uppercase rounded-[var(--radius-sm)] flex items-center gap-1.5"
              style={{
                background: isNeed ? 'rgba(231,63,60,0.12)' : 'rgba(2,90,92,0.12)',
                color: isNeed ? 'var(--color-heat)' : 'var(--color-jade)',
              }}
            >
              {isNeed ? <HeartHandshake size={14} /> : <ShoppingBag size={14} />}
              {post.post_type}
            </span>

            {isNeed && post.urgency && (
              <span className="px-2.5 py-1 text-xs font-bold rounded-[var(--radius-sm)] bg-[rgba(231,63,60,0.15)] text-[var(--color-heat)] flex items-center gap-1">
                <Flame size={12} /> {post.urgency === 'today' ? 'Needed Today' : post.urgency === 'week' ? 'This Week' : 'Flexible'}
              </span>
            )}

            {!isNeed && post.condition && (
              <span className="px-2.5 py-1 text-xs font-bold uppercase rounded-[var(--radius-sm)] bg-[var(--bg-page)] text-[var(--text-secondary)]">
                {post.condition.replace('_', ' ')}
              </span>
            )}
          </div>

          <span className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1">
            <MapPin size={13} className="text-[var(--color-sky)]" />
            {post.distance !== undefined && post.distance !== null
              ? `${post.distance < 1 ? Math.round(post.distance * 1000) + 'm' : post.distance.toFixed(1) + 'km'} away`
              : post.location_name.split(',')[0]}
          </span>
        </div>

        {/* Title & Price */}
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--text-primary)] mb-2">
            {post.title}
          </h2>
          <div className="flex justify-between items-center">
            <span className="text-xl font-black text-[var(--text-primary)]">
              {!isNeed && post.price ? (
                `₹${post.price}`
              ) : isNeed && post.budget ? (
                `Max Budget: ₹${post.budget}`
              ) : (
                'Flexible / Free'
              )}
            </span>

            {/* Status indicator */}
            <span 
              className="px-3 py-1 text-xs font-bold uppercase rounded-full"
              style={{
                background: localStatus === 'active' ? 'rgba(2,90,92,0.15)' : 'rgba(31,54,53,0.15)',
                color: localStatus === 'active' ? 'var(--color-jade)' : 'var(--text-secondary)',
              }}
            >
              {localStatus}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-page)]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
            Description
          </h4>
          <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-line">
            {post.description}
          </p>
        </div>

        {/* Owner Info Bar & Chat Trigger */}
        <div className="p-4 rounded-[var(--radius-md)] border border-[rgba(31,54,53,0.08)] flex justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-sky)] text-[var(--color-core)] font-bold text-sm flex items-center justify-center uppercase">
              {post.owner_details?.first_name?.[0] || post.owner_details?.email?.[0] || 'U'}
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">
                {post.owner_details?.display_name || post.owner_details?.first_name || 'Neighbor'}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Posted in {post.location_name.split(',')[0]}
              </p>
            </div>
          </div>

          {!isOwner && (
            <button
              onClick={() => onOpenChat(post.owner, post.owner_details?.display_name || 'Owner', post.id)}
              className="px-4 py-2 text-xs font-bold rounded-[var(--radius-md)] bg-[var(--bg-page)] text-[var(--text-primary)] hover:bg-[rgba(31,54,53,0.08)] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <MessageSquare size={14} />
              Chat with Owner
            </button>
          )}
        </div>

        {/* Error / Success Banners */}
        {error && (
          <div className="p-4 text-xs font-semibold rounded-[var(--radius-sm)] bg-[rgba(231,63,60,0.12)] text-[var(--color-heat)] border border-[rgba(231,63,60,0.2)] flex items-center gap-2">
            <Info size={16} />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-4 text-xs font-semibold rounded-[var(--radius-sm)] bg-[rgba(2,90,92,0.12)] text-[var(--color-jade)] border border-[rgba(2,90,92,0.2)] flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ── SECTION A: NON-OWNER OFFERS FORM ── */}
        {!isOwner && localStatus === 'active' && (
          <div className="flex flex-col gap-4 pt-4 border-t border-[rgba(31,54,53,0.08)]">
            <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Send size={18} className="text-[var(--color-juice)]" />
              Make an Offer
            </h3>

            <form onSubmit={handleMakeOffer} className="flex flex-col gap-3">
              <div className="flex gap-3">
                <div className="w-1/3 flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Offer Price (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Amount"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    className="w-full p-3 text-sm bg-[var(--bg-page)] text-[var(--text-primary)] rounded-[var(--radius-md)] border-0 focus:ring-2 focus:ring-[var(--color-juice)] outline-none"
                  />
                </div>
                <div className="w-2/3 flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Message to Owner
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. I can pick this up in 30 mins!"
                    value={offerMessage}
                    onChange={(e) => setOfferMessage(e.target.value)}
                    className="w-full p-3 text-sm bg-[var(--bg-page)] text-[var(--text-primary)] rounded-[var(--radius-md)] border-0 focus:ring-2 focus:ring-[var(--color-juice)] outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full py-3 font-bold text-sm rounded-[var(--radius-md)] hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                style={{
                  background: 'var(--accent-primary)',
                  color: 'var(--color-core)',
                }}
              >
                {submitLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Submitting Offer...
                  </>
                ) : (
                  'Submit Offer'
                )}
              </button>
            </form>
          </div>
        )}

        {/* ── SECTION B: OWNER OFFERS LIST & MANAGEMENT ── */}
        <div className="flex flex-col gap-4 pt-4 border-t border-[rgba(31,54,53,0.08)]">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <MessageSquare size={18} />
              Received Offers ({offers.length})
            </h3>

            {isOwner && localStatus === 'active' && (
              <button
                onClick={handleCompletePost}
                disabled={submitLoading}
                className="px-4 py-2 text-xs font-bold rounded-[var(--radius-md)] bg-[var(--color-jade)] text-[var(--color-core)] hover:opacity-90 transition-all cursor-pointer"
              >
                Mark Deal Completed
              </button>
            )}
          </div>

          {offersLoading ? (
            <div className="text-center py-6 text-xs text-[var(--text-secondary)] flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin text-[var(--color-juice)]" />
              Loading offers...
            </div>
          ) : offers.length === 0 ? (
            <p className="text-xs text-[var(--text-secondary)] italic py-2">
              No offers submitted yet. Be the first to make an offer!
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-page)] border border-[rgba(31,54,53,0.06)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-bold text-[var(--text-primary)]">
                        {offer.user_details?.display_name || offer.user_details?.first_name || 'Neighbor'}
                      </span>
                      {/* Offerer Rating Badge (Clickable to view all reviews) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const uid = offer.user_details?.id || String(offer.user);
                          const uname = offer.user_details?.display_name || offer.user_details?.first_name || 'Neighbor';
                          setReviewsModalUser({ id: uid, name: uname });
                          setIsUserReviewsOpen(true);
                        }}
                        title="Click to view all reviews for this neighbor"
                        className="flex items-center gap-1 text-[11px] font-bold text-[var(--text-primary)] px-2 py-0.5 rounded-full bg-[rgba(202,206,0,0.12)] border border-[rgba(202,206,0,0.25)] hover:bg-[rgba(202,206,0,0.25)] transition-all cursor-pointer"
                      >
                        <Star size={11} className="fill-[#FFC107] text-[#FFC107]" />
                        {offer.user_details?.rating !== undefined && Number(offer.user_details.rating) > 0
                          ? Number(offer.user_details.rating).toFixed(1)
                          : 'New'}
                        <span className="text-[var(--text-secondary)] font-normal">({offer.user_details?.review_count || 0})</span>
                      </button>
                      <span className="px-2.5 py-0.5 text-xs font-black rounded-md bg-[rgba(202,206,0,0.18)] text-[var(--color-juice)] border border-[rgba(202,206,0,0.3)]">
                        Offered: ₹{offer.price}
                      </span>
                      <span
                        className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full"
                        style={{
                          background: offer.status === 'accepted' ? 'rgba(2,90,92,0.25)' : offer.status === 'rejected' ? 'rgba(231,63,60,0.25)' : 'rgba(31,54,53,0.15)',
                          color: offer.status === 'accepted' ? 'var(--color-jade)' : offer.status === 'rejected' ? 'var(--color-heat)' : 'var(--text-secondary)',
                        }}
                      >
                        {offer.status}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] italic">
                      "{offer.message}"
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {/* Rate & Review button for accepted deals */}
                    {offer.status === 'accepted' && (
                      <button
                        onClick={() => {
                          const targetUser = isOwner
                            ? (offer.user_details?.id || String(offer.user))
                            : (post.owner_details?.id || String(post.owner));
                          const targetName = isOwner
                            ? (offer.user_details?.display_name || offer.user_details?.first_name || 'Offerer')
                            : (post.owner_details?.display_name || post.owner_details?.first_name || 'Post Owner');
                          setReviewTarget({ userId: targetUser, userName: targetName });
                          setIsReviewModalOpen(true);
                        }}
                        className="px-3 py-1.5 text-xs font-bold rounded-[var(--radius-sm)] bg-[rgba(202,206,0,0.2)] text-[var(--text-primary)] hover:opacity-90 transition-all cursor-pointer flex items-center gap-1 border border-[rgba(202,206,0,0.3)] shadow-xs"
                      >
                        <Star size={12} className="fill-[#FFC107] text-[#FFC107]" /> Rate & Review
                      </button>
                    )}

                    {/* Chat button for each offer */}
                    <button
                      onClick={() => onOpenChat(offer.user, offer.user_details?.display_name || 'User', post.id)}
                      className="p-2 rounded-[var(--radius-sm)] bg-[var(--bg-surface)] hover:bg-[rgba(31,54,53,0.08)] text-[var(--text-primary)] transition-all cursor-pointer"
                      title="Chat with offerer"
                    >
                      <MessageSquare size={14} />
                    </button>

                    {/* Owner Accept / Reject Actions */}
                    {isOwner && offer.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateOfferStatus(offer.id, 'accepted')}
                          disabled={actionLoadingId === offer.id}
                          className="px-3 py-1.5 text-xs font-bold rounded-[var(--radius-sm)] bg-[var(--color-jade)] text-[var(--color-core)] hover:opacity-90 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Check size={12} /> Accept
                        </button>
                        <button
                          onClick={() => handleUpdateOfferStatus(offer.id, 'rejected')}
                          disabled={actionLoadingId === offer.id}
                          className="px-3 py-1.5 text-xs font-bold rounded-[var(--radius-sm)] bg-[rgba(231,63,60,0.15)] text-[var(--color-heat)] hover:opacity-90 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <XCircle size={12} /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Review Modal */}
        {reviewTarget && (
          <ReviewModal
            isOpen={isReviewModalOpen}
            onClose={() => setIsReviewModalOpen(false)}
            postId={post.id}
            postTitle={post.title}
            revieweeId={reviewTarget.userId}
            revieweeName={reviewTarget.userName}
            onReviewSubmitted={() => {
              fetchOffers();
              onPostUpdated();
            }}
          />
        )}

        {/* User Reviews List Modal */}
        {reviewsModalUser && (
          <UserReviewsModal
            isOpen={isUserReviewsOpen}
            onClose={() => setIsUserReviewsOpen(false)}
            userId={reviewsModalUser.id}
            userName={reviewsModalUser.name}
            myReviews={false}
          />
        )}
      </div>
    </div>
  );
}
