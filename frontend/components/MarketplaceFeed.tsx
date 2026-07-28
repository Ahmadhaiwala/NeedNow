'use client';

import React, { useState, useEffect } from 'react';
import { 
  MarketplacePost, 
  MarketplaceOffer,
  getMarketplacePosts,
  getMyOffers
} from '@/lib/marketplace';
import { 
  MapPin, 
  Search, 
  Filter, 
  Flame, 
  Tag, 
  Clock, 
  MessageSquare, 
  Plus, 
  Loader2, 
  HelpCircle,
  Sparkles,
  ShoppingBag,
  HeartHandshake,
  Send,
  CheckCircle2,
  XCircle,
  Eye,
  Star
} from 'lucide-react';
import ReviewModal from '@/components/ReviewModal';
import UserReviewsModal from '@/components/UserReviewsModal';

interface MarketplaceFeedProps {
  userLat: number;
  userLng: number;
  userLocationName: string;
  refreshTrigger?: number;
  onOpenCreateModal?: () => void;
  onSelectPost?: (post: MarketplacePost) => void;
  onOpenChat?: (otherUserId: string, otherUserName: string, postId?: number) => void;
}

const CATEGORIES = [
  'All',
  'Books & Education',
  'Electronics & Gadgets',
  'Home & Kitchen',
  'Tools & Equipment',
  'Clothing & Apparel',
  'Services & Favors',
  'Others',
];

const RADII = [
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '25 km', value: 25 },
  { label: '50 km', value: 50 },
];

