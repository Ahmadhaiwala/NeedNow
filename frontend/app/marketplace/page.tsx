'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, SignInButton } from '@/lib/auth';
import { 
  getMarketplaceProfile, 
  getMarketplaceFeed,
  MarketplacePost,
  MarketplaceProfile,
  MarketplaceUser
} from '@/lib/marketplace';
import { 
  Plus, 
  Loader2, 
  MessageSquare, 
  DollarSign, 
  ChevronLeft, 
  ChevronRight,
  ShoppingBag,
  Store,
  Sparkles,
  Clock,
  History
} from 'lucide-react';
import QuickActionsBar from '@/components/marketplace/QuickActionsBar';
import MarketplaceSearch from '@/components/marketplace/MarketplaceSearch';
import HumanListingCard from '@/components/marketplace/HumanListingCard';
import CategoryNavCarousel from '@/components/marketplace/CategoryNavCarousel';
import ListingCarousel from '@/components/marketplace/ListingCarousel';
import FeaturedDealsSection from '@/components/marketplace/FeaturedDealsSection';

import PostDetailModal from '@/components/PostDetailModal';
import SellerProfileModal from '@/components/SellerProfileModal';
import CreatePostModal from '@/components/CreatePostModal';
import ChatDrawer from '@/components/ChatDrawer';
import MyOffersModal from '@/components/MyOffersModal';
import LocationPicker from '@/components/LocationPicker';

