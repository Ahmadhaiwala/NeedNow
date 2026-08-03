'use client';

import { Zap, Users, ShieldCheck, RotateCcw } from 'lucide-react';
import Link from 'next/link';

export default function TrustFooter() {
  return (
    <footer className="mt-16 border-t border-default bg-surface">
      {/* 4 Feature Columns */}
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-accent-muted">
            <Zap size={20} className="text-accent" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-foreground">Lightning Fast Delivery</h4>
            <p className="text-xs mt-1 text-muted">Get your order in 30 minutes</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-success/20">
            <Users size={20} className="text-success" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-foreground">Trusted by Thousands</h4>
            <p className="text-xs mt-1 text-muted">2,000+ happy customers</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-info/20">
            <ShieldCheck size={20} className="text-info" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-foreground">Secure Payments</h4>
            <p className="text-xs mt-1 text-muted">100% safe & encrypted</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-destructive/20">
            <RotateCcw size={20} className="text-destructive" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-foreground">Easy Returns</h4>
            <p className="text-xs mt-1 text-muted">7-day hassle-free policy</p>
          </div>
        </div>
      </div>

      {/* Main Footer Copyright */}
      <div className="border-t py-6 px-6 text-xs flex flex-wrap items-center justify-between gap-4 max-w-7xl mx-auto border-default text-muted">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs bg-accent text-accent-foreground">
            N
          </div>
          <span className="font-serif font-bold text-sm text-foreground">NeedNow</span>
          <span className="hidden sm:inline">— Everything You Need, Right Now.</span>
        </div>

        <div className="flex items-center gap-6 font-medium">
          <Link href="/marketplace" className="hover:underline">Marketplace</Link>
          <Link href="/chat" className="hover:underline">AI Agent</Link>
          <Link href="/orders" className="hover:underline">Orders</Link>
          <Link href="/history" className="hover:underline">History</Link>
        </div>
      </div>
    </footer>
  );
}
