'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import Navbar from '../navbar/Navbar';
import { User, MapPin, Shield, Sun, Moon, Laptop, LogOut, Check, Bell, CreditCard } from 'lucide-react';
import Image from 'next/image';

export default function ProfilePage() {
  const { user, isLoading, signOut } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (user) {
      setDisplayName(user.name || '');
      setAddress('Ahmedabad, Gujarat 382210');
      setPhone('+91 98765 43210');
    }
  }, [user]);

  useEffect(() => {
    const stored = localStorage.getItem('neednow-theme-mode');
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      setTheme(stored);
    }
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('neednow-theme-mode', newTheme);
    
    let isDark = false;
    if (newTheme === 'dark') {
      isDark = true;
    } else if (newTheme === 'light') {
      isDark = false;
    } else {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('light', !isDark);
    localStorage.setItem('neednow-theme', isDark ? 'dark' : 'light');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col justify-between" style={{ background: 'var(--bg-page)' }}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div 
            className="p-8 rounded-3xl text-center max-w-sm"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-card)' }}
          >
            <User size={40} className="mx-auto mb-3 opacity-30 text-[var(--text-secondary)]" />
            <h1 className="text-xl font-serif font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Sign In Required</h1>
            <p className="text-xs text-[var(--text-secondary)] mb-6">Please sign in to access your account profile & preferences.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ background: 'var(--bg-page)' }}>
      <Navbar />

      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
            Account Settings
          </h1>
          <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Manage your personal profile, addresses, preferences, and appearance
          </p>
        </div>

        {savedSuccess && (
          <div className="mb-6 p-4 rounded-2xl flex items-center gap-2 text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300">
            <Check size={16} /> Profile settings updated successfully!
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* User Profile Card */}
          <div className="md:col-span-4 flex flex-col gap-6">
            <div 
              className="p-6 rounded-2xl text-center flex flex-col items-center shadow-card"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
            >
              <div className="relative mb-4">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt="Profile"
                    width={80}
                    height={80}
                    className="rounded-full object-cover border-2"
                    style={{ borderColor: 'var(--accent-primary)' }}
                  />
                ) : (
                  <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
                    style={{ background: 'var(--accent-primary)', color: '#FFFDF8' }}
                  >
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                )}
              </div>

              <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{user.name}</h3>
              <p className="text-xs opacity-75 mt-0.5 truncate max-w-full" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>

              <span className="mt-3 px-3 py-1 text-[10px] font-bold uppercase rounded-full" style={{ background: 'rgba(154, 101, 60, 0.12)', color: 'var(--accent-primary)' }}>
                Verified Customer
              </span>
            </div>

            <button
              onClick={() => signOut()}
              className="w-full py-3 font-bold text-xs rounded-full flex items-center justify-center gap-2 text-red-600 bg-red-50 dark:bg-red-950/20 cursor-pointer border border-red-200 dark:border-red-900"
            >
              <LogOut size={14} /> Sign Out of Account
            </button>
          </div>

          {/* Settings Sections */}
          <div className="md:col-span-8 space-y-6">
            {/* Section 1: Personal Information */}
            <div 
              className="p-6 rounded-2xl shadow-card space-y-4"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <User size={16} style={{ color: 'var(--accent-primary)' }} />
                <h3 className="font-serif font-bold text-base" style={{ color: 'var(--text-primary)' }}>Personal Information</h3>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Full Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-xs outline-none border"
                    style={{ background: 'var(--surface-1)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-xs outline-none border"
                    style={{ background: 'var(--surface-1)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-full text-xs font-bold cursor-pointer shadow-sm"
                    style={{ background: 'var(--accent-primary)', color: '#FFFDF8' }}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>

            {/* Section 2: Addresses */}
            <div 
              className="p-6 rounded-2xl shadow-card space-y-4"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <MapPin size={16} style={{ color: 'var(--accent-primary)' }} />
                <h3 className="font-serif font-bold text-base" style={{ color: 'var(--text-primary)' }}>Default Delivery Address</h3>
              </div>

              <div>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full p-3 rounded-xl text-xs outline-none border resize-none"
                  style={{ background: 'var(--surface-1)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                />
              </div>
            </div>

            {/* Section 3: Appearance Controls (Light / Dark / System) */}
            <div 
              className="p-6 rounded-2xl shadow-card space-y-4"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <Sun size={16} style={{ color: 'var(--accent-primary)' }} />
                <h3 className="font-serif font-bold text-base" style={{ color: 'var(--text-primary)' }}>Appearance Theme</h3>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'light', label: 'Light', icon: Sun },
                  { id: 'dark', label: 'Dark', icon: Moon },
                  { id: 'system', label: 'System', icon: Laptop },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => handleThemeChange(id as 'light' | 'dark' | 'system')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border text-xs font-bold cursor-pointer transition-all"
                    style={{
                      background: theme === id ? 'rgba(154, 101, 60, 0.12)' : 'var(--surface-1)',
                      borderColor: theme === id ? 'var(--accent-primary)' : 'var(--border)',
                      color: theme === id ? 'var(--accent-primary)' : 'var(--text-primary)',
                    }}
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
