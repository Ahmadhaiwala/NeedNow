'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  FilePen,
  Inbox,
  SendHorizontal,
  Bookmark,
  MessageSquare,
  ShieldCheck,
  X,
  Plus,
  RotateCcw,
  ChevronRight,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  AlertCircle,
  Sparkles,
  Tag,
  Activity,
  Eye,
  Trash2,
} from 'lucide-react';
import {
  getUserPosts,
  getMyOffers,
  getIncomingOffers,
  getChatConversations,
  acceptOffer,
  rejectOffer,
  withdrawOffer,
  deleteMarketplacePost,
  MarketplacePost,
  MarketplaceOffer,
  ConversationSummary,
  MarketplaceProfile,
} from '@/lib/marketplace';
import ReviewModal from '@/components/ReviewModal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkspaceDashboardProps {
  profile: MarketplaceProfile | null;
  savedPostIds: number[];
  savedPosts?: MarketplacePost[];
  onOpenCreate: () => void;
  onOpenOffers: () => void;
  onOpenChat: (userId: string, userName: string, postId?: number, postTitle?: string) => void;
  onSelectPost: (post: MarketplacePost) => void;
}

type SectionKey =
  | 'activePosts'
  | 'draftPosts'
  | 'incomingOffers'
  | 'outgoingOffers'
  | 'conversations'
  | 'stats';

interface SectionState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

// ─── Skeleton Loader ─────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{ background: 'var(--border-muted)', opacity: 0.6 }}
    />
  );
}

function SkeletonCard() {
  return (
    <div
      className="p-3 rounded-xl flex items-center gap-3"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-muted)' }}
    >
      <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-2.5 w-1/2" />
      </div>
      <Skeleton className="w-14 h-6 rounded-md flex-shrink-0" />
    </div>
  );
}

function SkeletonStatCard() {
  return (
    <div
      className="p-4 rounded-2xl flex flex-col gap-2"
      style={{ background: 'var(--surface-1)', border: '1px solid var(--border-muted)' }}
    >
      <Skeleton className="w-8 h-8 rounded-lg" />
      <Skeleton className="h-6 w-10" />
      <Skeleton className="h-2.5 w-3/4" />
    </div>
  );
}

// ─── Error Card ───────────────────────────────────────────────────────────────

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      className="p-4 rounded-xl flex items-center gap-3"
      style={{
        background: 'rgba(177, 84, 80, 0.06)',
        border: '1px solid rgba(177, 84, 80, 0.2)',
      }}
    >
      <AlertCircle size={16} style={{ color: 'var(--destructive)', flexShrink: 0 }} />
      <p className="text-xs flex-1" style={{ color: 'var(--foreground-muted)' }}>
        {message}
      </p>
      <button
        onClick={onRetry}
        className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition-all hover:scale-105"
        style={{ background: 'var(--destructive)', color: '#fff' }}
      >
        <RotateCcw size={11} />
        Retry
      </button>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="py-8 flex flex-col items-center gap-3 text-center px-4">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center"
        style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
      >
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
          {title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
          {description}
        </p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-1 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105"
          style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}
        >
          <Plus size={13} />
          {action.label}
        </button>
      )}
    </div>
  );
}

// ─── Section Shell ────────────────────────────────────────────────────────────

function SectionCard({
  title,
  icon: Icon,
  badge,
  action,
  children,
}: {
  title: string;
  icon: React.ElementType;
  badge?: number | string;
  action?: { label: string; onClick: () => void };
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Section header */}
      <div
        className="px-4 py-3 flex items-center justify-between border-b"
        style={{ borderColor: 'var(--border-muted)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
          >
            <Icon size={13} />
          </div>
          <span className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
            {title}
          </span>
          {badge !== undefined && badge !== 0 && (
            <span
              className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}
            >
              {badge}
            </span>
          )}
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="text-xs font-semibold flex items-center gap-1 cursor-pointer hover:opacity-70 transition-opacity"
            style={{ color: 'var(--accent)' }}
          >
            {action.label}
            <ChevronRight size={12} />
          </button>
        )}
      </div>
      <div className="p-3 space-y-2">{children}</div>
    </div>
  );
}