export default function MarketplacePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [profile, setProfile] = useState<MarketplaceProfile | null>(null);

  // Main View Navigation State (Browse Feed, My Workspace)
  const [activeMainTab, setActiveMainTab] = useState<'feed' | 'workspace'>('feed');

  // Modal & Drawer States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isOffersModalOpen, setIsOffersModalOpen] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);

  // Selected Detail Post & Chat Drawer States
  const [selectedPost, setSelectedPost] = useState<MarketplacePost | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  const [selectedSeller, setSelectedSeller] = useState<MarketplaceUser | null>(null);
  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatRecipientId, setChatRecipientId] = useState<string | null>(null);
  const [chatRecipientName, setChatRecipientName] = useState<string>('');
  const [chatPostId, setChatPostId] = useState<number | undefined>(undefined);
  const [chatPostTitle, setChatPostTitle] = useState<string | undefined>(undefined);

  // Saved Posts & History
  const [savedPostIds, setSavedPostIds] = useState<number[]>([]);
  const [recentlyViewedPosts, setRecentlyViewedPosts] = useState<MarketplacePost[]>([]);

  // Feed Query & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedRadius, setSelectedRadius] = useState(10);
  const [selectedCondition, setSelectedCondition] = useState('All Conditions');
  const [currentPage, setCurrentPage] = useState(1);
  // feedKey increments to force a fresh fetch (e.g., after creating a post)
  const [feedKey, setFeedKey] = useState(0);

  const [feedData, setFeedData] = useState<{
    results: MarketplacePost[];
    count: number;
    total_pages: number;
    current_page: number;
  }>({ results: [], count: 0, total_pages: 1, current_page: 1 });

  const [feedLoading, setFeedLoading] = useState(true);

  // null means user has NOT set a location — feed will skip the distance filter
  const [locationName, setLocationName] = useState<string>('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  useEffect(() => {
    setIsMounted(true);

    // Load recently viewed posts from localStorage
    try {
      const stored = localStorage.getItem('neednow_recent_posts');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentlyViewedPosts(parsed);
        }
      }
    } catch (e) {}

    if (user) {
      getMarketplaceProfile()
        .then((prof) => {
          setProfile(prof);
          // Only use profile location as the display label — do NOT set lat/lng
          // as feed filters. Distance filtering only activates when the user
          // explicitly picks a location via the LocationPicker.
          if (prof.location_name) setLocationName(prof.location_name);
        })
        .catch(() => {});
    }
  }, [user]);

  // Fetch Feed — lat/lng only sent if the user has explicitly set a location
  const fetchFeed = React.useCallback(async () => {
    setFeedLoading(true);
    try {
      const params: Record<string, any> = {
        search: searchQuery,
        category: selectedCategory === 'All' ? '' : selectedCategory,
        post_type: selectedType === 'all' ? '' : selectedType,
        condition: selectedCondition === 'All Conditions' ? '' : selectedCondition,
        page: currentPage,
        page_size: 12,
      };
      // Only apply distance filtering when the user has a real location
      if (latitude !== null && longitude !== null) {
        params.latitude = latitude;
        params.longitude = longitude;
        params.radius = selectedRadius;
      }
      const res = await getMarketplaceFeed(params);
      setFeedData(res);
      setFeedLoading(false);
    } catch (err) {
      setFeedLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedType, selectedCondition, latitude, longitude, selectedRadius, currentPage, feedKey]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);


  const handleQuickAction = (action: 'sell' | 'need' | 'service' | 'nearby') => {
    setIsCreateModalOpen(true);
  };

  const handleToggleSave = (post: MarketplacePost) => {
    if (savedPostIds.includes(post.id)) {
      setSavedPostIds(savedPostIds.filter((id) => id !== post.id));
    } else {
      setSavedPostIds([...savedPostIds, post.id]);
    }
  };

  const handleSelectPost = (p: MarketplacePost) => {
    setSelectedPost(p);
    setIsDetailModalOpen(true);

    // Save to recently viewed history
    setRecentlyViewedPosts((prev) => {
      const filtered = prev.filter((item) => item.id !== p.id);
      const updated = [p, ...filtered].slice(0, 8);
      try {
        localStorage.setItem('neednow_recent_posts', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleOpenChatForPost = (otherUserId: string, otherUserName: string, postId?: number, postTitle?: string) => {
    setChatRecipientId(otherUserId);
    setChatRecipientName(otherUserName);
    setChatPostId(postId);
    setChatPostTitle(postTitle);
    setIsChatOpen(true);
  };

  // Compute AI recommendations based on real feed posts
  const recommendedPosts = React.useMemo(() => {
    if (feedData.results.length === 0) return [];
    return [...feedData.results].sort((a, b) => (b.offers_count || 0) - (a.offers_count || 0)).slice(0, 6);
  }, [feedData.results]);

  if (!isMounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <Loader2 className="animate-spin text-[var(--accent)]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--background)' }}>
      
      {/* Main Page Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Marketplace Header Navigation */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--border-muted)]">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
                <Store size={20} />
              </div>
              <div>
                <h1 className="font-serif font-extrabold text-2xl tracking-tight leading-none" style={{ color: 'var(--foreground)' }}>
                  Marketplace
                </h1>
                <span className="text-[11px] font-medium" style={{ color: 'var(--foreground-muted)' }}>
                  Local Community Trade & Needs
                </span>
              </div>
            </div>

            {/* Sub-page Horizontal Tab Group */}
            <div className="flex items-center gap-1 p-1 rounded-2xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-muted)' }}>
              <button
                onClick={() => setActiveMainTab('feed')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeMainTab === 'feed' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                }`}
              >
                Browse Feed
              </button>
              {user && (
                <button
                  onClick={() => setActiveMainTab('workspace')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeMainTab === 'workspace' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  My Workspace
                </button>
              )}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <button
                  onClick={() => setIsOffersModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                >
                  <DollarSign size={15} className="text-[var(--accent)]" />
                  <span className="hidden sm:inline">My Offers</span>
                </button>

                <button
                  onClick={() => {
                    setChatRecipientId(null);
                    setIsChatOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                >
                  <MessageSquare size={15} className="text-[var(--accent)]" />
                  <span className="hidden sm:inline">Messages</span>
                </button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                  style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}
                >
                  <Plus size={16} />
                  <span>Post Listing</span>
                </motion.button>
              </>
            ) : (
              <SignInButton>
                <button className="px-4 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer" style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}>
                  Sign In
                </button>
              </SignInButton>
            )}
          </div>
        </div>

        {/* Main Feed View */}
        {activeMainTab === 'feed' && (
          <div>
            {/* 1. Quick Actions Bar */}
            <QuickActionsBar onQuickAction={handleQuickAction} />

            {/* 1. Search & Filter Bar */}
            <MarketplaceSearch
              searchQuery={searchQuery}
              onSearchChange={(q) => {
                setSearchQuery(q);
                setCurrentPage(1);
              }}
              selectedCategory={selectedCategory}
              onCategoryChange={(cat) => {
                setSelectedCategory(cat);
                setCurrentPage(1);
              }}
              selectedType={selectedType}
              onTypeChange={(t) => {
                setSelectedType(t);
                setCurrentPage(1);
              }}
              selectedRadius={selectedRadius}
              onRadiusChange={(r) => {
                setSelectedRadius(r);
                setCurrentPage(1);
              }}
              selectedCondition={selectedCondition}
              onConditionChange={(cond) => {
                setSelectedCondition(cond);
                setCurrentPage(1);
              }}
              locationName={locationName || 'All Locations'}
              onOpenLocationPicker={() => setIsLocationPickerOpen(true)}
            />

            {/* 2. Category Navigation Carousel */}
            <CategoryNavCarousel
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                setCurrentPage(1);
              }}
            />

            {/* 3. AI Recommended For You (Horizontal Carousel) */}
            <ListingCarousel
              title="AI Recommended For You"
              subtitle="Personalized marketplace picks curated dynamically from your interactions."
              badgeText="RECOMMENDED"
              badgeIcon={Sparkles}
              posts={recommendedPosts}
              savedPostIds={savedPostIds}
              onToggleSave={handleToggleSave}
              onSelectPost={handleSelectPost}
              onMakeOffer={(p) => {
                setSelectedPost(p);
                setIsDetailModalOpen(true);
              }}
              onChat={(p) => {
                const ownerName = p.owner_details?.first_name || 'Neighbor';
                handleOpenChatForPost(p.owner!, ownerName, p.id, p.title);
              }}
              loading={feedLoading}
            />


            {/* 5. Recently Added Listings (Main Grid) */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4 px-1">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
                      <Clock size={12} />
                      FRESH ARRIVALS
                    </span>
                  </div>
                  <h2 className="font-serif font-extrabold text-xl sm:text-2xl tracking-tight" style={{ color: 'var(--foreground)' }}>
                    Recently Added Listings
                  </h2>
                  <p className="text-xs font-medium" style={{ color: 'var(--foreground-muted)' }}>
                    Explore the latest items and services posted by real community members.
                  </p>
                </div>
              </div>

              {feedLoading ? (
                <div className="py-16 text-center">
                  <Loader2 className="animate-spin mx-auto text-[var(--accent)] mb-2" size={28} />
                  <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Loading live community listings...</p>
                </div>
              ) : feedData.results.length === 0 ? (
                <div className="py-16 text-center p-8 rounded-3xl" style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
                  <ShoppingBag className="mx-auto mb-3 text-[var(--foreground-muted)] opacity-60" size={40} />
                  <h4 className="font-serif font-bold text-lg" style={{ color: 'var(--foreground)' }}>
                    No listings found
                  </h4>
                  <p className="text-xs mt-1" style={{ color: 'var(--foreground-muted)' }}>
                    Try clearing filters or selecting another category.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {feedData.results.map((post) => (
                    <HumanListingCard
                      key={post.id}
                      post={post}
                      isSaved={savedPostIds.includes(post.id)}
                      onSave={handleToggleSave}
                      onSelect={handleSelectPost}
                      onMakeOffer={(p) => {
                        setSelectedPost(p);
                        setIsDetailModalOpen(true);
                      }}
                      onChat={(p) => {
                        const ownerName = p.owner_details?.first_name || 'Neighbor';
                        handleOpenChatForPost(p.owner!, ownerName, p.id, p.title);
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {feedData.total_pages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-2.5 rounded-xl border border-[var(--border)] cursor-pointer disabled:opacity-40"
                    style={{ background: 'var(--surface-1)', color: 'var(--foreground)' }}
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <span className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>
                    Page {feedData.current_page} of {feedData.total_pages}
                  </span>

                  <button
                    disabled={currentPage === feedData.total_pages}
                    onClick={() => setCurrentPage((p) => Math.min(feedData.total_pages, p + 1))}
                    className="p-2.5 rounded-xl border border-[var(--border)] cursor-pointer disabled:opacity-40"
                    style={{ background: 'var(--surface-1)', color: 'var(--foreground)' }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* 6. Continue Browsing (Only rendered if user has viewing history) */}
            {recentlyViewedPosts.length > 0 && (
              <ListingCarousel
                title="Continue Browsing"
                subtitle="Listings you viewed recently during your session."
                badgeText="HISTORY"
                badgeIcon={History}
                posts={recentlyViewedPosts}
                savedPostIds={savedPostIds}
                onToggleSave={handleToggleSave}
                onSelectPost={handleSelectPost}
                onMakeOffer={(p) => {
                  setSelectedPost(p);
                  setIsDetailModalOpen(true);
                }}
                onChat={(p) => {
                  const ownerName = p.owner_details?.first_name || 'Neighbor';
                  handleOpenChatForPost(p.owner!, ownerName, p.id, p.title);
                }}
              />
            )}

            {/* 7. Limited Time Deals & Special Offers */}
            <FeaturedDealsSection
              posts={feedData.results}
              onSelectPost={handleSelectPost}
              onMakeOffer={(p) => {
                setSelectedPost(p);
                setIsDetailModalOpen(true);
              }}
            />

            {/* 8. Modern Marketplace Footer */}
            <footer className="mt-12 pt-6 pb-8 border-t border-[var(--border-muted)] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Store size={18} className="text-[var(--accent)]" />
                <span className="font-serif font-bold text-sm" style={{ color: 'var(--foreground)' }}>
                  NeedNow Marketplace
                </span>
                <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                  — Verified Local Trade
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                © 2026 NeedNow. Real items, real neighbors, authentic trading.
              </p>
            </footer>
          </div>
        )}

        {/* Workspace Tab */}
        {activeMainTab === 'workspace' && user && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl flex items-center justify-between" style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
              <div>
                <h2 className="font-serif font-extrabold text-2xl" style={{ color: 'var(--foreground)' }}>
                  My Marketplace Control Panel
                </h2>
                <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                  Manage your listings, offers, bookmarks, and message history.
                </p>
              </div>

              <button
                onClick={() => setIsOffersModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}
              >
                Manage My Offers
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modals & Drawers */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostCreated={() => {
          // Increment feedKey to force a fresh feed re-fetch
          setFeedKey((k) => k + 1);
          setCurrentPage(1);
        }}
        userLat={latitude ?? undefined}
        userLng={longitude ?? undefined}
        userLocationName={locationName}
      />

      <PostDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        post={selectedPost}
        currentUser={user}
        onOpenChat={(otherId, otherName, pId) => {
          setIsDetailModalOpen(false);
          handleOpenChatForPost(otherId, otherName, pId, selectedPost?.title);
        }}
      />

      {selectedSeller && (
        <SellerProfileModal
          isOpen={isSellerModalOpen}
          onClose={() => setIsSellerModalOpen(false)}
          seller={selectedSeller}
          onChat={(sId, sName) => {
            setIsSellerModalOpen(false);
            handleOpenChatForPost(sId, sName);
          }}
        />
      )}

      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        initialRecipientId={chatRecipientId}
        initialRecipientName={chatRecipientName}
        initialPostId={chatPostId}
        initialPostTitle={chatPostTitle}
      />

      <MyOffersModal
        isOpen={isOffersModalOpen}
        onClose={() => setIsOffersModalOpen(false)}
      />

      <LocationPicker
        value={locationName}
        onChange={(name: string, lat: number, lng: number) => {
          setLatitude(lat);
          setLongitude(lng);
          setLocationName(name);
          setCurrentPage(1);
          setFeedKey((k) => k + 1);
        }}
        lat={latitude}
        lng={longitude}
      />
    </div>
  );
}
