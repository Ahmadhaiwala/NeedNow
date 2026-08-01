'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Upload, 
  Trash2, 
  MapPin, 
  Tag, 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  Sparkles,
  Info,
  DollarSign,
  Compass
} from 'lucide-react';
import { createMarketplacePost, uploadPostImages } from '@/lib/marketplace';
import LocationPicker from '@/components/LocationPicker';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
  userLat?: number | null;
  userLng?: number | null;
  userLocationName?: string;
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

const POST_TYPES = [
  { id: 'sell', label: 'For Sale', desc: 'List an item you want to sell' },
  { id: 'need', label: 'Want / Need', desc: 'Post what you are looking to buy or borrow' },
  { id: 'rent', label: 'For Rent', desc: 'Rent out an item or property' },
  { id: 'exchange', label: 'Trade & Swap', desc: 'Exchange items or skills with neighbors' },
  { id: 'donate', label: 'Free / Donate', desc: 'Give away items for free' },
  { id: 'service', label: 'Service', desc: 'Offer a skill or favor' },
];

export default function CreatePostModal({
  isOpen,
  onClose,
  onPostCreated,
  userLat,
  userLng,
  userLocationName,
}: CreatePostModalProps) {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [postType, setPostType] = useState<any>('sell');
  const [category, setCategory] = useState<string>('Electronics & Gadgets');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [budget, setBudget] = useState('');
  const [condition, setCondition] = useState('Like New');
  const [urgency, setUrgency] = useState('Flexible');
  const [locationName, setLocationName] = useState(userLocationName || 'Downtown');
  const [latitude, setLatitude] = useState<number>(userLat || 40.7128);
  const [longitude, setLongitude] = useState<number>(userLng || -74.0060);
  const [visibilityRadius, setVisibilityRadius] = useState<number>(5);

  // Image Upload State
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newFiles = [...imageFiles, ...filesArray].slice(0, 10);
      setImageFiles(newFiles);

      const previews = newFiles.map((file) => URL.createObjectURL(file));
      setImagePreviews(previews);
    }
  };

  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    const previews = newFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('post_type', postType);
      formData.append('category', category);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('location_name', locationName);
      formData.append('latitude', String(latitude));
      formData.append('longitude', String(longitude));
      formData.append('visibility_radius', String(visibilityRadius));
      if (price) formData.append('price', price);
      if (budget) formData.append('budget', budget);
      if (condition) formData.append('condition', condition);
      if (urgency) formData.append('urgency', urgency);

      imageFiles.forEach((file) => {
        formData.append('images', file);
      });

      const newPost = await createMarketplacePost(formData);

      setLoading(false);
      onPostCreated();
      onClose();
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to create listing');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl flex flex-col z-10 shadow-modal"
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border)',
          }}
        >
          {/* Header */}
          <div className="p-6 border-b border-[var(--border-muted)] flex items-center justify-between shrink-0">
            <div>
              <h2 className="font-serif font-extrabold text-2xl" style={{ color: 'var(--foreground)' }}>
                Create a New Listing
              </h2>
              <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                Step {step} of 5 — {step === 1 ? 'Type & Category' : step === 2 ? 'Details & Pricing' : step === 3 ? 'Location & Radius' : step === 4 ? 'Photos' : 'Preview & Publish'}
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all hover:bg-[var(--surface-2)]"
              style={{ color: 'var(--foreground-muted)' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Stepper Progress Bar */}
          <div className="px-6 py-3 bg-[var(--surface-2)] border-b border-[var(--border-muted)] flex items-center justify-between gap-2 shrink-0">
            {['1. Type', '2. Details', '3. Location', '4. Photos', '5. Preview'].map((lbl, idx) => {
              const stepNum = idx + 1;
              const isActive = step === stepNum;
              const isCompleted = step > stepNum;
              return (
                <div key={lbl} className="flex-1 flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                      isActive ? 'bg-[var(--accent)] text-white' : isCompleted ? 'bg-[var(--success)] text-white' : 'bg-[var(--surface-1)] text-[var(--foreground-muted)]'
                    }`}
                  >
                    {isCompleted ? <Check size={12} /> : stepNum}
                  </div>
                  <span className={`text-xs font-medium hidden sm:inline ${isActive ? 'text-[var(--foreground)] font-bold' : 'text-[var(--foreground-muted)]'}`}>
                    {lbl.split('. ')[1]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Step Body Container */}
          <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
            {error && (
              <div className="p-3.5 rounded-xl text-xs font-semibold bg-red-500/10 text-red-600 border border-red-500/20">
                {error}
              </div>
            )}

            {/* Step 1: Type & Category */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--foreground-muted)' }}>
                    Select Listing Type
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {POST_TYPES.map((pt) => (
                      <div
                        key={pt.id}
                        onClick={() => setPostType(pt.id)}
                        className={`p-4 rounded-2xl cursor-pointer border transition-all ${
                          postType === pt.id ? 'border-[var(--accent)] bg-[var(--accent-muted)]' : 'border-[var(--border)] bg-[var(--surface-2)]'
                        }`}
                      >
                        <h4 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>{pt.label}</h4>
                        <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>{pt.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--foreground-muted)' }}>
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-3 rounded-xl text-sm outline-none font-medium"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Step 2: Details & Pricing */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--foreground-muted)' }}>
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. MacBook Air M2 256GB - Mint Condition"
                    className="w-full p-3 rounded-xl text-sm outline-none font-medium"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--foreground-muted)' }}>
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your item, features, reason for selling, or specific requirements..."
                    className="w-full p-3 rounded-xl text-sm outline-none font-medium"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {postType === 'need' ? (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--foreground-muted)' }}>
                        Budget (₹)
                      </label>
                      <input
                        type="number"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        placeholder="e.g. 50000"
                        className="w-full p-3 rounded-xl text-sm outline-none font-medium"
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--foreground-muted)' }}>
                        Price (₹)
                      </label>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="e.g. 58000"
                        className="w-full p-3 rounded-xl text-sm outline-none font-medium"
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--foreground-muted)' }}>
                      Condition
                    </label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      className="w-full p-3 rounded-xl text-sm outline-none font-medium"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                    >
                      <option value="New">Brand New</option>
                      <option value="Like New">Like New</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Location & Radius */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--foreground-muted)' }}>
                    Location Name
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      className="flex-1 p-3 rounded-xl text-sm outline-none font-medium"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                    />
                    <button
                      onClick={() => setIsPickerOpen(true)}
                      className="px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                      style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}
                    >
                      <MapPin size={15} /> Pick on Map
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--foreground-muted)' }}>
                      Visibility Radius
                    </label>
                    <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>{visibilityRadius} km</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={visibilityRadius}
                    onChange={(e) => setVisibilityRadius(Number(e.target.value))}
                    className="w-full accent-[var(--accent)]"
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--foreground-muted)' }}>
                    Your listing will be highlighted to users within this geographical distance.
                  </p>
                </div>

                <LocationPicker
                  value={locationName}
                  onChange={(name: string, lat: number, lng: number) => {
                    setLatitude(lat);
                    setLongitude(lng);
                    setLocationName(name);
                  }}
                  lat={latitude}
                  lng={longitude}
                />
              </div>
            )}

            {/* Step 4: Multi-Image Uploader */}
            {step === 4 && (
              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--foreground-muted)' }}>
                  Add Photos (Up to 10 photos)
                </label>

                {/* Drag-and-drop Dropzone */}
                <div
                  className="p-8 border-2 border-dashed rounded-2xl text-center flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-[var(--surface-2)]"
                  style={{ borderColor: 'var(--border)' }}
                  onClick={() => document.getElementById('photo-input')?.click()}
                >
                  <Upload size={32} className="mb-2 text-[var(--accent)]" />
                  <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                    Drag & drop or click to upload
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--foreground-muted)' }}>
                    PNG, JPG, WEBP up to 10MB each
                  </p>
                  <input
                    id="photo-input"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>

                {/* Preview Grid */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-4">
                    {imagePreviews.map((src, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-[var(--border)]">
                        <img src={src} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Final Preview */}
            {step === 5 && (
              <div className="space-y-4">
                <h3 className="font-serif font-bold text-lg" style={{ color: 'var(--foreground)' }}>
                  Listing Preview
                </h3>
                <div className="p-4 rounded-2xl flex items-center gap-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-black/5 shrink-0">
                    <img
                      src={imagePreviews[0] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200'}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
                      {postType}
                    </span>
                    <h4 className="font-bold text-base mt-1" style={{ color: 'var(--foreground)' }}>{title || 'Untitled Listing'}</h4>
                    <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>{locationName} • Within {visibilityRadius} km</p>
                    <p className="font-serif font-bold text-sm mt-1" style={{ color: 'var(--foreground)' }}>
                      ₹{price || budget || 'Free'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-6 border-t border-[var(--border-muted)] flex items-center justify-between shrink-0">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              >
                <ArrowLeft size={15} /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}
              >
                Next <ArrowRight size={15} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-7 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}
              >
                {loading ? 'Publishing...' : 'Publish Listing'}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