// ─── Post Type Badge ──────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    sell: { bg: 'var(--accent-muted)', color: 'var(--accent)', label: 'Sale' },
    need: { bg: 'rgba(107, 141, 166, 0.12)', color: 'var(--info)', label: 'Need' },
    rent: { bg: 'rgba(212, 165, 116, 0.15)', color: 'var(--warning)', label: 'Rent' },
    exchange: { bg: 'rgba(122, 107, 72, 0.12)', color: '#7A6B48', label: 'Trade' },
    donate: { bg: 'rgba(90, 122, 94, 0.12)', color: 'var(--success)', label: 'Free' },
    service: { bg: 'rgba(107, 141, 166, 0.12)', color: 'var(--info)', label: 'Service' },
  };
  const s = styles[type] || styles.sell;
  return (
    <span
      className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide flex-shrink-0"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    pending: { bg: 'rgba(212, 165, 116, 0.15)', color: 'var(--warning)' },
    accepted: { bg: 'rgba(90, 122, 94, 0.12)', color: 'var(--success)' },
    rejected: { bg: 'rgba(177, 84, 80, 0.1)', color: 'var(--destructive)' },
    withdrawn: { bg: 'var(--accent-muted)', color: 'var(--foreground-muted)' },
  };
  const s = map[status] || map.pending;
  return (
    <span
      className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide capitalize flex-shrink-0"
      style={{ background: s.bg, color: s.color }}
    >
      {status}
    </span>
  );
}

// ─── Time Ago ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// ─── Price Display ────────────────────────────────────────────────────────────

function priceText(post: MarketplacePost): string {
  if (post.post_type === 'need' && post.budget)
    return `₹${Number(post.budget).toLocaleString()}`;
  if (post.price) return `₹${Number(post.price).toLocaleString()}`;
  if (post.post_type === 'donate') return 'FREE';
  return '—';
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardData {
  icon: React.ElementType;
  label: string;
  value: number | string;
  description: string;
  accentColor?: string;
  onClick?: () => void;
}

function StatCard({ icon: Icon, label, value, description, accentColor, onClick }: StatCardData) {
  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className="p-4 rounded-2xl text-left w-full cursor-default group"
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
        style={{
          background: accentColor ? `${accentColor}18` : 'var(--accent-muted)',
          color: accentColor || 'var(--accent)',
        }}
      >
        <Icon size={16} />
      </div>
      <div
        className="text-2xl font-extrabold font-serif mb-0.5 tabular-nums"
        style={{ color: 'var(--foreground)' }}
      >
        {value}
      </div>
      <div className="text-[11px] font-semibold mb-0.5" style={{ color: 'var(--foreground)' }}>
        {label}
      </div>
      <div className="text-[10px] leading-tight" style={{ color: 'var(--foreground-muted)' }}>
        {description}
      </div>
    </motion.button>
  );
}

// ─── Listing Row ──────────────────────────────────────────────────────────────

