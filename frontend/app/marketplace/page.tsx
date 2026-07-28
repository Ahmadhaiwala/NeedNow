'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, SignInButton } from '@/lib/auth';
import { 
  getMarketplaceProfile, 
  createMarketplaceProfile,
  updateMarketplaceProfile, 
  getMarketplacePosts,
  MarketplacePost 
} from '@/lib/marketplace';
import { MapPin, User, Info, Compass, HelpCircle, Loader2, X, Star } from 'lucide-react';
import LocationPicker from '@/components/LocationPicker';
import MarketplaceFeed from '@/components/MarketplaceFeed';
import CreatePostModal from '@/components/CreatePostModal';
import PostDetailModal from '@/components/PostDetailModal';
import ChatDrawer from '@/components/ChatDrawer';
import UserReviewsModal from '@/components/UserReviewsModal';

export default function MarketplacePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Mount effect to hydrate client-side sessionStorage cache without SSR hydration mismatch
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
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
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

  // Pre-fill form fields whenever profile is loaded or updated
  useEffect(() => {
    if (profile) {
      setBio(profile.bio || '');
      setLocationName(profile.location_name || '');
      setLatitude(profile.latitude ?? null);
      setLongitude(profile.longitude ?? null);
    }
  }, [profile]);

  // Compute dirty form state (activates submit button only when fields are changed)
  const isFormDirty = useMemo(() => {
    if (!profile) {
      return Boolean(bio.trim() && locationName.trim());
    }
    return (
      bio.trim() !== (profile.bio || '').trim() ||
      locationName.trim() !== (profile.location_name || '').trim() ||
      (latitude !== null && latitude !== profile.latitude) ||
      (longitude !== null && longitude !== profile.longitude)
    );
  }, [profile, bio, locationName, latitude, longitude]);

  const handleStartEditing = () => {
    if (profile) {
      setBio(profile.bio || '');
      setLocationName(profile.location_name || '');
      setLatitude(profile.latitude ?? null);
      setLongitude(profile.longitude ?? null);
    }
    setError(null);
    setIsEditingProfile(true);
  };

  // Feed State
  const [posts, setPosts] = useState<MarketplacePost[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);

  // Check if profile exists
  useEffect(() => {
    if (user) {
      fetchProfile();
    } else if (!authLoading) {
      setProfileLoading(false);
    }
  }, [user, authLoading]);

  const fetchProfile = async () => {
    if (!profile) setProfileLoading(true);
    setError(null);
    try {
      const data = await getMarketplaceProfile();
      setProfile(data);
      if (data && user && typeof window !== 'undefined') {
        sessionStorage.setItem(`marketplace_profile_cache_${user.id}`, JSON.stringify(data));
      }
      if (data) {
        // User already has a profile, fetch the feed
        fetchFeed(data.latitude, data.longitude);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchFeed = async (lat?: number | null, lng?: number | null) => {
    setFeedLoading(true);
    try {
      const data = await getMarketplacePosts({
        latitude: lat,
        longitude: lng,
      });
      setPosts(data || []);
    } catch (err) {
      console.error('Error fetching feed:', err);
      setPosts([]);
    } finally {
      setFeedLoading(false);
    }
  };

  // Submit profile creation or update
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
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('marketplace_profile_cache', JSON.stringify(newProfile));
      }
      setIsEditingProfile(false);
      fetchFeed(finalLat!, finalLng!);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // ── LOADING STATE ──
  if (!isMounted || ((authLoading || profileLoading) && !profile)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--color-juice)]" />
        <p className="text-[var(--text-secondary)] font-medium">Checking marketplace registration...</p>
      </div>
    );
  }

  // ── UNAUTHENTICATED STATE ──
  if (!user) {
    return (
      <main className="max-w-md mx-auto px-4 py-16">
        <div 
          className="p-8 text-center"
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <Compass className="w-16 h-16 mx-auto mb-4 text-[var(--color-sky)]" />
          <h2 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">Community Marketplace</h2>
          <p className="mb-6 text-sm leading-relaxed text-[var(--text-secondary)]">
            Connect with neighbors to request items you need or sell things you no longer use. Syncs instantly with your local community.
          </p>
          <SignInButton className="w-full py-3 font-semibold rounded-[var(--radius-md)] cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all">
            Sign In with Google
          </SignInButton>
        </div>
      </main>
    );
  }

  // ── ONBOARDING STATE (No Profile Setup Yet) ──
  if (!profile) {
    return (
      <main className="max-w-xl mx-auto px-4 py-8">
        <div 
          className="p-8"
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-[var(--radius-sm)] bg-[rgba(202,206,0,0.12)]">
              <User className="w-6 h-6 text-[var(--color-juice)]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Marketplace Onboarding</h2>
              <p className="text-xs text-[var(--text-secondary)]">Setup your profile to find nearby items</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="flex flex-col gap-6">
            {error && (
              <div 
                className="p-4 text-xs font-semibold rounded-[var(--radius-sm)] flex gap-2 items-center"
                style={{
                  background: 'rgba(231,63,60,0.12)',
                  color: 'var(--color-heat)',
                  border: '1px solid rgba(231,63,60,0.2)'
                }}
              >
                <Info size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* BIO INPUT */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                About You (Bio)
              </label>
              <textarea
                placeholder="Write a brief intro (e.g. 'I am a university student looking to trade course books and small electronic items. Happy to help!')"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full min-h-[100px] p-4 text-sm bg-[var(--bg-page)] text-[var(--text-primary)] rounded-[var(--radius-md)] border-0 focus:ring-2 focus:ring-[var(--color-juice)] outline-none resize-none"
              />
            </div>

            {/* LOCATION INPUT */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                Your Neighborhood / Location / Pincode
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
                placeholder="e.g. Ahmedabad, Bopal, 382210"
              />
            </div>

            {/* SUBMIT BUTTON WITH DIRTY ACTIVATION */}
            <button
              type="submit"
              disabled={!isFormDirty || submitLoading}
              className={`w-full mt-2 py-4 font-semibold text-center rounded-[var(--radius-md)] transition-all flex items-center justify-center gap-2 ${
                isFormDirty && !submitLoading
                  ? 'bg-[var(--accent-primary)] text-[var(--color-core)] cursor-pointer hover:opacity-90 active:scale-[0.98] shadow-md'
                  : 'bg-[var(--bg-page)] text-[var(--text-secondary)] border border-[rgba(31,54,53,0.1)] opacity-50 cursor-not-allowed'
              }`}
            >
              {submitLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving Profile...
                </>
              ) : isFormDirty ? (
                'Activate Marketplace Profile'
              ) : (
                'Fill Bio & Location to Activate'
              )}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // ── ACTIVE STATE ──
  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div 
        className="p-6 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Welcome, {user.name}!</h2>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
              <MapPin size={12} className="text-[var(--color-sky)]" />
              Active location: {profile.location_name}
            </p>
            <button 
              onClick={() => setIsReviewsModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[rgba(202,206,0,0.12)] border border-[rgba(202,206,0,0.25)] text-xs font-bold text-[var(--text-primary)] hover:opacity-90 cursor-pointer transition-all"
            >
              <Star size={12} className="fill-[#FFC107] text-[#FFC107]" />
              <span>{profile.rating > 0 ? Number(profile.rating).toFixed(1) : 'New'}</span>
              <span className="text-[var(--text-secondary)] font-medium">({profile.review_count || 0} reviews)</span>
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsReviewsModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-[var(--radius-md)] bg-[rgba(202,206,0,0.15)] text-[var(--text-primary)] hover:opacity-90 transition-all cursor-pointer border border-[rgba(202,206,0,0.3)] flex items-center gap-1.5"
          >
            <Star size={14} className="fill-[#FFC107] text-[#FFC107]" />
            My Ratings & Reviews
          </button>
          <button 
            onClick={handleStartEditing}
            className="px-4 py-2 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--bg-page)] hover:bg-[rgba(31,54,53,0.08)] transition-all cursor-pointer text-[var(--text-primary)] border border-[rgba(31,54,53,0.08)]"
          >
            Edit Profile / Location
          </button>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div 
            className="w-full max-w-xl max-h-[85vh] overflow-y-auto p-6 sm:p-8 relative my-auto scrollbar-thin"
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-modal)',
            }}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-[var(--radius-sm)] bg-[rgba(202,206,0,0.12)]">
                  <User className="w-5 h-5 text-[var(--color-juice)]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Edit Marketplace Profile</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Update your bio and primary search location</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditingProfile(false)}
                className="p-1.5 rounded-full hover:bg-[var(--bg-page)] text-[var(--text-secondary)] transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProfileSubmit} className="flex flex-col gap-5">
              {error && (
                <div className="p-4 text-xs font-semibold rounded-[var(--radius-sm)] bg-[rgba(231,63,60,0.12)] text-[var(--color-heat)] border border-[rgba(231,63,60,0.2)] flex items-center gap-2">
                  <Info size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* BIO INPUT */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--text-primary)]">
                  About You (Bio)
                </label>
                <textarea
                  placeholder="Tell neighbors about items you buy, sell, or trade..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full min-h-[90px] p-3 text-xs bg-[var(--bg-page)] text-[var(--text-primary)] rounded-[var(--radius-md)] border-0 focus:ring-2 focus:ring-[var(--color-juice)] outline-none resize-none"
                />
              </div>

              {/* LOCATION INPUT */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--text-primary)]">
                  Your Primary Location / Address
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
                  placeholder="e.g. Ahmedabad, Bopal, 382210"
                />
              </div>

              {/* ACTION BUTTONS WITH DIRTY STATE ACTIVATION */}
              <div className="flex justify-end items-center gap-3 pt-3 border-t border-[rgba(31,54,53,0.08)]">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2.5 text-xs font-bold rounded-[var(--radius-md)] bg-[var(--bg-page)] text-[var(--text-primary)] hover:bg-[rgba(31,54,53,0.08)] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isFormDirty || submitLoading}
                  className={`px-5 py-2.5 text-xs font-bold rounded-[var(--radius-md)] transition-all flex items-center gap-2 ${
                    isFormDirty && !submitLoading
                      ? 'bg-[var(--accent-primary)] text-[var(--color-core)] cursor-pointer hover:opacity-90 active:scale-[0.98] shadow-md'
                      : 'bg-[var(--bg-page)] text-[var(--text-secondary)] border border-[rgba(31,54,53,0.1)] opacity-50 cursor-not-allowed'
                  }`}
                >
                  {submitLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving Changes...
                    </>
                  ) : isFormDirty ? (
                    'Save Profile Changes'
                  ) : (
                    'No Changes Made'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MarketplaceFeed
        refreshTrigger={refreshKey}
        userLat={profile.latitude}
        userLng={profile.longitude}
        userLocationName={profile.location_name}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onSelectPost={(post) => {
          setSelectedPost(post);
          setIsDetailModalOpen(true);
        }}
        onOpenChat={(otherUserId, otherUserName, postId) => {
          setChatRecipientId(otherUserId);
          setChatRecipientName(otherUserName);
          setChatPostId(postId);
          setIsChatOpen(true);
        }}
      />

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        defaultLocationName={profile.location_name}
        defaultLat={profile.latitude}
        defaultLng={profile.longitude}
        onPostCreated={() => {
          setRefreshKey((prev) => prev + 1); // Refresh feed
        }}
      />

      {/* Post Detail & Offers Modal */}
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

      {/* Live Polling Chat Drawer */}
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
      {/* My Reviews Modal */}
      <UserReviewsModal
        isOpen={isReviewsModalOpen}
        onClose={() => setIsReviewsModalOpen(false)}
        myReviews={true}
      />
    </main>
  );
}
