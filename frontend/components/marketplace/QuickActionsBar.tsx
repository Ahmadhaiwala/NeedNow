'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Tag, Lightbulb, HeartHandshake, Compass } from 'lucide-react';

interface QuickActionsBarProps {
  onQuickAction: (action: 'sell' | 'need' | 'service' | 'nearby') => void;
}

export default function QuickActionsBar({ onQuickAction }: QuickActionsBarProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
      <motion.button
        whileHover={{ y: -3, scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onQuickAction('sell')}
        className="flex items-center gap-3.5 p-4 rounded-2xl text-left cursor-pointer transition-all"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(160, 98, 60, 0.12)', color: 'var(--accent)' }}>
          <Tag size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>Sell Something</h4>
          <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>List an item for sale</p>
        </div>
      </motion.button>

      <motion.button
        whileHover={{ y: -3, scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onQuickAction('need')}
        className="flex items-center gap-3.5 p-4 rounded-2xl text-left cursor-pointer transition-all"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(90, 123, 142, 0.12)', color: 'var(--info)' }}>
          <Lightbulb size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>Need Something</h4>
          <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Post a request for an item</p>
        </div>
      </motion.button>

      <motion.button
        whileHover={{ y: -3, scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onQuickAction('service')}
        className="flex items-center gap-3.5 p-4 rounded-2xl text-left cursor-pointer transition-all"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(90, 122, 94, 0.12)', color: 'var(--success)' }}>
          <HeartHandshake size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>Offer a Service</h4>
          <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Share your local skills</p>
        </div>
      </motion.button>

      <motion.button
        whileHover={{ y: -3, scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onQuickAction('nearby')}
        className="flex items-center gap-3.5 p-4 rounded-2xl text-left cursor-pointer transition-all"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(212, 165, 116, 0.15)', color: 'var(--warning)' }}>
          <Compass size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>Browse Nearby</h4>
          <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Explore map listings</p>
        </div>
      </motion.button>
    </div>
  );
}