function ListingRow({
  post,
  onView,
  onDelete,
}: {
  post: MarketplacePost;
  onView: () => void;
  onDelete?: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDelete) return;
    setDeleting(true);
    onDelete();
  };

  const imageUrl = (() => {
    if (post.images && post.images.length > 0) {
      const img = post.images[0];
      if (typeof img === 'string') return img;
      if (typeof img === 'object') return (img as any).image_url || (img as any).image || '';
    }
    return '';
  })();

  return (
    <motion.div
      layout
      whileHover={{ x: 2 }}
      transition={{ duration: 0.12 }}
      className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer group transition-colors"
      style={{ background: 'transparent' }}
      onClick={onView}
    >
      {/* Thumbnail or icon */}
      <div
        className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border-muted)' }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={post.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Tag size={14} style={{ color: 'var(--foreground-muted)' }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <TypeBadge type={post.post_type} />
          <span
            className="text-xs font-semibold truncate"
            style={{ color: 'var(--foreground)' }}
          >
            {post.title}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--foreground-muted)' }}>
          <span>{priceText(post)}</span>
          {post.offers_count !== undefined && post.offers_count > 0 && (
            <span className="flex items-center gap-0.5">
              <Inbox size={9} />
              {post.offers_count} offer{post.offers_count !== 1 ? 's' : ''}
            </span>
          )}
          <span>{timeAgo(post.created_at)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onView(); }}
          className="p-1.5 rounded-lg transition-all hover:scale-110 cursor-pointer"
          style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
          title="View listing"
        >
          <Eye size={12} />
        </button>
        {onDelete && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 rounded-lg transition-all hover:scale-110 cursor-pointer disabled:opacity-50"
            style={{ background: 'rgba(177,84,80,0.1)', color: 'var(--destructive)' }}
            title="Delete listing"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Offer Row ────────────────────────────────────────────────────────────────

function OfferRow({
  offer,
  mode,
  onAccept,
  onReject,
  onWithdraw,
}: {
  offer: MarketplaceOffer;
  mode: 'incoming' | 'outgoing';
  onAccept?: () => void;
  onReject?: () => void;
  onWithdraw?: () => void;
}) {
  const [busy, setBusy] = useState(false);

  const act = async (fn: () => void) => {
    setBusy(true);
    try { fn(); } finally { setBusy(false); }
  };

  return (
    <motion.div
      layout
      className="flex items-center gap-3 p-2.5 rounded-xl"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-muted)' }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          <StatusBadge status={offer.status} />
          <span className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>
            ₹{Number(offer.price).toLocaleString()}
          </span>
        </div>
        <p className="text-[10px] truncate" style={{ color: 'var(--foreground-muted)' }}>
          {offer.post_title || `Listing #${offer.post}`}
        </p>
        {offer.message && (
          <p className="text-[10px] italic truncate mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
            "{offer.message}"
          </p>
        )}
      </div>

      {/* Actions */}
      {offer.status === 'pending' && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {mode === 'incoming' && onAccept && onReject && (
            <>
              <button
                onClick={() => act(onAccept)}
                disabled={busy}
                className="p-1.5 rounded-lg cursor-pointer transition-all hover:scale-110 disabled:opacity-50"
                style={{ background: 'rgba(90,122,94,0.12)', color: 'var(--success)' }}
                title="Accept"
              >
                <CheckCircle2 size={13} />
              </button>
              <button
                onClick={() => act(onReject)}
                disabled={busy}
                className="p-1.5 rounded-lg cursor-pointer transition-all hover:scale-110 disabled:opacity-50"
                style={{ background: 'rgba(177,84,80,0.1)', color: 'var(--destructive)' }}
                title="Reject"
              >
                <XCircle size={13} />
              </button>
            </>
          )}
          {mode === 'outgoing' && onWithdraw && (
            <button
              onClick={() => act(onWithdraw)}
              disabled={busy}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all hover:scale-105 disabled:opacity-50"
              style={{ background: 'rgba(177,84,80,0.1)', color: 'var(--destructive)', border: '1px solid rgba(177,84,80,0.2)' }}
            >
              Withdraw
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ─── Conversation Row ─────────────────────────────────────────────────────────

function ConversationRow({
  conv,
  onOpen,
}: {
  conv: ConversationSummary;
  onOpen: () => void;
}) {
  const initials = conv.other_user_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.button
      whileHover={{ x: 2 }}
      transition={{ duration: 0.12 }}
      onClick={onOpen}
      className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left cursor-pointer group"
      style={{ background: 'transparent' }}
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
        style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
      >
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs font-semibold truncate" style={{ color: 'var(--foreground)' }}>
            {conv.other_user_name}
          </span>
          <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--foreground-muted)' }}>
            {timeAgo(conv.last_updated)}
          </span>
        </div>
        <p className="text-[10px] truncate" style={{ color: 'var(--foreground-muted)' }}>
          {conv.latest_message?.content || conv.post_title || 'No messages yet'}
        </p>
      </div>

      {/* Unread Badge */}
      {conv.unread_count > 0 && (
        <div
          className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
          style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}
        >
          {conv.unread_count > 9 ? '9+' : conv.unread_count}
        </div>
      )}
    </motion.button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WorkspaceDashboard({
  profile,
  savedPostIds,
  savedPosts = [],
  onOpenCreate,
  onOpenOffers,
  onOpenChat,
  onSelectPost,
}: WorkspaceDashboardProps) {
  // ── Data States ──────────────────────────────────────────────────────────────
  const [activePosts, setActivePosts] = useState<SectionState<MarketplacePost[]>>({
    data: [], loading: true, error: null,
  });
  const [draftPosts, setDraftPosts] = useState<SectionState<MarketplacePost[]>>({
    data: [], loading: true, error: null,
  });
  const [offers, setOffers] = useState<SectionState<MarketplaceOffer[]>>({
    data: [], loading: true, error: null,
  });
  const [incomingOffersState, setIncomingOffersState] = useState<SectionState<MarketplaceOffer[]>>({
    data: [], loading: true, error: null,
  });
  const [conversations, setConversations] = useState<SectionState<ConversationSummary[]>>({
    data: [], loading: true, error: null,
  });

  // ── Verification Banner ───────────────────────────────────────────────────────
  const [verificationDismissed, setVerificationDismissed] = useState(false);
  const showVerificationBanner = !profile?.is_verified && !verificationDismissed;

  // ── Review Modal State (shown after accepting an offer) ───────────────────────
  const [reviewModal, setReviewModal] = useState<{
    open: boolean;
    postId: number;
    postTitle: string;
    revieweeId: string;
    revieweeName: string;
  } | null>(null);

  // ── Fetch Functions ───────────────────────────────────────────────────────────

  const fetchActivePosts = useCallback(async () => {
    setActivePosts((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await getUserPosts(undefined, 'active');
      setActivePosts({ data, loading: false, error: null });
    } catch {
      setActivePosts({ data: [], loading: false, error: 'Failed to load active listings.' });
    }
  }, []);

  const fetchDraftPosts = useCallback(async () => {
    setDraftPosts((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await getUserPosts(undefined, 'draft');
      setDraftPosts({ data, loading: false, error: null });
    } catch {
      setDraftPosts({ data: [], loading: false, error: 'Failed to load draft listings.' });
    }
  }, []);

  const fetchOffers = useCallback(async () => {
    setOffers((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await getMyOffers();
      setOffers({ data, loading: false, error: null });
    } catch {
      setOffers({ data: [], loading: false, error: 'Failed to load offers.' });
    }
  }, []);

  const fetchIncomingOffers = useCallback(async () => {
    setIncomingOffersState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await getIncomingOffers();
      setIncomingOffersState({ data, loading: false, error: null });
    } catch {
      setIncomingOffersState({ data: [], loading: false, error: 'Failed to load incoming offers.' });
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    setConversations((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await getChatConversations();
      setConversations({ data, loading: false, error: null });
    } catch {
      setConversations({ data: [], loading: false, error: 'Failed to load conversations.' });
    }
  }, []);

  useEffect(() => {
    fetchActivePosts();
    fetchDraftPosts();
    fetchOffers();
    fetchIncomingOffers();
    fetchConversations();
  }, [fetchActivePosts, fetchDraftPosts, fetchOffers, fetchIncomingOffers, fetchConversations]);

  // ── Derived Counts ────────────────────────────────────────────────────────────

  const allOffers = offers.data;

  // Outgoing = offers submitted by the current user on OTHER people's posts
  const outgoingOffers = allOffers;

  // Incoming = from the dedicated incoming endpoint (offers on user's own posts)
  const incomingOffers = incomingOffersState.data;

  const unreadCount = conversations.data.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  // ── Offer Actions ─────────────────────────────────────────────────────────────

  const handleAcceptOffer = async (offerId: number) => {
    const offer = incomingOffers.find((o) => o.id === offerId);
    await acceptOffer(offerId);
    setIncomingOffersState((s) => ({
      ...s,
      data: s.data.filter((o) => o.id !== offerId),
    }));
    
    // CORRECT FLOW: After seller accepts offer, the BUYER should review the SELLER
    // Do NOT open review modal here - the buyer will review from their "My Offers" section
    // The seller should not review the buyer in a marketplace transaction
    
    // TODO: Notify buyer that their offer was accepted and they can now leave a review
    // This should be handled through notifications or the buyer's offer status page
  };

  const handleRejectOffer = async (offerId: number) => {
    await rejectOffer(offerId);
    setIncomingOffersState((s) => ({
      ...s,
      data: s.data.filter((o) => o.id !== offerId),
    }));
  };

  const handleWithdrawOffer = async (offerId: number) => {
    await withdrawOffer(offerId);
    setOffers((s) => ({
      ...s,
      data: s.data.map((o) => (o.id === offerId ? { ...o, status: 'withdrawn' } : o)),
    }));
  };

  // ── Delete Post ───────────────────────────────────────────────────────────────

  const handleDeletePost = async (postId: number) => {
    await deleteMarketplacePost(postId);
    setActivePosts((s) => ({ ...s, data: s.data.filter((p) => p.id !== postId) }));
    setDraftPosts((s) => ({ ...s, data: s.data.filter((p) => p.id !== postId) }));
  };

  // ── Stat Cards Data ───────────────────────────────────────────────────────────

  const statsLoading =
    activePosts.loading || draftPosts.loading || offers.loading || conversations.loading;

  const statCards: StatCardData[] = [
    {
      icon: Package,
      label: 'Active Listings',
      value: activePosts.loading ? '—' : activePosts.data.length,
      description: 'Currently live on the marketplace',
      onClick: undefined,
    },
    {
      icon: FilePen,
      label: 'Draft Listings',
      value: draftPosts.loading ? '—' : draftPosts.data.length,
      description: 'Saved but not yet published',
      accentColor: 'var(--warning)',
    },
    {
      icon: Inbox,
      label: 'Offers Received',
      value: offers.loading ? '—' : incomingOffers.length,
      description: 'Pending offers on your listings',
      accentColor: 'var(--success)',
      onClick: onOpenOffers,
    },
    {
      icon: SendHorizontal,
      label: 'Offers Sent',
      value: offers.loading ? '—' : outgoingOffers.length,
      description: 'Your offers on other listings',
      onClick: onOpenOffers,
    },
    {
      icon: Bookmark,
      label: 'Saved Listings',
      value: savedPostIds.length,
      description: 'Listings bookmarked for later',
      accentColor: 'var(--warning)',
    },
    {
      icon: MessageSquare,
      label: 'Unread Messages',
      value: conversations.loading ? '—' : unreadCount,
      description: 'Across all your conversations',
      accentColor: unreadCount > 0 ? 'var(--destructive)' : undefined,
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <>
    <div className="space-y-5">

      {/* ── Verification Banner ── */}
      <AnimatePresence>
        {showVerificationBanner && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{
              background: 'rgba(107, 141, 166, 0.1)',
              border: '1px solid rgba(107, 141, 166, 0.25)',
            }}
          >
            <ShieldCheck size={16} style={{ color: 'var(--info)', flexShrink: 0 }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
                Verify your address to unlock all seller features
              </p>
              <p className="text-[10px]" style={{ color: 'var(--foreground-muted)' }}>
                Verified sellers get more visibility and build trust with buyers.
              </p>
            </div>
            <button
              className="text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all hover:scale-105 flex-shrink-0"
              style={{ background: 'var(--info)', color: '#fff' }}
            >
              Verify Now
            </button>
            <button
              onClick={() => setVerificationDismissed(true)}
              className="p-1.5 rounded-lg cursor-pointer hover:opacity-70 transition-opacity flex-shrink-0"
              style={{ color: 'var(--foreground-muted)' }}
            >
              <X size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stat Cards Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statsLoading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonStatCard key={i} />)
          : statCards.map((card) => <StatCard key={card.label} {...card} />)}
      </div>

      {/* ── Two-column Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4 items-start">

        {/* ════ Left Column ════ */}
        <div className="space-y-4">

          {/* My Active Listings */}
          <SectionCard
            title="My Active Listings"
            icon={Package}
            badge={activePosts.data.length || undefined}
            action={{ label: 'Post new', onClick: onOpenCreate }}
          >
            {activePosts.loading ? (
              Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
            ) : activePosts.error ? (
              <ErrorCard message={activePosts.error} onRetry={fetchActivePosts} />
            ) : activePosts.data.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No active listings yet"
                description="Post something to start selling or trading in your community."
                action={{ label: 'Post a Listing', onClick: onOpenCreate }}
              />
            ) : (
              activePosts.data.slice(0, 6).map((post) => (
                <ListingRow
                  key={post.id}
                  post={post}
                  onView={() => onSelectPost(post)}
                  onDelete={() => handleDeletePost(post.id)}
                />
              ))
            )}
          </SectionCard>

          {/* Draft Listings */}
          <SectionCard
            title="Draft Listings"
            icon={FilePen}
            badge={draftPosts.data.length || undefined}
            action={{ label: 'New draft', onClick: onOpenCreate }}
          >
            {draftPosts.loading ? (
              Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)
            ) : draftPosts.error ? (
              <ErrorCard message={draftPosts.error} onRetry={fetchDraftPosts} />
            ) : draftPosts.data.length === 0 ? (
              <EmptyState
                icon={FilePen}
                title="No drafts saved"
                description="Start a listing and save it as a draft to finish later."
              />
            ) : (
              draftPosts.data.slice(0, 4).map((post) => (
                <ListingRow
                  key={post.id}
                  post={post}
                  onView={() => onSelectPost(post)}
                  onDelete={() => handleDeletePost(post.id)}
                />
              ))
            )}
          </SectionCard>

          {/* Recent Activity */}
          <SectionCard title="Recent Activity" icon={Activity}>
            {conversations.loading || offers.loading ? (
              Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
            ) : (
              (() => {
                // Build activity feed from conversations + recent offers
                type ActivityItem =
                  | { kind: 'message'; conv: ConversationSummary; ts: string }
                  | { kind: 'offer'; offer: MarketplaceOffer; ts: string };

                const items: ActivityItem[] = [
                  ...conversations.data.slice(0, 4).map((c) => ({
                    kind: 'message' as const,
                    conv: c,
                    ts: c.last_updated,
                  })),
                  ...allOffers.slice(0, 4).map((o) => ({
                    kind: 'offer' as const,
                    offer: o,
                    ts: o.created_at || '',
                  })),
                ]
                  .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
                  .slice(0, 5);

                if (items.length === 0) {
                  return (
                    <EmptyState
                      icon={Sparkles}
                      title="No recent activity"
                      description="Your messages and offer updates will appear here."
                    />
                  );
                }

                return items.map((item, idx) => {
                  if (item.kind === 'message') {
                    const c = item.conv;
                    return (
                      <div
                        key={`msg-${idx}`}
                        className="flex items-center gap-2.5 py-2 border-b last:border-0"
                        style={{ borderColor: 'var(--border-muted)' }}
                      >
                        <div
                          className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold"
                          style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
                        >
                          {c.other_user_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                            {c.other_user_name}
                          </p>
                          <p className="text-[10px] truncate" style={{ color: 'var(--foreground-muted)' }}>
                            {c.latest_message?.content || 'New message'}
                          </p>
                        </div>
                        <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--foreground-muted)' }}>
                          {timeAgo(item.ts)}
                        </span>
                      </div>
                    );
                  }
                  const o = item.offer;
                  return (
                    <div
                      key={`offer-${idx}`}
                      className="flex items-center gap-2.5 py-2 border-b last:border-0"
                      style={{ borderColor: 'var(--border-muted)' }}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
                        style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
                      >
                        <ArrowUpRight size={12} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                          Offer · ₹{Number(o.price).toLocaleString()}
                        </p>
                        <p className="text-[10px] truncate" style={{ color: 'var(--foreground-muted)' }}>
                          {o.post_title || `Listing #${o.post}`} · {o.status}
                        </p>
                      </div>
                      <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--foreground-muted)' }}>
                        {timeAgo(item.ts)}
                      </span>
                    </div>
                  );
                });
              })()
            )}
          </SectionCard>
        </div>

        {/* ════ Right Column ════ */}
        <div className="space-y-4">

          {/* Incoming Offers */}
          <SectionCard
            title="Incoming Offers"
            icon={Inbox}
            badge={incomingOffers.length || undefined}
            action={{ label: 'All offers', onClick: onOpenOffers }}
          >
            {incomingOffersState.loading ? (
              Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)
            ) : incomingOffersState.error ? (
              <ErrorCard message={incomingOffersState.error} onRetry={fetchIncomingOffers} />
            ) : incomingOffers.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No incoming offers"
                description="Offers on your active listings will appear here."
              />
            ) : (
              incomingOffers.slice(0, 5).map((offer) => (
                <OfferRow
                  key={offer.id}
                  offer={offer}
                  mode="incoming"
                  onAccept={() => handleAcceptOffer(offer.id)}
                  onReject={() => handleRejectOffer(offer.id)}
                />
              ))
            )}
          </SectionCard>

          {/* Outgoing Offers */}
          <SectionCard
            title="Outgoing Offers"
            icon={SendHorizontal}
            badge={outgoingOffers.filter((o) => o.status === 'pending').length || undefined}
            action={{ label: 'Manage', onClick: onOpenOffers }}
          >
            {offers.loading ? (
              Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)
            ) : offers.error ? (
              <ErrorCard message={offers.error} onRetry={fetchOffers} />
            ) : outgoingOffers.length === 0 ? (
              <EmptyState
                icon={SendHorizontal}
                title="No offers sent"
                description="Offers you make on listings will appear here."
              />
            ) : (
              outgoingOffers.slice(0, 4).map((offer) => (
                <OfferRow
                  key={offer.id}
                  offer={offer}
                  mode="outgoing"
                  onWithdraw={() => handleWithdrawOffer(offer.id)}
                />
              ))
            )}
          </SectionCard>

          {/* Recent Conversations */}
          <SectionCard
            title="Recent Conversations"
            icon={MessageSquare}
            badge={unreadCount || undefined}
            action={{
              label: 'Open chat',
              onClick: () => onOpenChat('', ''),
            }}
          >
            {conversations.loading ? (
              Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
            ) : conversations.error ? (
              <ErrorCard message={conversations.error} onRetry={fetchConversations} />
            ) : conversations.data.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No conversations yet"
                description="Chat with neighbors when you find something you like."
              />
            ) : (
              conversations.data.slice(0, 5).map((conv, i) => (
                <ConversationRow
                  key={`${conv.other_user_id}-${i}`}
                  conv={conv}
                  onOpen={() =>
                    onOpenChat(
                      conv.other_user_id,
                      conv.other_user_name,
                      conv.post_id ?? undefined,
                      conv.post_title ?? undefined
                    )
                  }
                />
              ))
            )}
          </SectionCard>

          {/* Saved Listings */}
          <SectionCard
            title="Saved Listings"
            icon={Bookmark}
            badge={savedPosts.length || undefined}
          >
            {savedPosts.length === 0 ? (
              <EmptyState
                icon={Bookmark}
                title="No saved listings"
                description="Bookmark listings from the feed to track them here."
              />
            ) : (
              savedPosts.slice(0, 5).map((post) => (
                <ListingRow
                  key={post.id}
                  post={post}
                  onView={() => onSelectPost(post)}
                />
              ))
            )}
          </SectionCard>
        </div>
      </div>
    </div>

      {/* Review Modal — opens after post owner accepts an offer */}
      {reviewModal?.open && (
        <ReviewModal
          isOpen={reviewModal.open}
          onClose={() => setReviewModal(null)}
          postId={reviewModal.postId}
          postTitle={reviewModal.postTitle}
          revieweeId={reviewModal.revieweeId}
          revieweeName={reviewModal.revieweeName}
          onReviewSubmitted={() => setReviewModal(null)}
        />
      )}
    </>
  );
}
