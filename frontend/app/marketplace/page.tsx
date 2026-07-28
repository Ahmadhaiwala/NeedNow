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
import { MapPin, User, Info, Compass, Loader2, X, Star } from 'lucide-react';
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

  useEffect(() => {
    if (profile) {
      setBio(profile.bio || '');
      setLocationName(profile.location_name || '');
      setLatitude(profile.latitude ?? null);
      setLongitude(profile.longitude ?? null);
    }
  }, [profile]);

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

  const [posts, setPosts] = useState<MarketplacePost[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);

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

  if (!isMounted || ((authLoading || profileLoading) && !profile)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
        <p className="text-xs text-[var(--text-secondary)] font-medium">Checking marketplace profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <main className="max-w-md mx-auto px-4 py-16">
        <div 
          className="p-8 text-center"
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <Compass className="w-12 h-12 mx-auto mb-4 text-[var(--accent-primary)]" />
          <h2 className="text-xl font-serif font-bold mb-2 text-[var(--text-primary)]">Community Marketplace</h2>
          <p className="mb-6 text-xs leading-relaxed text-[var(--text-secondary)]">
            Connect with neighbors to request items you need or sell things you no longer use.
          </p>
          <SignInButton className="w-full py-3 font-bold text-xs rounded-full cursor-pointer hover:opacity-90 transition-all shadow-sm">
            Sign In with Google
          </SignInButton>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="max-w-xl mx-auto px-4 py-8">
        <div 
          className="p-8"
          style={{
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
              <h2 className="text-lg font-serif font-bold text-[var(--text-primary)]">Marketplace Onboarding</h2>
              <p className="text-xs text-[var(--text-secondary)]">Setup your profile to find nearby items</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="flex flex-col gap-6">
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

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                About You (Bio)
              </label>
              <textarea
                placeholder="Write a brief intro..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full min-h-[90px] p-3 text-xs bg-[var(--bg-page)] text-[var(--text-primary)] rounded-xl border-0 outline-none resize-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                Your Neighborhood / Location
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
              disabled={!isFormDirty || submitLoading}
              className="w-full py-3.5 text-xs font-bold text-center rounded-full transition-all cursor-pointer shadow-sm"
              style={{
                background: isFormDirty ? 'var(--accent-primary)' : 'rgba(0,0,0,0.1)',
                color: isFormDirty ? '#FFFDF8' : 'var(--text-secondary)',
              }}
            >
              {submitLoading ? 'Saving Profile...' : 'Activate Marketplace Profile'}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div 
        className="p-6 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <h2 className="text-lg font-serif font-bold text-[var(--text-primary)]">Welcome, {user.name}!</h2>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
              <MapPin size={12} style={{ color: 'var(--accent-primary)' }} />
              Active location: {profile.location_name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsReviewsModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5"
            style={{
              background: 'rgba(154,101,60,0.12)',
              color: 'var(--accent-primary)',
              border: 'none',
            }}
          >
            <Star size={13} className="fill-warning text-warning" />
            My Ratings & Reviews
          </button>
          <button 
            onClick={handleStartEditing}
            className="px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer"
            style={{
              background: 'var(--bg-page)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            Edit Location
          </button>
        </div>
      </div>

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

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        defaultLocationName={profile.location_name}
        defaultLat={profile.latitude}
        defaultLng={profile.longitude}
        onPostCreated={() => {
          setRefreshKey((prev) => prev + 1);
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

      <UserReviewsModal
        isOpen={isReviewsModalOpen}
        onClose={() => setIsReviewsModalOpen(false)}
        myReviews={true}
      />
    </main>
  );
}
