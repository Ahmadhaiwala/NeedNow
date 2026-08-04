'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Tag, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function BentoBanners() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
      {/* Banner 1: Up to 30% Off on Home & Living */}
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden p-8 rounded-3xl flex flex-col justify-between min-h-[230px]"
        style={{
          background: 'linear-gradient(135deg, #E8DCC7 0%, #D8C7B0 100%)',
          color: '#211A16',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div className="relative z-10 max-w-xs">
          <span
            className="uppercase tracking-widest font-bold px-2.5 py-1 rounded-md mb-3 inline-block text-[10px]"
            style={{ background: 'rgba(33, 26, 22, 0.12)', color: '#211A16' }}
          >
            Seasonal Specials
          </span>
          <h3 className="font-serif font-bold text-2xl sm:text-3xl leading-tight mb-2" style={{ color: '#211A16' }}>
            Up to 30% Off on Home & Living
          </h3>
          <p className="text-xs opacity-80 mb-6 leading-relaxed">
            Refresh your space with our exclusive furniture and decor collection.
          </p>
        </div>

        <Link href="/products?category=home" className="relative z-10">
          <motion.button
            whileHover={{ x: 4 }}
            className="inline-flex items-center gap-2 font-bold text-xs px-5 py-2.5 rounded-full cursor-pointer shadow-sm"
            style={{ background: '#211A16', color: '#FFFDF8' }}
          >
            Shop the Collection <ArrowRight size={13} style={{ color: '#D9BA83' }} />
          </motion.button>
        </Link>

        {/* Decorative background image overlay */}
        <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-25 pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80"
            alt="Decor"
            className="w-full h-full object-cover"
          />
        </div>
      </motion.div>

      {/* Banner 2: Best Deals. Everyday. (Dark Espresso & Leather) */}
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden p-8 rounded-3xl flex flex-col justify-between min-h-[230px]"
        style={{
          background: 'linear-gradient(135deg, #2D2018 0%, #1A130E 100%)',
          color: '#F4EBDD',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid rgba(217, 186, 131, 0.2)',
        }}
      >
        {/* Top-right badge */}
        <div
          className="absolute top-6 right-6 font-bold px-3 py-1 rounded-full text-[10px] flex items-center gap-1 shadow-md"
          style={{ background: '#9A653C', color: '#FFFDF8' }}
        >
          <Tag size={11} /> UP TO 50%
        </div>

        <div className="relative z-10 max-w-xs">
          <span
            className="uppercase tracking-widest font-bold px-2.5 py-1 rounded-md mb-3 inline-block text-[10px]"
            style={{ background: 'rgba(217, 186, 131, 0.2)', color: '#D9BA83' }}
          >
            Daily Bargains
          </span>
          <h3 className="font-serif font-bold text-2xl sm:text-3xl leading-tight mb-2" style={{ color: '#F4EBDD' }}>
            Best Deals. Everyday.
          </h3>
          <p className="text-xs opacity-80 mb-6 leading-relaxed text-[#AFA396]">
            New deals on top-tier electronics and appliances updated daily.
          </p>
        </div>

        <Link href="/products?deals=true" className="relative z-10">
          <motion.button
            whileHover={{ x: 4 }}
            className="inline-flex items-center gap-2 font-bold text-xs px-5 py-2.5 rounded-full cursor-pointer shadow-sm"
            style={{ background: '#D9BA83', color: '#211A16' }}
          >
            Explore Deals <ArrowRight size={13} />
          </motion.button>
        </Link>

        {/* Background image overlay */}
        <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-20 pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80"
            alt="Headphones"
            className="w-full h-full object-cover"
          />
        </div>
      </motion.div>
    </div>
  );
}
