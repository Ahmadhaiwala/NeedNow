'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, SignInButton } from '@/lib/auth';
import { 
  getMarketplaceProfile, 
  createMarketplaceProfile,
  updateMarketplaceProfile, 
  getMarketplacePosts,
  MarketplacePost,
  getMyOffers,
  MarketplaceOffer
} from '@/lib/marketplace';
import { 
  MapPin, 
  Search, 
  Plus, 
  Loader2, 
  Compass,
  ShoppingBag,
  HeartHandshake,
  Send,
  Package,
  MessageSquare,
  User,
  Info,
  CheckCircle2,
  XCircle,
  Eye
} from 'lucide-react';
import LocationPicker from '@/components/LocationPicker';
import CreatePostModal from '@/components/CreatePostModal';
import PostDetailModal from '@/components/PostDetailModal';
import ChatDrawer from '@/components/ChatDrawer';
import ReviewModal from '@/components/ReviewModal';
import UserReviewsModal from '@/components/UserReviewsModal';

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

export default function MarketplacePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    if (user && typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(`marketplace_profile_cache_${user.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setProfile(parsed);
          setProfileLoading(false);
        } catch (e) {}
      } else {
        setProfile(null);
      }
    }
  }, [user]);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Post Detail & Chat State
  const [selectedPost, setSelectedPost] = useState<MarketplacePost | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [chatRecipientId, setChatRecipientId] = useState<string | null>(null);
  const [chatRecipientName, setChatRecipientName] = useState('');
  const [chatPostId, setChatPostId] = useState<number | undefined>(undefined);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Form State
  const [bio, setBio] = useState('');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // Feed State
  const [posts, setPosts] = useState<MarketplacePost[]>([]);
  const [myOffers, setMyOffers] = useState<MarketplaceOffer[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);

  // Filter States
  const [selectedType, setSelectedType] = useState<'all' | 'need' | 'sell' | 'my_posts'>('all');
  const [mySubTab, setMySubTab] = useState<'my_listings' | 'my_offers'>('my_listings');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRadius, setSelectedRadius] = useState(25);

  useEffect(() => {
    if (profile) {
      setBio(profile.bio || '');
      setLocationName(profile.location_name || '');
      setLatitude(profile.latitude ?? null);
      setLongitude(profile.longitude ?? null);
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else if (!authLoading) {
      setProfileLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (profile && profile.latitude && profile.longitude) {
      fetchFeed();
    }
  }, [profile, selectedType, selectedCategory, selectedRadius, searchQuery, refreshKey]);

  const fetchProfile = async () => {
    if (!profile) setProfileLoading(true);
    setError(null);
    try {
      const data = await getMarketplaceProfile();
      setProfile(data);
      if (data && user && typeof window !== 'undefined') {
        sessionStorage.setItem(`marketplace_profile_cache_${user.id}`, JSON.stringify(data));
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchFeed = async () => {
    if (!profile?.latitude || !profile?.longitude) return;
    setFeedLoading(true);
    try {
      const filters: any = {};

      if (selectedType === 'my_posts') {
        filters.my_posts = true;
        if (selectedCategory !== 'All') filters.category = selectedCategory;
        if (searchQuery.trim()) filters.search = searchQuery.trim();

        const [postsData, offersData] = await Promise.all([
          getMarketplacePosts(filters).catch(() => []),
          getMyOffers().catch(() => []),
        ]);
        setPosts(postsData || []);
        setMyOffers(offersData || []);
      } else {
        filters.latitude = profile.latitude;
        filters.longitude = profile.longitude;
        filters.radius = selectedRadius;
        filters.exclude_own = true;
        if (selectedType !== 'all') filters.post_type = selectedType;
        if (selectedCategory !== 'All') filters.category = selectedCategory;
        if (searchQuery.trim()) filters.search = searchQuery.trim();

        const data = await getMarketplacePosts(filters);
        setPosts(data || []);
      }
    } catch (err) {
      console.error('Error fetching marketplace posts:', err);
      setPosts([]);
    } finally {
      setFeedLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!bio.trim()) {
      setError('Please tell us a little bit about yourself (Bio).');
      return;
    }

    if (!locationName.trim()) {
      setError('Please provide your location.');
      return;
    }

    let finalLat = latitude;
    let finalLng = longitude;

    setSubmitLoading(true);

    try {
      if (finalLat === null || finalLng === null) {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`
        );
        const results = await response.json();
        if (results && results.length > 0) {
          finalLat = parseFloat(parseFloat(results[0].lat).toFixed(6));
          finalLng = parseFloat(parseFloat(results[0].lon).toFixed(6));
        } else {
          throw new Error('Could not resolve location coordinates. Please verify your address.');
        }
      }

      let newProfile;
      try {
        newProfile = await updateMarketplaceProfile({
          bio,
          location_name: locationName,
          latitude: finalLat!,
          longitude: finalLng!,
        });
      } catch (updateErr: any) {
        newProfile = await createMarketplaceProfile({
          bio,
          location_name: locationName,
          latitude: finalLat!,
          longitude: finalLng!,
        });
      }

      setProfile(newProfile);
      if (typeof window !== 'undefined' && user) {
        sessionStorage.setItem(`marketplace_profile_cache_${user.id}`, JSON.stringify(newProfile));
      }
      setIsEditingProfile(false);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (!isMounted || ((authLoading || profileLoading) && !profile)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
        <p className="text-xs text-[var(--text-secondary)] font-medium">Loading marketplace...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <main className="app-container mx-auto px-6 py-16">
        <div className="max-w-md mx-auto" 
          style={{
            padding: '48px 32px',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--border-subtle)',
            textAlign: 'center'
          }}
        >
          <Compass className="w-14 h-14 mx-auto mb-4 text-[var(--accent-primary)]" />
          <h2 className="text-2xl font-serif font-bold mb-3 text-[var(--text-primary)]">Neighborhood Marketplace</h2>
          <p className="mb-6 text-sm leading-relaxed text-[var(--text-secondary)]">
            Buy, sell, borrow or request what you need from people nearby.
          </p>
          <SignInButton className="w-full py-3 font-bold text-xs rounded-full cursor-pointer hover:opacity-90 transition-all shadow-sm">
            Sign In with Google
          </SignInButton>
        </div>
      </main>
    );
  }

  if (!profile || isEditingProfile) {
    return (
      <main className="app-container mx-auto px-6 py-12">
        <div className="max-w-xl mx-auto" 
          style={{
            padding: '40px 32px',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-full bg-[rgba(154,101,60,0.12)]">
              <User className="w-6 h-6 text-[var(--accent-primary)]" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-[var(--text-primary)]">
                {profile ? 'Update Location' : 'Setup Your Profile'}
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {profile ? 'Change your marketplace location' : 'Find nearby items in your neighborhood'}
              </p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="flex flex-col gap-5">
            {error && (
              <div 
                className="p-3 text-xs font-semibold rounded-xl flex gap-2 items-center"
                style={{
                  background: 'rgba(185,74,62,0.12)',
                  color: 'var(--color-heat)',
                  border: '1px solid rgba(185,74,62,0.2)'
                }}
              >
                <Info size={16} />
                <span>{error}</span>
              </div>
            )}

            {!profile && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-[var(--text-primary)]">
                  About You (Bio)
                </label>
                <textarea
                  placeholder="Write a brief intro..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full min-h-[90px] p-3 text-sm bg-[var(--bg-page)] text-[var(--text-primary)] rounded-xl border-0 outline-none resize-none"
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[var(--text-primary)]">
                Your Neighborhood Location
              </label>
              <LocationPicker
                value={locationName}
                onChange={(address, lat, lng) => {
                  setLocationName(address);
                  setLatitude(lat);
                  setLongitude(lng);
                }}
                lat={latitude}
                lng={longitude}
                placeholder="e.g. Ahmedabad, Bopal"
              />
            </div>

            <button
              type="submit"
              disabled={submitLoading}
              className="w-full py-3.5 text-sm font-bold text-center rounded-full transition-all cursor-pointer shadow-sm"
              style={{
                background: 'var(--accent-primary)',
                color: '#FFFDF8',
                opacity: submitLoading ? 0.6 : 1,
              }}
            >
              {submitLoading ? 'Saving...' : profile ? 'Update Location' : 'Activate Marketplace Profile'}
            </button>

            {profile && (
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Cancel
              </button>
            )}
          </form>
        </div>
      </main>
    );
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFeed();
  };

  const renderNeedCard = (post: MarketplacePost) => (
    <div
      key={post.id}
      onClick={() => { setSelectedPost(post); setIsDetailModalOpen(true); }}
      className="p-6 flex flex-col gap-3 cursor-pointer transition-all duration-200 hover:-translate-y-1 rounded-2xl"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
        minWidth: '340px',
        maxWidth: '380px',
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span 
          className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full flex items-center gap-1.5"
          style={{
            background: 'rgba(185,74,62,0.12)',
            color: 'var(--color-heat)',
          }}
        >
          <HeartHandshake size={12} />
          NEED
        </span>
        <span className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1">
          <MapPin size={12} style={{ color: 'var(--accent-primary)' }} />
          {post.distance !== undefined && post.distance !== null
            ? `${post.distance < 1 ? Math.round(post.distance * 1000) + 'm' : post.distance.toFixed(1) + 'km'}`
            : 'Nearby'}
        </span>
      </div>

      <h3 className="font-bold text-base text-[var(--text-primary)] leading-snug line-clamp-2">
        {post.title}
      </h3>

      <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-3 flex-1">
        {post.description}
      </p>

      <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex flex-col gap-1">
          {post.budget && (
            <span className="text-sm font-bold text-[var(--text-primary)]">
              Budget: ₹{post.budget}
            </span>
          )}
          {post.urgency && (
            <span className="text-xs text-[var(--text-secondary)] capitalize">
              {post.urgency === 'today' ? '🔥 Urgent' : post.urgency === 'week' ? 'This week' : 'Flexible'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div 
              className="w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center uppercase" 
              style={{ background: 'var(--accent-primary)', color: '#FFFDF8' }}
            >
              {post.owner_details?.first_name?.[0] || 'U'}
            </div>
            <span className="text-xs font-medium text-[var(--text-primary)]">
              {post.owner_details?.display_name || 'Neighbor'}
            </span>
          </div>
          <span className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1">
            <MessageSquare size={12} />
            {post.offers_count || 0}
          </span>
        </div>
      </div>
    </div>
  );

  const renderSellCard = (post: MarketplacePost) => {
    const postImage = post.images && post.images.length > 0 ? post.images[0] : null;
    
    return (
      <div
        key={post.id}
        onClick={() => { setSelectedPost(post); setIsDetailModalOpen(true); }}
        className="flex flex-col cursor-pointer transition-all duration-200 hover:-translate-y-1 rounded-2xl overflow-hidden"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-card)',
          minWidth: '340px',
          maxWidth: '380px',
        }}
      >
        {postImage ? (
          <div 
            className="w-full h-48 relative"
            style={{ background: 'var(--surface-1)' }}
          >
            <img 
              src={postImage} 
              alt={post.title} 
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span 
              className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full flex items-center gap-1.5"
              style={{
                background: 'rgba(78,112,85,0.9)',
                color: '#FFFDF8',
              }}
            >
              <ShoppingBag size={12} />
              FOR SALE
            </span>
            <span 
              className="absolute top-3 right-3 px-2 py-1 text-xs font-medium rounded-md flex items-center gap-1"
              style={{
                background: 'rgba(0,0,0,0.6)',
                color: '#FFFDF8',
              }}
            >
              <MapPin size={11} />
              {post.distance !== undefined && post.distance !== null
                ? `${post.distance < 1 ? Math.round(post.distance * 1000) + 'm' : post.distance.toFixed(1) + 'km'}`
                : 'Nearby'}
            </span>
          </div>
        ) : (
          <div 
            className="w-full h-48 flex items-center justify-center"
            style={{ background: 'var(--surface-1)' }}
          >
            <Package size={40} style={{ color: 'var(--text-secondary)', opacity: 0.3 }} />
          </div>
        )}

          <div className="p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            {!postImage && (
              <span 
                className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full flex items-center gap-1.5"
                style={{
                  background: 'rgba(78,112,85,0.12)',
                  color: 'var(--color-jade)',
                }}
              >
                <ShoppingBag size={12} />
                FOR SALE
              </span>
            )}
          </div>

          <div>
            <h3 className="font-bold text-base text-[var(--text-primary)] leading-snug line-clamp-2 mb-2">
              {post.title}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2">
              {post.description}
            </p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex flex-col gap-1">
              <span className="text-lg font-bold text-[var(--text-primary)]">
                ₹{post.price}
              </span>
              {post.condition && (
                <span className="text-xs font-medium text-[var(--text-secondary)] capitalize">
                  {post.condition.replace('_', ' ')}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div 
                  className="w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center uppercase" 
                  style={{ background: 'var(--accent-primary)', color: '#FFFDF8' }}
                >
                  {post.owner_details?.first_name?.[0] || 'U'}
                </div>
              </div>
              <span className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1">
                <MessageSquare size={12} />
                {post.offers_count || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="app-container mx-auto px-6 py-8" style={{ background: 'var(--bg-page)' }}>
      {/* Compact Page Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h1 className="text-3xl font-serif font-bold text-[var(--text-primary)] mb-2">
              Neighborhood Marketplace
            </h1>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-xl">
              Buy, sell, borrow or request what you need from people nearby.
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-3 text-sm font-bold rounded-full active:scale-95 transition-all cursor-pointer flex items-center gap-2 shadow-button shrink-0"
            style={{
              background: 'var(--accent-primary)',
              color: '#FFFDF8',
            }}
          >
            <Plus size={18} />
            Post Need or Sell Item
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <MapPin size={14} style={{ color: 'var(--accent-primary)' }} />
          <span className="font-semibold text-[var(--text-primary)]">
            {profile.location_name?.split(',')[0] || 'Your Location'}
          </span>
          <button
            onClick={() => setIsEditingProfile(true)}
            className="text-xs font-semibold text-[var(--accent-primary)] hover:underline ml-2"
          >
            Change location
          </button>
        </div>
      </div>

      {/* Discovery Controls Region */}
      <div className="mb-5 space-y-3">
        {/* Search Bar - Wider on large desktop */}
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-[950px]">
          <input
            type="text"
            placeholder="Search items, requests, or services nearby..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 text-base rounded-2xl border-2 outline-none font-medium transition-all focus:border-[var(--accent-primary)]"
            style={{
              background: 'var(--surface-2)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border)',
            }}
          />
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 text-sm font-bold rounded-xl transition-all"
            style={{
              background: 'var(--accent-primary)',
              color: '#FFFDF8',
            }}
          >
            Search
          </button>
        </form>

        {/* Primary Toolbar - Tabs + Radius Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* LEFT: Type Tabs */}
          <div 
            className="flex p-1.5 rounded-2xl border"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          >
            <button
              onClick={() => setSelectedType('all')}
              className="px-5 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer"
              style={{
                background: selectedType === 'all' ? 'var(--text-primary)' : 'transparent',
                color: selectedType === 'all' ? 'var(--bg-page)' : 'var(--text-secondary)',
              }}
            >
              All
            </button>
            <button
              onClick={() => setSelectedType('need')}
              className="px-5 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2"
              style={{
                background: selectedType === 'need' ? 'var(--color-heat)' : 'transparent',
                color: selectedType === 'need' ? '#FFFDF8' : 'var(--text-secondary)',
              }}
            >
              <HeartHandshake size={16} />
              Needs
            </button>
            <button
              onClick={() => setSelectedType('sell')}
              className="px-5 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2"
              style={{
                background: selectedType === 'sell' ? 'var(--color-jade)' : 'transparent',
                color: selectedType === 'sell' ? '#FFFDF8' : 'var(--text-secondary)',
              }}
            >
              <ShoppingBag size={16} />
              For Sale
            </button>
            <button
              onClick={() => setSelectedType('my_posts')}
              className="px-5 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer"
              style={{
                background: selectedType === 'my_posts' ? 'var(--accent-primary)' : 'transparent',
                color: selectedType === 'my_posts' ? '#FFFDF8' : 'var(--text-secondary)',
              }}
            >
              My Posts & Offers
            </button>
          </div>

          {/* RIGHT: Radius Controls */}
          {selectedType !== 'my_posts' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--text-secondary)] mr-1">Radius:</span>
              {RADII.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setSelectedRadius(r.value)}
                  className="px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all"
                  style={{
                    background: selectedRadius === r.value ? 'var(--accent-primary)' : 'var(--surface-2)',
                    color: selectedRadius === r.value ? '#FFFDF8' : 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category Rail */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="px-4 py-2 text-xs font-semibold rounded-full whitespace-nowrap cursor-pointer transition-all hover:-translate-y-0.5"
              style={{
                background: selectedCategory === cat ? 'var(--accent-primary)' : 'var(--surface-2)',
                color: selectedCategory === cat ? '#FFFDF8' : 'var(--text-secondary)',
                border: '1px solid var(--border)',
                boxShadow: selectedCategory === cat ? 'var(--shadow-button)' : 'none',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sub-tabs for My Posts */}
        {selectedType === 'my_posts' && (
          <div 
            className="flex gap-2 p-1.5 rounded-2xl border inline-flex"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          >
            <button
              onClick={() => setMySubTab('my_listings')}
              className="px-4 py-2 text-sm font-bold rounded-xl transition-all cursor-pointer"
              style={{
                background: mySubTab === 'my_listings' ? 'var(--text-primary)' : 'transparent',
                color: mySubTab === 'my_listings' ? 'var(--bg-page)' : 'var(--text-secondary)',
              }}
            >
              My Listings ({posts.length})
            </button>
            <button
              onClick={() => setMySubTab('my_offers')}
              className="px-4 py-2 text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2"
              style={{
                background: mySubTab === 'my_offers' ? 'var(--text-primary)' : 'transparent',
                color: mySubTab === 'my_offers' ? 'var(--bg-page)' : 'var(--text-secondary)',
              }}
            >
              <Send size={14} />
              My Offers ({myOffers.length})
            </button>
          </div>
        )}
      </div>

      {/* Near You Section Header */}
      {!feedLoading && selectedType !== 'my_posts' && posts.length > 0 && (
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-serif font-bold text-[var(--text-primary)]">
              Near You
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {posts.length} {posts.length === 1 ? 'listing' : 'listings'} within {selectedRadius} km
            </p>
          </div>
        </div>
      )}

      {/* Listing Grid */}
      {feedLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[var(--accent-primary)]" />
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            Finding items near you...
          </p>
        </div>
      ) : selectedType === 'my_posts' && mySubTab === 'my_offers' ? (
        myOffers.length === 0 ? (
          <div className="py-32 text-center">
            <Send className="w-16 h-16 mb-4 mx-auto text-[var(--text-secondary)] opacity-30" />
            <h3 className="text-xl font-serif font-bold text-[var(--text-primary)] mb-2">
              No submitted offers yet
            </h3>
            <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-6">
              Browse nearby neighbor posts and make offers to start connecting with your community.
            </p>
            <button
              onClick={() => setSelectedType('all')}
              className="px-6 py-3 text-sm font-bold rounded-full transition-all"
              style={{ background: 'var(--accent-primary)', color: '#FFFDF8' }}
            >
              Browse Marketplace
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {myOffers.map((offer) => {
              const isAccepted = offer.status === 'accepted';
              const isRejected = offer.status === 'rejected';

              return (
                <div
                  key={offer.id}
                  className="p-5 flex flex-col gap-4 relative overflow-hidden rounded-2xl"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-card)',
                  }}
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h4 className="text-base font-bold text-[var(--text-primary)] line-clamp-2">
                        {offer.post_details?.title || 'Marketplace Item'}
                      </h4>
                      <span
                        className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-full flex items-center gap-1 shrink-0"
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

                    <div className="flex items-center gap-2 mb-3">
                      <span 
                        className="px-3 py-1 text-sm font-bold rounded-lg"
                        style={{ background: 'rgba(154,101,60,0.12)', color: 'var(--accent-primary)' }}
                      >
                        Your Offer: ₹{offer.price}
                      </span>
                    </div>

                    <p className="text-sm text-[var(--text-primary)] italic p-3 rounded-xl bg-[var(--bg-page)]">
                      "{offer.message}"
                    </p>
                  </div>

                  <div className="flex gap-2 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                    {offer.post_details && (
                      <button
                        onClick={() => { setSelectedPost(offer.post_details!); setIsDetailModalOpen(true); }}
                        className="flex-1 px-3 py-2 text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
                        style={{ background: 'var(--bg-page)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                      >
                        <Eye size={14} /> View Post
                      </button>
                    )}
                    {offer.post_details?.owner && (
                      <button
                        onClick={() => {
                          setChatRecipientId(offer.post_details!.owner!);
                          setChatRecipientName(offer.post_details!.owner_details?.display_name || 'Owner');
                          setChatPostId(offer.post);
                          setIsChatOpen(true);
                        }}
                        className="flex-1 px-3 py-2 text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
                        style={{ background: 'var(--accent-primary)', color: '#FFFDF8' }}
                      >
                        <MessageSquare size={14} /> Chat
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : posts.length === 0 ? (
        <div className="py-32 text-center">
          <Package className="w-16 h-16 mb-4 mx-auto text-[var(--text-secondary)] opacity-30" />
          <h3 className="text-xl font-serif font-bold text-[var(--text-primary)] mb-2">
            {selectedType === 'my_posts' ? 'No listings yet' : 'No listings found nearby'}
          </h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-6">
            {selectedType === 'my_posts' 
              ? 'Start posting items you want to sell or things you need from neighbors.'
              : `No active posts within ${selectedRadius}km. Try expanding your radius or post what you need.`
            }
          </p>
          <div className="flex items-center justify-center gap-3">
            {selectedType !== 'my_posts' && (
              <button
                onClick={() => setSelectedRadius(Math.min(selectedRadius * 2, 50))}
                className="px-6 py-3 text-sm font-bold rounded-full transition-all"
                style={{ background: 'var(--surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
              >
                Increase Radius
              </button>
            )}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 text-sm font-bold rounded-full transition-all flex items-center gap-2"
              style={{ background: 'var(--accent-primary)', color: '#FFFDF8' }}
            >
              <Plus size={16} />
              {selectedType === 'my_posts' ? 'Create First Post' : 'Post What You Need'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 justify-items-start">
            {posts.map((post) => 
              post.post_type === 'need' ? renderNeedCard(post) : renderSellCard(post)
            )}
          </div>

          {/* Demand Generation CTA for sparse results */}
          {posts.length > 0 && posts.length < 6 && selectedType !== 'my_posts' && (
            <div 
              className="mt-20 py-16 px-12 text-center rounded-2xl"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <h3 className="text-2xl font-serif font-bold text-[var(--text-primary)] mb-3">
                Can't find what you need?
              </h3>
              <p className="text-base text-[var(--text-secondary)] mb-8 max-w-xl mx-auto leading-relaxed">
                Tell your neighborhood what you're looking for. Nearby people can respond with an item, service or offer.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-10 py-4 text-base font-bold rounded-full transition-all inline-flex items-center gap-2.5"
                style={{ background: 'var(--accent-primary)', color: '#FFFDF8', boxShadow: 'var(--shadow-button)' }}
              >
                <Plus size={20} />
                Post a Need
              </button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        defaultLocationName={profile.location_name}
        defaultLat={profile.latitude}
        defaultLng={profile.longitude}
        onPostCreated={() => {
          setRefreshKey((prev) => prev + 1);
          setIsCreateModalOpen(false);
        }}
      />

      <PostDetailModal
        post={selectedPost}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        currentUserId={user.id}
        currentUserEmail={user.email}
        onOpenChat={(otherUserId, otherUserName, postId) => {
          setChatRecipientId(otherUserId);
          setChatRecipientName(otherUserName);
          setChatPostId(postId);
          setIsChatOpen(true);
        }}
        onPostUpdated={() => {
          fetchProfile();
          setRefreshKey((prev) => prev + 1);
        }}
      />

      {chatRecipientId && (
        <ChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          otherUserId={chatRecipientId}
          otherUserName={chatRecipientName}
          postId={chatPostId}
          currentUserId={user.id}
          currentUserEmail={user.email}
        />
      )}
    </main>
  );
}
