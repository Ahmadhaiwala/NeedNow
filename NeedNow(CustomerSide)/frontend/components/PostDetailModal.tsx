'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  MapPin, 
  Clock, 
  Star, 
  ShieldCheck, 
  MessageSquare, 
  DollarSign, 
  ChevronLeft, 
  ChevronRight, 
  UserCheck, 
  AlertTriangle,
  Send,
  Trash2,
  Tag
} from 'lucide-react';
import { 
  MarketplacePost, 
  MarketplaceOffer, 
  MarketplaceComment, 
  getPostOffers, 
  createPostOffer, 
  getPostComments, 
  createPostComment, 
  deletePostComment 
} from '@/lib/marketplace';
import SellerProfileModal from '@/components/SellerProfileModal';

interface PostDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: MarketplacePost | null;
  currentUser?: any;
  onOpenChat?: (otherUserId: string, otherUserName: string, postId?: number) => void;
}

export default function PostDetailModal({
  isOpen,
  onClose,
  post,
  currentUser,
  onOpenChat,
}: PostDetailModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [offers, setOffers] = useState<MarketplaceOffer[]>([]);
  const [comments, setComments] = useState<MarketplaceComment[]>([]);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSellerProfileOpen, setIsSellerProfileOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && post?.id) {
      setActiveImageIndex(0);
      setError(null);

      // Fetch Post Offers & Comments
      Promise.all([
        getPostOffers(post.id).catch(() => []),
        getPostComments(post.id).catch(() => []),
      ]).then(([ofs, cmts]) => {
        setOffers(ofs);
        setComments(cmts);
      });
    }
  }, [isOpen, post]);

  // Resolve Images
  const imageList = React.useMemo(() => {
    if (post && post.images && post.images.length > 0) {
      return post.images.map((img) => {
        if (typeof img === 'string') return img;
        if (typeof img === 'object' && (img as any).image_url) return (img as any).image_url;
        if (typeof img === 'object' && (img as any).image) return (img as any).image;
        return 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600';
      });
    }
    return ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600'];
  }, [post?.images]);

  if (!isOpen || !post) return null;

  const isOwner = currentUser && post.owner && currentUser.id === post.owner;
  const ownerName = post.owner_details?.first_name 
    ? `${post.owner_details.first_name} ${post.owner_details.last_name || ''}`.trim()
    : (post.owner_details?.email?.split('@')[0] || 'Community Seller');

  const handleCreateOffer = async () => {
    if (!offerPrice || Number(offerPrice) <= 0) {
      setError('Please enter a valid offer price.');
      return;
    }
    setIsSubmittingOffer(true);
    setError(null);
    try {
      const newOffer = await createPostOffer(post.id, {
        price: Number(offerPrice),
        message: offerMessage || 'Interested in buying!',
      });
      setOffers([newOffer, ...offers]);
      setOfferPrice('');
      setOfferMessage('');
      setIsSubmittingOffer(false);
    } catch (err: any) {
      setIsSubmittingOffer(false);
      setError(err.message || 'Failed to submit offer');
    }
  };

  const handleCreateComment = async () => {
    if (!commentText.trim()) return;
    setIsSubmittingComment(true);
    try {
      const newCmt = await createPostComment(post.id, commentText);
      setComments([...comments, newCmt]);
      setCommentText('');
      setIsSubmittingComment(false);
    } catch (err) {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (cmtId: number) => {
    await deletePostComment(cmtId);
    setComments(comments.filter((c) => c.id !== cmtId));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/65 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Main Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          className="relative w-full max-w-5xl my-auto max-h-[90vh] overflow-y-auto rounded-3xl z-10 shadow-modal"
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border)',
          }}
        >
          {/* Top Close Bar */}
          <div className="sticky top-0 z-20 p-4 bg-[var(--surface-1)]/90 backdrop-blur-md border-b border-[var(--border-muted)] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--foreground-muted)' }}>
              <span>Marketplace</span>
              <span>/</span>
              <span>{post.category}</span>
              <span>/</span>
              <span style={{ color: 'var(--foreground)' }} className="font-bold truncate max-w-[200px]">{post.title}</span>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all hover:bg-[var(--surface-2)]"
              style={{ color: 'var(--foreground)' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Main Grid Content */}
          <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Gallery & Description */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Main Image Stage */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black/5 border border-[var(--border)]">
                <img
                  src={imageList[activeImageIndex]}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />

                {imageList.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImageIndex((prev) => (prev === 0 ? imageList.length - 1 : prev - 1))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={() => setActiveImageIndex((prev) => (prev === imageList.length - 1 ? 0 : prev + 1))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails Carousel Strip */}
              {imageList.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {imageList.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                        activeImageIndex === idx ? 'border-[var(--accent)] scale-105' : 'border-transparent opacity-70'
                      }`}
                    >
                      <img src={url} alt="Thumb" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Specifications Table */}
              <div className="p-4 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div>
                  <span className="text-[11px] block" style={{ color: 'var(--foreground-muted)' }}>Condition</span>
                  <strong className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>{post.condition || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-[11px] block" style={{ color: 'var(--foreground-muted)' }}>Post Type</span>
                  <strong className="text-xs font-bold uppercase" style={{ color: 'var(--accent)' }}>{post.post_type}</strong>
                </div>
                <div>
                  <span className="text-[11px] block" style={{ color: 'var(--foreground-muted)' }}>Category</span>
                  <strong className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>{post.category}</strong>
                </div>
                <div>
                  <span className="text-[11px] block" style={{ color: 'var(--foreground-muted)' }}>Urgency</span>
                  <strong className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>{post.urgency || 'Flexible'}</strong>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-serif font-bold text-lg mb-2" style={{ color: 'var(--foreground)' }}>
                  Description
                </h3>
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--foreground-muted)' }}>
                  {post.description}
                </p>
              </div>

              {/* Comments Section */}
              <div className="pt-6 border-t border-[var(--border-muted)] space-y-4">
                <h3 className="font-serif font-bold text-lg" style={{ color: 'var(--foreground)' }}>
                  Questions & Comments ({comments.length})
                </h3>

                {/* Comment Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Ask a question about this item..."
                    className="flex-1 p-3 rounded-xl text-sm outline-none font-medium"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                  />
                  <button
                    onClick={handleCreateComment}
                    disabled={isSubmittingComment}
                    className="px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}
                  >
                    <Send size={14} /> Post
                  </button>
                </div>

                {/* Comment List */}
                <div className="space-y-3">
                  {comments.map((cmt) => (
                    <div key={cmt.id} className="p-3.5 rounded-xl flex items-start justify-between gap-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                      <div className="flex items-start gap-2.5">
                        <img
                          src={cmt.user_details?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(cmt.user_details?.first_name || 'User')}`}
                          alt="User"
                          className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                        />
                        <div>
                          <span className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>
                            {cmt.user_details?.first_name || 'Neighbor'}
                          </span>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--foreground-muted)' }}>{cmt.comment}</p>
                        </div>
                      </div>
                      {currentUser && cmt.user === currentUser.id && (
                        <button onClick={() => handleDeleteComment(cmt.id)} className="text-red-500 hover:text-red-600">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Pricing, Seller Info, Offers & Actions */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Title & Price Card */}
              <div className="p-6 rounded-2xl space-y-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <h1 className="font-serif font-bold text-2xl" style={{ color: 'var(--foreground)' }}>
                  {post.title}
                </h1>

                <div className="flex items-baseline gap-3">
                  <span className="font-serif font-extrabold text-3xl" style={{ color: 'var(--foreground)' }}>
                    ₹{Number(post.price || post.budget || 0).toLocaleString()}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
                    Negotiable
                  </span>
                </div>

                <div className="text-xs flex items-center gap-2 pt-2" style={{ color: 'var(--foreground-muted)' }}>
                  <MapPin size={13} className="text-[var(--accent)]" />
                  <span>{post.location_name} • {post.distance ? `${post.distance.toFixed(1)} km away` : 'Nearby'}</span>
                </div>
              </div>

              {/* Seller Profile Card matching Inspiration */}
              <div className="p-5 rounded-2xl space-y-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={post.owner_details?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(ownerName)}`}
                      alt={ownerName}
                      className="w-12 h-12 rounded-2xl object-cover"
                    />
                    <div>
                      <h4 className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>{ownerName}</h4>
                      <div className="flex items-center gap-1 text-xs text-[var(--warning)] font-semibold">
                        <Star size={12} className="fill-current" />
                        <span>4.8 (32 reviews)</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsSellerProfileOpen(true)}
                    className="text-xs font-bold text-[var(--accent)] hover:underline"
                  >
                    View Profile
                  </button>
                </div>

                <div className="text-xs space-y-1 opacity-80" style={{ color: 'var(--foreground-muted)' }}>
                  <p>✓ Verified Member since 2023</p>
                  <p>⚡ Typically replies within 10 minutes</p>
                </div>

                {/* Primary Actions: Chat & Make Offer */}
                {!isOwner && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => onOpenChat?.(post.owner!, ownerName, post.id)}
                      className="py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
                      style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                    >
                      <MessageSquare size={15} /> Chat
                    </button>

                    <button
                      onClick={() => {
                        const el = document.getElementById('offer-section');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
                      style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}
                    >
                      <DollarSign size={15} /> Make Offer
                    </button>
                  </div>
                )}
              </div>

              {/* Offer Submission Section */}
              {!isOwner && (
                <div id="offer-section" className="p-5 rounded-2xl space-y-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <h4 className="font-serif font-bold text-base" style={{ color: 'var(--foreground)' }}>
                    Submit Your Counter Offer
                  </h4>

                  {error && <p className="text-xs text-red-500">{error}</p>}

                  <div className="space-y-2">
                    <input
                      type="number"
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value)}
                      placeholder="Your price offer (₹)"
                      className="w-full p-2.5 rounded-xl text-xs outline-none font-medium"
                      style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                    />
                    <input
                      type="text"
                      value={offerMessage}
                      onChange={(e) => setOfferMessage(e.target.value)}
                      placeholder="Message (e.g. Can pick up today!)"
                      className="w-full p-2.5 rounded-xl text-xs outline-none font-medium"
                      style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                    />
                    <button
                      onClick={handleCreateOffer}
                      disabled={isSubmittingOffer}
                      className="w-full py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                      style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}
                    >
                      {isSubmittingOffer ? 'Submitting...' : 'Submit Offer'}
                    </button>
                  </div>
                </div>
              )}

              {/* Offers History */}
              <div className="p-5 rounded-2xl space-y-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <h4 className="font-serif font-bold text-base" style={{ color: 'var(--foreground)' }}>
                  Offers ({offers.length})
                </h4>

                {offers.length === 0 ? (
                  <p className="text-xs text-center py-3" style={{ color: 'var(--foreground-muted)' }}>
                    No offers submitted yet. Be the first to make an offer!
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {offers.map((of) => (
                      <div key={of.id} className="p-2.5 rounded-xl flex items-center justify-between text-xs" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-muted)' }}>
                        <div>
                          <span className="font-bold" style={{ color: 'var(--foreground)' }}>₹{Number(of.price).toLocaleString()}</span>
                          <p className="text-[11px]" style={{ color: 'var(--foreground-muted)' }}>{of.message}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          of.status === 'accepted' ? 'bg-green-500/10 text-green-600' : of.status === 'rejected' ? 'bg-red-500/10 text-red-600' : 'bg-yellow-500/10 text-yellow-600'
                        }`}>
                          {of.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Safety Tips Card matching Inspiration */}
              <div className="p-4 rounded-2xl space-y-2 text-xs" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <h5 className="font-bold flex items-center gap-1.5 text-[var(--accent)]">
                  <ShieldCheck size={14} /> Community Safety Tips
                </h5>
                <ul className="space-y-1 opacity-80" style={{ color: 'var(--foreground-muted)' }}>
                  <li>• Meet in a public, well-lit place</li>
                  <li>• Inspect item thoroughly before paying</li>
                  <li>• Never send advance payments</li>
                </ul>
              </div>

            </div>
          </div>
        </motion.div>

        {/* Seller Profile Modal */}
        {post.owner_details && (
          <SellerProfileModal
            isOpen={isSellerProfileOpen}
            onClose={() => setIsSellerProfileOpen(false)}
            seller={post.owner_details}
            onChat={(sId, sName) => {
              setIsSellerProfileOpen(false);
              onClose();
              onOpenChat?.(sId, sName, post.id);
            }}
          />
        )}
      </div>
    </AnimatePresence>
  );
}
