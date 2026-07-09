'use client';

import { Package } from 'lucide-react';

interface LoadingSkeletonProps {
  rows?: number;
  height?: string;
}

export function LoadingSkeleton({ rows = 3, height = 'h-4' }: LoadingSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`${height} rounded-lg animate-pulse`} style={{ background: 'rgba(123,163,206,0.1)' }} />
      ))}
    </div>
  );
}

interface LoadingSpinnerProps {
  size?: number;
  text?: string;
}

export function LoadingSpinner({ size = 24, text }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="animate-spin mb-4">
        <Package size={size} style={{ color: 'var(--accent-primary)' }} />
      </div>
      {text && (
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {text}
        </p>
      )}
    </div>
  );
}

interface LoadingCardProps {
  count?: number;
}

export function LoadingCard({ count = 1 }: LoadingCardProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-2xl" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-xl animate-pulse" style={{ background: 'rgba(123,163,206,0.1)' }} />
            <div className="w-4 h-4 rounded animate-pulse" style={{ background: 'rgba(123,163,206,0.1)' }} />
          </div>
          
          <LoadingSkeleton rows={2} height="h-3" />
          
          <div className="flex items-center justify-between mt-3">
            <div className="w-8 h-6 rounded animate-pulse" style={{ background: 'rgba(2,90,92,0.1)' }} />
            <div className="w-12 h-3 rounded animate-pulse" style={{ background: 'rgba(123,163,206,0.1)' }} />
          </div>
          
          <div className="flex gap-2 mt-3">
            <div className="flex-1 h-8 rounded-lg animate-pulse" style={{ background: 'rgba(239,68,68,0.05)' }} />
            <div className="flex-1 h-8 rounded-lg animate-pulse" style={{ background: 'rgba(2,90,92,0.05)' }} />
          </div>
        </div>
      ))}
    </>
  );
}

export function LoadingStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-4 rounded-2xl" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-card)' }}>
          <div className="w-16 h-8 rounded animate-pulse mb-2" style={{ background: 'rgba(2,90,92,0.1)' }} />
          <div className="w-20 h-4 rounded animate-pulse" style={{ background: 'rgba(123,163,206,0.1)' }} />
        </div>
      ))}
    </div>
  );
}