export default function MarketplaceFeed({
  userLat,
  userLng,
  userLocationName,
  refreshTrigger,
  onOpenCreateModal,
  onSelectPost,
  onOpenChat,
}: MarketplaceFeedProps) {
  const [posts, setPosts] = useState<MarketplacePost[]>([]);
  const [myOffers, setMyOffers] = useState<MarketplaceOffer[]>([]);
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{
    postId: number;
    postTitle: string;
    userId: string;
    userName: string;
  } | null>(null);

  // User Reviews Modal State (for viewing partner/owner reviews)
  const [userReviewsTarget, setUserReviewsTarget] = useState<{ id: string; name: string } | null>(null);
  const [isUserReviewsOpen, setIsUserReviewsOpen] = useState(false);
  
  // Filter States with sessionStorage persistence
  const [selectedType, setSelectedType] = useState<'all' | 'need' | 'sell' | 'my_posts'>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('marketplace_selected_type');
      if (saved) return saved as any;
    }
    return 'all';
  });

  const [mySubTab, setMySubTab] = useState<'my_listings' | 'my_offers'>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('marketplace_sub_tab');
      if (saved) return saved as any;
    }
    return 'my_listings';
  });

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRadius, setSelectedRadius] = useState(25); // default 25km

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('marketplace_selected_type', selectedType);
    }
  }, [selectedType]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('marketplace_sub_tab', mySubTab);
    }
  }, [mySubTab]);

  useEffect(() => {
    fetchPosts();
  }, [selectedType, selectedCategory, selectedRadius, userLat, userLng, refreshTrigger]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const filters: any = {};

      if (selectedType === 'my_posts') {
        filters.my_posts = true;
        if (selectedCategory !== 'All') {
          filters.category = selectedCategory;
        }
        if (searchQuery.trim()) {
          filters.search = searchQuery.trim();
        }

        const [postsData, offersData] = await Promise.all([
          getMarketplacePosts(filters).catch(() => []),
          getMyOffers().catch(() => []),
        ]);
        setPosts(postsData || []);
        setMyOffers(offersData || []);
      } else {
        filters.latitude = userLat;
        filters.longitude = userLng;
        filters.radius = selectedRadius;
        filters.exclude_own = true; // Exclude user's own posts from public feed!

        if (selectedType !== 'all') {
          filters.post_type = selectedType;
        }

        if (selectedCategory !== 'All') {
          filters.category = selectedCategory;
        }
        if (searchQuery.trim()) {
          filters.search = searchQuery.trim();
        }

        const data = await getMarketplacePosts(filters);
        setPosts(data || []);
      }
    } catch (err) {
      console.error('Error fetching marketplace posts:', err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts();
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      {/* ── HEADER BAR & ACTION CALLOUT ── */}
      <div 
        className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-[rgba(202,206,0,0.15)] text-[var(--color-juice)]">
              Local Feed
            </span>
            <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1 font-medium">
              <MapPin size={12} className="text-[var(--color-sky)]" />
              Near {userLocationName.split(',')[0]}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-[var(--text-primary)]">Neighborhood Marketplace</h2>
        </div>

        {onOpenCreateModal && (
          <button
            onClick={onOpenCreateModal}
            className="px-5 py-3 text-sm font-bold rounded-[var(--radius-md)] active:scale-95 transition-all cursor-pointer flex items-center gap-2 shadow-sm"
            style={{
              background: 'var(--accent-primary)',
              color: 'var(--color-core)',
            }}
          >
            <Plus size={18} />
            Post Need or Sell Item
          </button>
        )}
      </div>

      {/* ── FILTER CONTROLS BAR ── */}
      <div className="flex flex-col gap-4">
        {/* Type Toggle Tabs & Radius */}
        <div className="flex flex-wrap justify-between items-center gap-3">
          {/* Post Type Tabs */}
          <div className="flex p-1 bg-[var(--bg-surface)] rounded-[var(--radius-md)] border border-[rgba(31,54,53,0.08)]">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-4 py-2 text-xs font-bold rounded-[var(--radius-sm)] transition-all cursor-pointer ${
                selectedType === 'all'
                  ? 'bg-[var(--bg-page)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              All Nearby
            </button>
            <button
              onClick={() => setSelectedType('need')}
              className={`px-4 py-2 text-xs font-bold rounded-[var(--radius-sm)] transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedType === 'need'
                  ? 'bg-[rgba(231,63,60,0.15)] text-[var(--color-heat)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <HeartHandshake size={14} />
              Needs Only
            </button>
            <button
              onClick={() => setSelectedType('sell')}
              className={`px-4 py-2 text-xs font-bold rounded-[var(--radius-sm)] transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedType === 'sell'
                  ? 'bg-[rgba(2,90,92,0.15)] text-[var(--color-jade)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <ShoppingBag size={14} />
              Sells Only
            </button>
            <button
              onClick={() => setSelectedType('my_posts')}
              className={`px-4 py-2 text-xs font-bold rounded-[var(--radius-sm)] transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedType === 'my_posts'
                  ? 'bg-[var(--color-juice)] text-[var(--color-core)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              My Posts & Offers
            </button>
          </div>

          {/* Search Box & Radius Selector */}
          <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
            <form onSubmit={handleSearchSubmit} className="relative flex-grow sm:w-64">
              <input
                type="text"
                placeholder="Search items or needs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-[var(--radius-md)] border border-[rgba(31,54,53,0.08)] focus:ring-2 focus:ring-[var(--color-juice)] outline-none"
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            </form>

            {/* Radius Selector */}
            <div className="flex items-center gap-1 bg-[var(--bg-surface)] p-1 rounded-[var(--radius-md)] border border-[rgba(31,54,53,0.08)]">
              {RADII.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setSelectedRadius(r.value)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-[var(--radius-sm)] cursor-pointer transition-all ${
                    selectedRadius === r.value
                      ? 'bg-[var(--color-juice)] text-[var(--color-core)] font-bold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap cursor-pointer transition-all ${
                selectedCategory === cat
                  ? 'bg-[var(--text-primary)] text-[var(--bg-page)]'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[rgba(31,54,53,0.08)] hover:text-[var(--text-primary)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* My Posts & Offers Sub-Tabs */}
        {selectedType === 'my_posts' && (
          <div className="flex gap-2 p-1 bg-[var(--bg-surface)] rounded-[var(--radius-md)] border border-[rgba(31,54,53,0.08)] self-start mt-1">
            <button
              onClick={() => setMySubTab('my_listings')}
              className={`px-4 py-2 text-xs font-bold rounded-[var(--radius-sm)] transition-all cursor-pointer ${
                mySubTab === 'my_listings'
                  ? 'bg-[var(--bg-page)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              My Created Listings ({posts.length})
            </button>
            <button
              onClick={() => setMySubTab('my_offers')}
              className={`px-4 py-2 text-xs font-bold rounded-[var(--radius-sm)] transition-all cursor-pointer flex items-center gap-1.5 ${
                mySubTab === 'my_offers'
                  ? 'bg-[rgba(202,206,0,0.18)] text-[var(--color-juice)] font-extrabold border border-[rgba(202,206,0,0.3)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Send size={13} />
              My Submitted Offers ({myOffers.length})
            </button>
          </div>
        )}
      </div>

      {/* ── BENTO-GRID POSTS DISPLAY OR MY OFFERS ── */}
      {selectedType === 'my_posts' && mySubTab === 'my_offers' ? (
        loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-[var(--color-juice)]" />
            <p className="text-sm font-medium text-[var(--text-secondary)]">Loading your offers...</p>
          </div>
        ) : myOffers.length === 0 ? (
          <div 
            className="p-12 text-center flex flex-col items-center justify-center"
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <Send className="w-12 h-12 mb-3 text-[var(--text-secondary)] opacity-40" />
            <h3 className="text-lg font-bold text-[var(--text-primary)] select-none">No submitted offers yet</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm select-none">
              Browse nearby neighbor posts and click "Make an Offer" to start negotiating deals!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myOffers.map((offer) => {
              const isAccepted = offer.status === 'accepted';
              const isRejected = offer.status === 'rejected';

              return (
                <div
                  key={offer.id}
                  className="p-5 flex flex-col justify-between gap-4 relative overflow-hidden transition-all duration-200 hover:shadow-lg"
                  style={{
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-card)',
                    border: isAccepted
                      ? '2px solid var(--color-jade)'
                      : '1px solid rgba(31,54,53,0.08)',
                  }}
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h4 className="text-base font-extrabold text-[var(--text-primary)]">
                        {offer.post_details?.title || offer.post_title || 'Marketplace Item'}
                      </h4>

                      {/* Status Badge */}
                      <span
                        className="px-3 py-1 text-xs font-black uppercase rounded-full flex items-center gap-1 shrink-0"
                        style={{
                          background: isAccepted ? 'rgba(2,90,92,0.25)' : isRejected ? 'rgba(231,63,60,0.25)' : 'rgba(202,206,0,0.18)',
                          color: isAccepted ? 'var(--color-jade)' : isRejected ? 'var(--color-heat)' : 'var(--color-juice)',
                        }}
                      >
                        {isAccepted && <CheckCircle2 size={12} />}
                        {isRejected && <XCircle size={12} />}
                        {offer.status}
                      </span>
                    </div>

                    {/* Offered Price & Owner Rating */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="px-3 py-1 text-xs font-black rounded-md bg-[rgba(202,206,0,0.18)] text-[var(--color-juice)] border border-[rgba(202,206,0,0.3)]">
                        My Offer: ₹{offer.price}
                      </span>
                      {offer.post_details?.owner_details && (
                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                          <span>Owner: <strong className="text-[var(--text-primary)]">{offer.post_details.owner_details.display_name || offer.post_details.owner_details.first_name || 'Neighbor'}</strong></span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const uid = offer.post_details?.owner || String(offer.post_details?.owner_details?.id);
                              const uname = offer.post_details?.owner_details?.display_name || offer.post_details?.owner_details?.first_name || 'Owner';
                              setUserReviewsTarget({ id: uid, name: uname });
                              setIsUserReviewsOpen(true);
                            }}
                            title="Click to view all reviews for this seller/owner"
                            className="flex items-center gap-0.5 text-[11px] font-bold text-[var(--text-primary)] px-2 py-0.5 rounded-full bg-[rgba(202,206,0,0.12)] border border-[rgba(202,206,0,0.25)] hover:bg-[rgba(202,206,0,0.25)] transition-all cursor-pointer"
                          >
                            <Star size={11} className="fill-[#FFC107] text-[#FFC107]" />
                            {offer.post_details.owner_details.rating !== undefined && Number(offer.post_details.owner_details.rating) > 0
                              ? Number(offer.post_details.owner_details.rating).toFixed(1)
                              : 'New'}
                            <span className="text-[var(--text-secondary)] font-normal">({offer.post_details.owner_details.review_count || 0})</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-[var(--text-primary)] italic p-3 rounded-[var(--radius-md)] bg-[var(--bg-page)] mb-2">
                      "{offer.message}"
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center gap-2 pt-3 border-t border-[rgba(31,54,53,0.08)]">
                    <div className="flex items-center gap-2">
                      {offer.post_details && onSelectPost && (
                        <button
                          onClick={() => onSelectPost(offer.post_details!)}
                          className="px-3 py-1.5 text-xs font-bold rounded-[var(--radius-sm)] bg-[var(--bg-page)] text-[var(--text-primary)] hover:bg-[rgba(31,54,53,0.08)] transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Eye size={13} /> View Post
                        </button>
                      )}

                      {isAccepted && offer.post_details && (
                        <button
                          onClick={() => {
                            setReviewTarget({
                              postId: offer.post,
                              postTitle: offer.post_title || offer.post_details?.title || 'Item',
                              userId: offer.post_details.owner || String(offer.post_details.owner_details?.id),
                              userName: offer.post_details.owner_details?.display_name || offer.post_details.owner_details?.first_name || 'Post Owner',
                            });
                            setIsReviewModalOpen(true);
                          }}
                          className="px-3 py-1.5 text-xs font-bold rounded-[var(--radius-sm)] bg-[rgba(202,206,0,0.2)] text-[var(--text-primary)] hover:opacity-90 transition-all cursor-pointer flex items-center gap-1 border border-[rgba(202,206,0,0.3)] shadow-xs"
                        >
                          <Star size={13} className="fill-[#FFC107] text-[#FFC107]" /> Rate & Review
                        </button>
                      )}
                    </div>

                    {offer.post_details?.owner && onOpenChat && (
                      <button
                        onClick={() => onOpenChat(offer.post_details!.owner, offer.post_details!.owner_details?.display_name || 'Owner', offer.post)}
                        className="px-3 py-1.5 text-xs font-bold rounded-[var(--radius-sm)] bg-[var(--color-jade)] text-[var(--color-core)] hover:opacity-90 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <MessageSquare size={13} /> Chat Owner
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[var(--color-juice)]" />
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            Searching for posts within {selectedRadius}km radius...
          </p>
        </div>
      ) : posts.length === 0 ? (
        <div 
          className="p-12 text-center flex flex-col items-center justify-center"
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <HelpCircle className="w-12 h-12 mb-3 text-[var(--text-secondary)] opacity-40" />
          <h3 className="text-lg font-bold text-[var(--text-primary)] select-none">No active posts nearby</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm select-none" style={{ textDecoration: 'none' }}>
            No listings found within {selectedRadius}km. Try expanding your radius filter or create a new post to request an item!
          </p>
          {onOpenCreateModal && (
            <button
              onClick={onOpenCreateModal}
              className="mt-5 px-5 py-2.5 text-xs font-bold rounded-[var(--radius-md)] bg-[var(--accent-primary)] text-[var(--color-core)] cursor-pointer hover:opacity-90 transition-all"
            >
              + Create Post Now
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {posts.map((post, idx) => {
            const isNeed = post.post_type === 'need';
            const isHero = idx === 0 && isNeed && post.urgency === 'today'; // Hero Bento card for urgent needs

            return (
              <div
                key={post.id}
                onClick={() => onSelectPost && onSelectPost(post)}
                className={`p-5 flex flex-col justify-between gap-4 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg relative overflow-hidden ${
                  isHero ? 'sm:col-span-2 sm:row-span-2' : ''
                }`}
                style={{
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-card)',
                  border: isNeed 
                    ? '1px solid rgba(231,63,60,0.15)' 
                    : '1px solid rgba(31,54,53,0.06)',
                }}
              >
                {/* Top Badge Row */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-1.5">
                      <span 
                        className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide rounded-[var(--radius-sm)] flex items-center gap-1"
                        style={{
                          background: isNeed ? 'rgba(231,63,60,0.12)' : 'rgba(2,90,92,0.12)',
                          color: isNeed ? 'var(--color-heat)' : 'var(--color-jade)',
                        }}
                      >
                        {isNeed ? <HeartHandshake size={12} /> : <ShoppingBag size={12} />}
                        {post.post_type}
                      </span>

                      {/* Status Badge (Active / Completed) */}
                      <span 
                        className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide rounded-[var(--radius-sm)] flex items-center gap-1"
                        style={{
                          background: post.status === 'completed' ? 'rgba(2,90,92,0.25)' : 'rgba(202,206,0,0.18)',
                          color: post.status === 'completed' ? 'var(--color-jade)' : 'var(--color-juice)',
                        }}
                      >
                        {post.status === 'completed' && <CheckCircle2 size={10} />}
                        {post.status}
                      </span>

                      {/* Urgency Badge for Needs */}
                      {isNeed && post.urgency === 'today' && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-[var(--radius-sm)] bg-[rgba(231,63,60,0.15)] text-[var(--color-heat)] flex items-center gap-1">
                          <Flame size={10} /> Today
                        </span>
                      )}
                    </div>

                    {/* Distance Pill */}
                    <span className="text-[11px] font-semibold text-[var(--text-secondary)] flex items-center gap-1">
                      <MapPin size={11} className="text-[var(--color-sky)]" />
                      {post.distance !== undefined && post.distance !== null
                        ? `${post.distance < 1 ? Math.round(post.distance * 1000) + 'm' : post.distance.toFixed(1) + 'km'}`
                        : 'Nearby'}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className={`font-bold text-[var(--text-primary)] mb-1.5 leading-snug ${isHero ? 'text-xl' : 'text-base'}`}>
                    {post.title}
                  </h3>
                  <p className={`text-xs text-[var(--text-secondary)] leading-relaxed ${isHero ? 'line-clamp-4' : 'line-clamp-2'}`}>
                    {post.description}
                  </p>
                </div>

                {/* Bottom Metadata & Footer */}
                <div className="flex flex-col gap-3 pt-3 border-t border-[rgba(31,54,53,0.06)]">
                  {/* Price / Budget / Condition */}
                  <div className="flex justify-between items-center">
                    <span className="text-base font-extrabold text-[var(--text-primary)]">
                      {!isNeed && post.price ? (
                        `₹${post.price}`
                      ) : isNeed && post.budget ? (
                        `Budget: ₹${post.budget}`
                      ) : (
                        'Flexible / Free'
                      )}
                    </span>

                    {/* Condition Tag for Sell Posts */}
                    {!isNeed && post.condition && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded-[var(--radius-sm)] bg-[var(--bg-page)] text-[var(--text-secondary)]">
                        {post.condition.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  {/* Owner Avatar & Offers Count */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[var(--color-sky)] text-[var(--color-core)] text-[10px] font-bold flex items-center justify-center uppercase">
                        {post.owner_details?.first_name?.[0] || post.owner_details?.email?.[0] || 'U'}
                      </div>
                      <span className="text-xs font-medium text-[var(--text-primary)] truncate max-w-[100px]">
                        {post.owner_details?.display_name || post.owner_details?.first_name || 'Neighbor'}
                      </span>
                      {/* Post Owner Rating Badge (Clickable to view all reviews) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const uid = post.owner || String(post.owner_details?.id);
                          const uname = post.owner_details?.display_name || post.owner_details?.first_name || 'Neighbor';
                          setUserReviewsTarget({ id: uid, name: uname });
                          setIsUserReviewsOpen(true);
                        }}
                        title="Click to view all reviews for this neighbor"
                        className="flex items-center gap-0.5 text-[10px] font-bold text-[var(--text-primary)] px-1.5 py-0.5 rounded-full bg-[rgba(202,206,0,0.12)] border border-[rgba(202,206,0,0.25)] hover:bg-[rgba(202,206,0,0.25)] transition-all cursor-pointer"
                      >
                        <Star size={10} className="fill-[#FFC107] text-[#FFC107]" />
                        {post.owner_details?.rating !== undefined && Number(post.owner_details.rating) > 0
                          ? Number(post.owner_details.rating).toFixed(1)
                          : 'New'}
                      </button>
                    </div>

                    <span className="text-[11px] font-semibold text-[var(--text-secondary)] flex items-center gap-1">
                      <MessageSquare size={12} />
                      {post.offers_count} {post.offers_count === 1 ? 'Offer' : 'Offers'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {reviewTarget && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          postId={reviewTarget.postId}
          postTitle={reviewTarget.postTitle}
          revieweeId={reviewTarget.userId}
          revieweeName={reviewTarget.userName}
          onReviewSubmitted={() => {
            fetchPosts();
          }}
        />
      )}

      {/* User Reviews List Modal */}
      {userReviewsTarget && (
        <UserReviewsModal
          isOpen={isUserReviewsOpen}
          onClose={() => setIsUserReviewsOpen(false)}
          userId={userReviewsTarget.id}
          userName={userReviewsTarget.name}
          myReviews={false}
        />
      )}
    </div>
  );
}
