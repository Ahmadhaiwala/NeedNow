'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Play, Sparkles, Zap, Package, ShieldCheck, RotateCcw, Award } from 'lucide-react';
import Link from 'next/link';

interface HeroSectionProps {
  totalCategories: number;
  totalProducts: number;
}

export default function HeroSection({ totalCategories, totalProducts }: HeroSectionProps) {
  return (
    <div className="mb-10">
      {/* Main Hero Grid: Left Column Editorial Headline & CTA + Right Column Editorial Lifestyle Image */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-6">
        
        {/* Left Column: Asymmetric Headline, Subtitle & Action CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-7 flex flex-col justify-center p-8 sm:p-12 relative overflow-hidden"
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {/* Subtle accent badge */}
          <div className="flex items-center gap-2 mb-4">
            <span
              className="px-3.5 py-1 font-semibold rounded-full uppercase tracking-wider text-[11px]"
              style={{
                background: 'rgba(154, 101, 60, 0.12)',
                color: 'var(--accent-primary)',
              }}
            >
              NeedNow Express • 30 Min Delivery
            </span>
          </div>

          {/* Editorial Serif Display Headline matching Inspiration image */}
          <h1
            className="font-serif font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.1] mb-5"
            style={{ color: 'var(--text-primary)' }}
          >
            Everything you <br />
            need, delivered <br />
            <span className="italic font-normal opacity-90" style={{ color: 'var(--accent-primary)' }}>right now.</span>
          </h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="text-base sm:text-lg mb-8 max-w-lg leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            Groceries, electronics, fashion, home essentials and more — all in one place. Explore {totalCategories > 0 ? totalCategories : '20+'} categories & {totalProducts > 0 ? totalProducts : '2,000'}+ items.
          </motion.p>

          {/* Buttons: Shop All Products + How NeedNow works */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="flex flex-wrap items-center gap-4"
          >
            <Link href="/marketplace">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 font-semibold px-7 py-3.5 rounded-full cursor-pointer transition-all shadow-md"
                style={{
                  background: 'var(--accent-primary)',
                  color: '#FFFDF8',
                  fontSize: '14px',
                }}
              >
                Shop All Products
                <ArrowRight size={16} />
              </motion.button>
            </Link>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2.5 font-semibold px-6 py-3.5 rounded-full cursor-pointer transition-all"
              style={{
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '14px',
              }}
            >
              <div
                className="flex items-center justify-center w-6 h-6 rounded-full"
                style={{ background: 'rgba(154, 101, 60, 0.15)', color: 'var(--accent-primary)' }}
              >
                <Play size={10} className="fill-current ml-0.5" />
              </div>
              How NeedNow works
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Right Column: Hero Lifestyle Image Container with Overlay Recommendation Card */}
        <div
          className="lg:col-span-5 relative min-h-[360px] lg:min-h-[440px] rounded-3xl overflow-hidden"
          style={{
            boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {/* Background image */}
          <motion.div
            initial={{ scale: 1.03 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 w-full h-full"
          >
            <img
              src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80"
              alt="NeedNow Warm Lifestyle Decor"
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to top, rgba(33, 26, 22, 0.65) 0%, rgba(33, 26, 22, 0.1) 65%)',
              }}
            />
          </motion.div>

          {/* Floating Recommendation Overlay Card (enters ~150ms after hero) */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
            className="absolute bottom-6 right-6 left-6 sm:left-auto sm:max-w-xs p-5 rounded-2xl backdrop-blur-md shadow-hover"
            style={{
              background: 'rgba(33, 26, 22, 0.88)',
              border: '1px solid rgba(217, 186, 131, 0.25)',
              color: '#F4EBDD',
            }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles size={16} style={{ color: '#D9BA83' }} />
              <h3 className="font-serif font-bold text-base text-[#F4EBDD]">
                Smart picks just for you
              </h3>
            </div>
            <p className="text-xs mb-3.5 leading-relaxed opacity-80" style={{ color: '#AFA396' }}>
              Personalized products curated based on your browsing & needs
            </p>
            <Link href="/chat">
              <motion.button
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                style={{ color: '#D9BA83' }}
              >
                Explore Picks <ArrowRight size={13} />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Compact Trust Bar matching Inspiration mockup */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 rounded-2xl"
        style={{
          background: 'var(--bg-surface)',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-3 p-2">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(154, 101, 60, 0.12)' }}>
            <Zap size={16} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>30 min Delivery</p>
            <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Lightning fast</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(78, 112, 85, 0.12)' }}>
            <Package size={16} style={{ color: 'var(--color-jade)' }} />
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>2K+ Products</p>
            <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>In stock items</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(185, 74, 62, 0.12)' }}>
            <Award size={16} style={{ color: 'var(--color-heat)' }} />
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>50+ Top Brands</p>
            <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>100% Genuine</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(90, 123, 142, 0.12)' }}>
            <ShieldCheck size={16} style={{ color: 'var(--color-sky)' }} />
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Secure Payments</p>
            <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Encrypted checkout</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2 col-span-2 md:col-span-1">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(122, 107, 72, 0.12)' }}>
            <RotateCcw size={16} style={{ color: 'var(--color-moss)' }} />
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Easy Returns</p>
            <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>7-day policy</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
