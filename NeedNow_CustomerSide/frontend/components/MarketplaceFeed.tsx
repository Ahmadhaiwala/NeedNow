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
  Flame, 
  Loader2, 
  HelpCircle,
  ShoppingBag,
  HeartHandshake,
  Send,
  CheckCircle2,
  XCircle,
  Eye,
  Star,
  Plus,
  MessageSquare
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

  // User Reviews Modal State
  const [userReviewsTarget, setUserReviewsTarget] = useState<{ id: string; name: string } | null>(null);
  const [isUserReviewsOpen, setIsUserReviewsOpen] = useState(false);
  
  // Filter States
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
  const [selectedRadius, setSelectedRadius] = useState(25);

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
        filters.exclude_own = true;

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
      {/* Header Bar */}
      <div 
        className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span 
              className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full"
              style={{ background: 'rgba(154, 101, 60, 0.12)', color: 'var(--accent-primary)' }}
            >
              Local Community
            </span>
            <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1 font-medium">
              <MapPin size={12} style={{ color: 'var(--accent-primary)' }} />
              Near {userLocationName.split(',')[0]}
            </span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-[var(--text-primary)]">
            Neighborhood Marketplace
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Buy & sell within your local neighborhood community
          </p>
        </div>

        {onOpenCreateModal && (
          <button
            onClick={onOpenCreateModal}
            className="px-5 py-3 text-xs font-bold rounded-full active:scale-95 transition-all cursor-pointer flex items-center gap-2 shadow-sm"
            style={{
              background: 'var(--accent-primary)',
              color: '#FFFDF8',
            }}
          >
            <Plus size={16} />
            Post Need or Sell Item
          </button>
        )}
      </div>

      {/* Filter Controls Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap justify-between items-center gap-3">
          {/* Post Type Tabs */}
          <div 
            className="flex p-1 rounded-full border"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
          >
            <button
              onClick={() => setSelectedType('all')}
              className="px-4 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer"
              style={{
                background: selectedType === 'all' ? 'var(--accent-primary)' : 'transparent',
                color: selectedType === 'all' ? '#FFFDF8' : 'var(--text-secondary)',
              }}
            >
              All Nearby
            </button>
            <button
              onClick={() => setSelectedType('need')}
              className="px-4 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5"
              style={{
                background: selectedType === 'need' ? 'var(--color-heat)' : 'transparent',
                color: selectedType === 'need' ? '#FFFDF8' : 'var(--text-secondary)',
              }}
            >
              <HeartHandshake size={13} />
              Needs Only
            </button>
            <button
              onClick={() => setSelectedType('sell')}
              className="px-4 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5"
              style={{
                background: selectedType === 'sell' ? 'var(--color-jade)' : 'transparent',
                color: selectedType === 'sell' ? '#FFFDF8' : 'var(--text-secondary)',
              }}
            >
              <ShoppingBag size={13} />
              Sells Only
            </button>
            <button
              onClick={() => setSelectedType('my_posts')}
              className="px-4 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer"
              style={{
                background: selectedType === 'my_posts' ? 'var(--leather-dark)' : 'transparent',
                color: selectedType === 'my_posts' ? '#FFFDF8' : 'var(--text-secondary)',
              }}
            >
              My Posts & Offers
            </button>
          </div>

          {/* Search Box & Radius Selector */}
          <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
            <form onSubmit={handleSearchSubmit} className="relative flex-grow sm:w-56">
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-full border outline-none font-medium"
                style={{
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-subtle)',
                }}
              />
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            </form>

            <div 
              className="flex items-center gap-1 p-1 rounded-full border"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            >
              {RADII.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setSelectedRadius(r.value)}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-full cursor-pointer transition-all"
                  style={{
                    background: selectedRadius === r.value ? 'var(--accent-primary)' : 'transparent',
                    color: selectedRadius === r.value ? '#FFFDF8' : 'var(--text-secondary)',
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Category Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap cursor-pointer transition-all"
              style={{
                background: selectedCategory === cat ? 'var(--text-primary)' : 'var(--bg-surface)',
                color: selectedCategory === cat ? 'var(--bg-page)' : 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sub-tabs for My Posts */}
        {selectedType === 'my_posts' && (
          <div 
            className="flex gap-2 p-1 rounded-full border self-start mt-1"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
          >
            <button
              onClick={() => setMySubTab('my_listings')}
              className="px-4 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer"
              style={{
                background: mySubTab === 'my_listings' ? 'var(--accent-primary)' : 'transparent',
                color: mySubTab === 'my_listings' ? '#FFFDF8' : 'var(--text-secondary)',
              }}
            >
              My Created Listings ({posts.length})
            </button>
            <button
              onClick={() => setMySubTab('my_offers')}
              className="px-4 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5"
              style={{
                background: mySubTab === 'my_offers' ? 'var(--accent-primary)' : 'transparent',
                color: mySubTab === 'my_offers' ? '#FFFDF8' : 'var(--text-secondary)',
              }}
            >
              <Send size={12} />
              My Submitted Offers ({myOffers.length})
            </button>
          </div>
        )}
      </div>

      {/* Grid Display */}
      {selectedType === 'my_posts' && mySubTab === 'my_offers' ? (
        loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
            <p className="text-xs font-medium text-[var(--text-secondary)]">Loading your offers...</p>
          </div>
        ) : myOffers.length === 0 ? (
          <div 
            className="p-12 text-center flex flex-col items-center justify-center"
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <Send className="w-10 h-10 mb-3 text-[var(--text-secondary)] opacity-40" />
            <h3 className="text-base font-bold text-[var(--text-primary)]">No submitted offers yet</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm">
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
                  className="p-5 flex flex-col justify-between gap-4 relative overflow-hidden transition-all duration-200"
                  style={{
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-card)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h4 className="text-base font-bold text-[var(--text-primary)]">
                        {offer.post_details?.title || offer.post_title || 'Marketplace Item'}
                      </h4>

                      <span
                        className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full flex items-center gap-1 shrink-0"
                        style={{
                          background: isAccepted ? 'rgba(78,112,85,0.15)' : isRejected ? 'rgba(185,74,62,0.15)' : 'rgba(154,101,60,0.15)',
                          color: isAccepted ? 'var(--color-jade)' : isRejected ? 'var(--color-heat)' : 'var(--accent-primary)',
                        }}
                      >
                        {isAccepted && <CheckCircle2 size={11} />}
                        {isRejected && <XCircle size={11} />}
                        {offer.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span 
                        className="px-2.5 py-0.5 text-xs font-bold rounded-md"
                        style={{ background: 'rgba(154,101,60,0.12)', color: 'var(--accent-primary)' }}
                      >
                        My Offer: ₹{offer.price}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-primary)] italic p-3 rounded-xl bg-[var(--bg-page)] mb-2">
                      "{offer.message}"
                    </p>
                  </div>

                  <div className="flex justify-between items-center gap-2 pt-3 border-t border-[var(--border-subtle)]">
                    {offer.post_details && onSelectPost && (
                      <button
                        onClick={() => onSelectPost(offer.post_details!)}
                        className="px-3 py-1.5 text-xs font-bold rounded-full bg-[var(--bg-page)] text-[var(--text-primary)] cursor-pointer flex items-center gap-1"
                      >
                        <Eye size={13} /> View Post
                      </button>
                    )}

                    {offer.post_details?.owner && onOpenChat && (
                      <button
                        onClick={() => onOpenChat(offer.post_details!.owner || '', offer.post_details!.owner_details?.display_name || 'Owner', offer.post)}
                        className="px-3 py-1.5 text-xs font-bold rounded-full cursor-pointer flex items-center gap-1"
                        style={{ background: 'var(--accent-primary)', color: '#FFFDF8' }}
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
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
          <p className="text-xs font-medium text-[var(--text-secondary)]">
            Searching for posts within {selectedRadius}km radius...
          </p>
        </div>
      ) : posts.length === 0 ? (
        <div 
          className="p-12 text-center flex flex-col items-center justify-center"
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <HelpCircle className="w-10 h-10 mb-3 text-[var(--text-secondary)] opacity-40" />
          <h3 className="text-base font-bold text-[var(--text-primary)]">No active posts nearby</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm">
            No listings found within {selectedRadius}km. Try expanding your radius filter or create a new post!
          </p>
          {onOpenCreateModal && (
            <button
              onClick={onOpenCreateModal}
              className="mt-4 px-5 py-2.5 text-xs font-bold rounded-full cursor-pointer transition-all"
              style={{ background: 'var(--accent-primary)', color: '#FFFDF8' }}
            >
              + Create Post Now
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {posts.map((post) => {
            const isNeed = post.post_type === 'need';
            const rawImg = post.images && post.images.length > 0 ? post.images[0] : null;
            const postImage = typeof rawImg === 'string' ? rawImg : (rawImg as any)?.image_url || (rawImg as any)?.image || null;

            return (
              <div
                key={post.id}
                onClick={() => onSelectPost && onSelectPost(post)}
                className="p-4 sm:p-5 flex flex-col justify-between gap-3 cursor-pointer transition-all duration-200 hover:-translate-y-1 relative overflow-hidden"
                style={{
                  background: 'var(--surface-2)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-card)',
                  border: '1px solid var(--border)',
                }}
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-1.5">
                      <span 
                        className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full flex items-center gap-1"
                        style={{
                          background: isNeed ? 'rgba(185,74,62,0.12)' : 'rgba(78,112,85,0.12)',
                          color: isNeed ? 'var(--color-heat)' : 'var(--color-jade)',
                        }}
                      >
                        {isNeed ? <HeartHandshake size={11} /> : <ShoppingBag size={11} />}
                        {post.post_type}
                      </span>
                    </div>

                    <span className="text-[11px] font-medium text-[var(--text-secondary)] flex items-center gap-1">
                      <MapPin size={11} style={{ color: 'var(--accent-primary)' }} />
                      {post.distance !== undefined && post.distance !== null
                        ? `${post.distance < 1 ? Math.round(post.distance * 1000) + 'm' : post.distance.toFixed(1) + 'km'}`
                        : 'Nearby'}
                    </span>
                  </div>

                  {/* Post Image thumbnail */}
                  {postImage && (
                    <div 
                      className="w-full h-36 rounded-xl overflow-hidden mb-3 border relative shrink-0"
                      style={{ background: 'var(--surface-1)', borderColor: 'var(--border)' }}
                    >
                      <img 
                        src={postImage} 
                        alt={post.title} 
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLElement).parentElement!.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <h3 className="font-bold text-sm text-[var(--text-primary)] mb-1 leading-snug line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                    {post.description}
                  </p>
                </div>

                <div className="flex flex-col gap-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-[var(--text-primary)]">
                      {!isNeed && post.price ? (
                        `₹${post.price}`
                      ) : isNeed && post.budget ? (
                        `Budget: ₹${post.budget}`
                      ) : (
                        'Flexible / Free'
                      )}
                    </span>

                    {!isNeed && post.condition && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded-md bg-[var(--bg-page)] text-[var(--text-secondary)]">
                        {post.condition.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center uppercase" style={{ background: 'var(--accent-primary)', color: '#FFFDF8' }}>
                        {post.owner_details?.first_name?.[0] || 'U'}
                      </div>
                      <span className="text-xs font-medium text-[var(--text-primary)] truncate max-w-[90px]">
                        {post.owner_details?.display_name || post.owner_details?.first_name || 'Neighbor'}
                      </span>
                    </div>

                    <span className="text-[11px] font-medium text-[var(--text-secondary)] flex items-center gap-1">
                      <MessageSquare size={11} />
                      {post.offers_count} {post.offers_count === 1 ? 'Offer' : 'Offers'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {reviewTarget && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          postId={reviewTarget.postId}
          postTitle={reviewTarget.postTitle}
          revieweeId={reviewTarget.userId}
          revieweeName={reviewTarget.userName}
          onReviewSubmitted={fetchPosts}
        />
      )}

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
