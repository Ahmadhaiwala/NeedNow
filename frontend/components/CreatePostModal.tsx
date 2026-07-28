'use client';

import React, { useState, useEffect } from 'react';
import { 
  createMarketplacePost, 
  MarketplacePost 
} from '@/lib/marketplace';
import LocationPicker from './LocationPicker';
import { 
  X, 
  HeartHandshake, 
  ShoppingBag, 
  Flame, 
  Clock, 
  Tag, 
  IndianRupee, 
  Loader2, 
  Info,
  Sparkles
} from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLocationName: string;
  defaultLat: number;
  defaultLng: number;
  onPostCreated: () => void;
}

const CATEGORIES = [
  'Books & Education',
  'Electronics & Gadgets',
  'Home & Kitchen',
  'Tools & Equipment',
  'Clothing & Apparel',
  'Services & Favors',
  'Others',
];

export default function CreatePostModal({
  isOpen,
  onClose,
  defaultLocationName,
  defaultLat,
  defaultLng,
  onPostCreated,
}: CreatePostModalProps) {
  const [postType, setPostType] = useState<'need' | 'sell'>('need');
  
  // Common Form Fields with draft persistence
  const [title, setTitle] = useState(() => {
    if (typeof window !== 'undefined') return sessionStorage.getItem('draft_title') || '';
    return '';
  });
  const [description, setDescription] = useState(() => {
    if (typeof window !== 'undefined') return sessionStorage.getItem('draft_desc') || '';
    return '';
  });
  const [category, setCategory] = useState('Books & Education');
  const [locationName, setLocationName] = useState(defaultLocationName);
  const [latitude, setLatitude] = useState(defaultLat);
  const [longitude, setLongitude] = useState(defaultLng);
  const [radius, setRadius] = useState(10); // default 10km radius for post

  // Need Specific Fields
  const [urgency, setUrgency] = useState<'today' | 'week' | 'flexible'>('today');
  const [budget, setBudget] = useState(() => {
    if (typeof window !== 'undefined') return sessionStorage.getItem('draft_budget') || '';
    return '';
  });

  // Sell Specific Fields
  const [condition, setCondition] = useState<'new' | 'like_new' | 'good' | 'fair' | 'poor'>('good');
  const [price, setPrice] = useState(() => {
    if (typeof window !== 'undefined') return sessionStorage.getItem('draft_price') || '';
    return '';
  });

  // Optional Image URL
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('draft_title', title);
      sessionStorage.setItem('draft_desc', description);
      sessionStorage.setItem('draft_budget', budget);
      sessionStorage.setItem('draft_price', price);
    }
  }, [title, description, budget, price]);

  // Status & Error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please provide a title for your post.');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a description.');
      return;
    }

    if (!locationName.trim() || !latitude || !longitude) {
      setError('Please select and verify a location for this post.');
      return;
    }

    setLoading(true);

    try {
      const payload: Partial<MarketplacePost> = {
        post_type: postType,
        title: title.trim(),
        description: description.trim(),
        category,
        location_name: locationName,
        latitude: parseFloat(String(latitude)),
        longitude: parseFloat(String(longitude)),
        radius,
        images: imageUrl.trim() ? [imageUrl.trim()] : [],
      };

      if (postType === 'need') {
        payload.urgency = urgency;
        payload.budget = budget.trim() ? budget.trim() : undefined;
      } else {
        if (!price.trim()) {
          setError('Please provide a selling price.');
          setLoading(false);
          return;
        }
        payload.condition = condition;
        payload.price = price.trim();
      }

      await createMarketplacePost(payload);
      setTitle('');
      setDescription('');
      setBudget('');
      setPrice('');
      setImageUrl('');
      onPostCreated();
      onClose();
    } catch (err: any) {
      console.error('Error creating post:', err);
      setError(err.message || 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div 
        className="w-full max-w-xl max-h-[85vh] overflow-y-auto p-6 sm:p-8 relative my-auto scrollbar-thin"
        style={{
          background: 'var(--surface-3)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-modal)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-[var(--text-primary)] flex items-center gap-2">
            <Sparkles size={22} className="text-[var(--color-juice)]" />
            Create Marketplace Post
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Request an item you need or list something to sell nearby
          </p>
        </div>

        {/* Post Type Selector Tabs */}
        <div className="grid grid-cols-2 gap-3 mb-6 p-1.5 bg-[var(--surface-2)] rounded-[var(--radius-md)] border" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={() => setPostType('need')}
            className={`py-3 px-4 rounded-[var(--radius-sm)] font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              postType === 'need'
                ? 'bg-[rgba(231,63,60,0.15)] text-[var(--color-heat)] border border-[rgba(231,63,60,0.3)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <HeartHandshake size={18} />
            Need Something
          </button>

          <button
            type="button"
            onClick={() => setPostType('sell')}
            className={`py-3 px-4 rounded-[var(--radius-sm)] font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              postType === 'sell'
                ? 'bg-[rgba(2,90,92,0.15)] text-[var(--color-jade)] border border-[rgba(2,90,92,0.3)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <ShoppingBag size={18} />
            Sell Something
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div 
            className="p-4 mb-6 text-xs font-semibold rounded-[var(--radius-sm)] flex gap-2 items-center"
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* TITLE INPUT */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Post Title *
            </label>
            <input
              type="text"
              placeholder={
                postType === 'need'
                  ? "e.g. Need a power drill for 2 hours today"
                  : "e.g. Selling Logitech Wireless Mouse (Like New)"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-4 text-sm bg-[var(--surface-2)] text-[var(--text-primary)] rounded-[var(--radius-md)] border focus:ring-2 focus:ring-[var(--color-juice)] outline-none"
              style={{ borderColor: 'var(--border)' }}
            />
          </div>

          {/* CATEGORY SELECTOR */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-4 text-sm bg-[var(--surface-2)] text-[var(--text-primary)] rounded-[var(--radius-md)] border focus:ring-2 focus:ring-[var(--color-juice)] outline-none cursor-pointer"
              style={{ borderColor: 'var(--border)' }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* NEED SPECIFIC: URGENCY & BUDGET */}
          {postType === 'need' && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1">
                  <Flame size={14} className="text-[var(--color-heat)]" />
                  Urgency *
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'today', label: '🔥 Today' },
                    { id: 'week', label: '⚡ This Week' },
                    { id: 'flexible', label: 'Flexible' },
                  ].map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setUrgency(u.id as any)}
                      className={`flex-1 py-3 text-xs font-bold rounded-[var(--radius-md)] border transition-all cursor-pointer ${
                        urgency === u.id
                          ? 'bg-[var(--text-primary)] text-[var(--surface-3)]'
                          : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                      style={{ borderColor: 'var(--border)' }}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1">
                  <IndianRupee size={14} />
                  Max Budget (Optional)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 500 (or leave blank for free)"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full p-4 text-sm bg-[var(--surface-2)] text-[var(--text-primary)] rounded-[var(--radius-md)] border focus:ring-2 focus:ring-[var(--color-juice)] outline-none"
                  style={{ borderColor: 'var(--border)' }}
                />
              </div>
            </div>
          )}

          {/* SELL SPECIFIC: CONDITION & PRICE */}
          {postType === 'sell' && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  Item Condition *
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as any)}
                  className="w-full p-4 text-sm bg-[var(--surface-2)] text-[var(--text-primary)] rounded-[var(--radius-md)] border focus:ring-2 focus:ring-[var(--color-juice)] outline-none cursor-pointer"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <option value="new">New (Unopened)</option>
                  <option value="like_new">Like New (Barely used)</option>
                  <option value="good">Good (Fully functional)</option>
                  <option value="fair">Fair (Visible wear)</option>
                  <option value="poor">Poor (Needs repair)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1">
                  <IndianRupee size={14} />
                  Selling Price (₹) *
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1200"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full p-4 text-sm bg-[var(--surface-2)] text-[var(--text-primary)] rounded-[var(--radius-md)] border focus:ring-2 focus:ring-[var(--color-juice)] outline-none"
                  style={{ borderColor: 'var(--border)' }}
                />
              </div>
            </div>
          )}

          {/* DESCRIPTION */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Description *
            </label>
            <textarea
              placeholder="Add details, condition, availability, or preferred pickup times..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[90px] p-4 text-sm bg-[var(--surface-2)] text-[var(--text-primary)] rounded-[var(--radius-md)] border focus:ring-2 focus:ring-[var(--color-juice)] outline-none resize-none"
              style={{ borderColor: 'var(--border)' }}
            />
          </div>

          {/* IMAGE URL */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center justify-between">
              <span>Item Image URL (Optional)</span>
              <span className="text-[10px] text-[var(--text-secondary)] font-normal">Direct HTTP/HTTPS link</span>
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/photo-... or item image link"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full p-4 text-sm bg-[var(--surface-2)] text-[var(--text-primary)] rounded-[var(--radius-md)] border outline-none"
              style={{ borderColor: 'var(--border)' }}
            />

            {imageUrl.trim() && (
              <div className="mt-2 p-2 rounded-xl border flex items-center gap-3 bg-[var(--surface-1)]" style={{ borderColor: 'var(--border)' }}>
                <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border" style={{ borderColor: 'var(--border)' }}>
                  <img 
                    src={imageUrl.trim()} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[var(--text-primary)]">Image Attached</p>
                  <p className="text-[10px] text-[var(--text-secondary)] truncate">{imageUrl.trim()}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-[rgba(231,63,60,0.12)] text-[var(--color-heat)] cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* LOCATION & RADIUS */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Post Location
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
              radius={radius}
            />
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-4 font-bold text-center text-sm rounded-[var(--radius-md)] hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
            style={{
              background: postType === 'need' ? 'var(--color-heat)' : 'var(--accent-primary)',
              color: postType === 'need' ? '#FFFFFF' : 'var(--color-core)',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Publishing Post...
              </>
            ) : (
              `Publish ${postType === 'need' ? 'Need Request' : 'Sell Listing'}`
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
