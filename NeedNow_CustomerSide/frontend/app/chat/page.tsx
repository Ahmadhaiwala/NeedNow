'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '../navbar/Navbar';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Sparkles, Send, StopCircle, ArrowRight,
  ShoppingCart, ShoppingBag, Cpu, Layers, RefreshCw,
  ChevronRight, Package, X, Utensils, Gift, Monitor, ListTodo,
  Clock, CheckCircle2,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useFlyToCart } from '@/context/FlyToCartContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

async function getToken(): Promise<string | null> {
  try {
    const { authClient } = await import('@/lib/auth');
    const session = await authClient.getSession();
    return session?.data?.session?.token ?? null;
  } catch {
    return null;
  }
}

// ─── Atmospheric Background ──────────────────────────────────────────────────

function AtmosphericLayer() {
  return (
    <div
      className="fixed inset-0 pointer-events-none select-none"
      style={{ zIndex: 0 }}
      aria-hidden
    >
      <div
        style={{
          position: 'absolute', top: '-20%', left: '-12%',
          width: '60%', height: '70%',
          background: 'radial-gradient(ellipse at center, rgba(160,98,60,0.055) 0%, transparent 65%)',
          filter: 'blur(72px)',
        }}
      />
      <div
        style={{
          position: 'absolute', bottom: '-18%', right: '-10%',
          width: '52%', height: '60%',
          background: 'radial-gradient(ellipse at center, rgba(120,70,30,0.04) 0%, transparent 68%)',
          filter: 'blur(80px)',
        }}
      />
      <div
        style={{
          position: 'absolute', top: '35%', left: '10%',
          width: '80%', height: '30%',
          background: 'radial-gradient(ellipse at center, rgba(180,120,60,0.022) 0%, transparent 72%)',
          filter: 'blur(100px)',
        }}
      />
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.022 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="grain-agent-v2">
          <feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-agent-v2)" />
      </svg>
    </div>
  );
}

// ─── Agent Avatar ────────────────────────────────────────────────────────────

function AgentAvatar({ size = 28 }: { size?: number }) {
  return (
    <div
      style={{
        width: size, height: size,
        borderRadius: '50%',
        background: 'var(--accent-primary)',
        color: '#FFFDF8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 900, letterSpacing: '0.02em',
        flexShrink: 0, userSelect: 'none',
      }}
    >
      N
    </div>
  );
}

// ─── Markdown Renderer ───────────────────────────────────────────────────────
// Renders AI prose with proper markdown — no raw ** or ## characters.

function AgentMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Paragraphs — base editorial prose
        p: ({ children }) => (
          <p
            style={{
              margin: '0 0 0.9em 0',
              fontSize: 17,
              lineHeight: 1.7,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0.005em',
            }}
          >
            {children}
          </p>
        ),
        // Strong / Bold
        strong: ({ children }) => (
          <strong style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            {children}
          </strong>
        ),
        // Emphasis / Italic
        em: ({ children }) => (
          <em style={{ fontStyle: 'italic', color: 'var(--text-primary)', opacity: 0.85 }}>
            {children}
          </em>
        ),
        // Headings — editorial hierarchy
        h1: ({ children }) => (
          <h1
            style={{
              fontSize: 20, fontWeight: 700, marginBottom: '0.5em', marginTop: '1em',
              color: 'var(--text-primary)', fontFamily: 'var(--font-serif)',
              letterSpacing: '-0.01em', lineHeight: 1.3,
            }}
          >
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2
            style={{
              fontSize: 17, fontWeight: 700, marginBottom: '0.45em', marginTop: '1em',
              color: 'var(--text-primary)',
              letterSpacing: '-0.005em', lineHeight: 1.35,
            }}
          >
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3
            style={{
              fontSize: 15, fontWeight: 700, marginBottom: '0.35em', marginTop: '0.85em',
              color: 'var(--text-primary)', textTransform: 'uppercase',
              letterSpacing: '0.04em', opacity: 0.75,
            }}
          >
            {children}
          </h3>
        ),
        // Unordered list
        ul: ({ children }) => (
          <ul
            style={{
              margin: '0.5em 0 0.9em 0',
              paddingLeft: '1.4em',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.3em',
            }}
          >
            {children}
          </ul>
        ),
        // Ordered list
        ol: ({ children }) => (
          <ol
            style={{
              margin: '0.5em 0 0.9em 0',
              paddingLeft: '1.5em',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.3em',
            }}
          >
            {children}
          </ol>
        ),
        // List items
        li: ({ children }) => (
          <li
            style={{
              fontSize: 17,
              lineHeight: 1.65,
              color: 'var(--text-primary)',
            }}
          >
            {children}
          </li>
        ),
        // Inline code
        code: ({ children, className }) => {
          const isBlock = className?.includes('language-');
          if (isBlock) {
            return (
              <code
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontFamily: 'monospace',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  overflowX: 'auto',
                  color: 'var(--text-primary)',
                  margin: '0.6em 0',
                }}
              >
                {children}
              </code>
            );
          }
          return (
            <code
              style={{
                fontSize: 14,
                fontFamily: 'monospace',
                background: 'var(--accent-muted)',
                color: 'var(--accent-primary)',
                padding: '1px 5px',
                borderRadius: 4,
              }}
            >
              {children}
            </code>
          );
        },
        // Blockquote — used for tips/notes
        blockquote: ({ children }) => (
          <blockquote
            style={{
              margin: '0.75em 0',
              padding: '10px 16px',
              borderLeft: '3px solid var(--accent-primary)',
              background: 'var(--accent-muted)',
              borderRadius: '0 8px 8px 0',
              fontSize: 15,
              color: 'var(--text-secondary)',
              fontStyle: 'italic',
            }}
          >
            {children}
          </blockquote>
        ),
        // Horizontal rule — section divider
        hr: () => (
          <hr
            style={{
              margin: '1em 0',
              border: 'none',
              borderTop: '1px solid var(--border)',
              opacity: 0.5,
            }}
          />
        ),
        // Table
        table: ({ children }) => (
          <div style={{ overflowX: 'auto', margin: '0.75em 0' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 14,
                color: 'var(--text-primary)',
              }}
            >
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th
            style={{
              padding: '8px 12px',
              textAlign: 'left',
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              color: 'var(--text-secondary)',
              borderBottom: '2px solid var(--border)',
            }}
          >
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td
            style={{
              padding: '8px 12px',
              borderBottom: '1px solid var(--border)',
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            {children}
          </td>
        ),
        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--accent-primary)',
              textDecoration: 'underline',
              textUnderlineOffset: 2,
              fontWeight: 500,
            }}
          >
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// ─── Editorial Agent Message ─────────────────────────────────────────────────

function AgentMessage({
  msg,
  onAction,
  isLatest,
}: {
  msg: Message;
  onAction: (text: string) => void;
  isLatest?: boolean;
}) {
  const timeStr = msg.createdAt
    ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="flex gap-4 items-start group">
      {/* Avatar column */}
      <div className="flex flex-col items-center gap-2 mt-0.5">
        <AgentAvatar size={28} />
        {!isLatest && (
          <div
            style={{
              width: 1, flex: 1, minHeight: 16,
              background: 'var(--border)', opacity: 0.45, marginTop: 4,
            }}
          />
        )}
      </div>

      {/* Content column — max reading width */}
      <div className="flex-1 min-w-0 pb-1" style={{ maxWidth: 760 }}>
        {/* Meta row */}
        <div className="flex items-center gap-2 mb-3">
          <span
            style={{
              fontSize: 11, fontWeight: 900,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'var(--accent-primary)',
            }}
          >
            NeedNow
          </span>
          <span
            style={{
              width: 3, height: 3, borderRadius: '50%',
              background: 'var(--border)', display: 'inline-block', opacity: 0.7,
            }}
          />
          {timeStr && (
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', opacity: 0.65 }}>
              {timeStr}
            </span>
          )}
        </div>

        {/* Editorial markdown content */}
        <div style={{ marginBottom: msg.content && msg.content.length > 30 ? 0 : undefined }}>
          <AgentMarkdown content={msg.content} />
        </div>

        {/* Inline action chips */}
        {msg.content && msg.content.length > 30 && (
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => onAction('Add these recommended items to my cart')}
              className="flex items-center gap-2 cursor-pointer transition-all duration-150 hover:opacity-80 active:scale-95"
              style={{
                padding: '7px 14px',
                borderRadius: 99,
                fontSize: 13,
                fontWeight: 600,
                background: 'var(--accent-muted)',
                color: 'var(--accent-primary)',
                border: '1px solid rgba(160,98,60,0.18)',
              }}
            >
              <ShoppingBag size={13} strokeWidth={2.5} />
              Add to cart
            </button>
            <button
              onClick={() => onAction('Show me lower budget alternatives')}
              className="flex items-center gap-2 cursor-pointer transition-all duration-150 hover:opacity-80 active:scale-95"
              style={{
                padding: '7px 14px',
                borderRadius: 99,
                fontSize: 13,
                fontWeight: 600,
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              <RefreshCw size={13} strokeWidth={2.5} />
              Alternatives
            </button>
            <button
              onClick={() => onAction('Tell me more details about these products')}
              className="flex items-center gap-2 cursor-pointer transition-all duration-150 hover:opacity-80 active:scale-95"
              style={{
                padding: '7px 14px',
                borderRadius: 99,
                fontSize: 13,
                fontWeight: 600,
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              <Layers size={13} strokeWidth={2.5} />
              More details
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── User Message ────────────────────────────────────────────────────────────

function UserMessage({ msg }: { msg: Message }) {
  return (
    <div className="flex justify-end items-end gap-3 pl-20">
      <div
        style={{
          padding: '12px 18px',
          borderRadius: 20,
          borderBottomRightRadius: 5,
          fontSize: 16,
          fontWeight: 500,
          lineHeight: 1.55,
          background: 'var(--accent-primary)',
          color: '#FFFDF8',
          maxWidth: '72%',
          letterSpacing: '0.01em',
          boxShadow: '0 2px 12px rgba(160,98,60,0.22)',
        }}
      >
        {msg.content}
      </div>
    </div>
  );
}

// ─── Typing / Status Indicator ───────────────────────────────────────────────

function AgentTyping({ message }: { message: string }) {
  return (
    <div className="flex gap-4 items-start">
      <AgentAvatar size={28} />
      <div className="flex items-center gap-3 mt-1">
        <div className="flex gap-1.5 items-center">
          {[0, 200, 400].map((delay) => (
            <span
              key={delay}
              className="w-2 h-2 rounded-full inline-block"
              style={{
                background: 'var(--accent-primary)',
                animation: 'agentDot 1.2s infinite ease-in-out',
                animationDelay: `${delay}ms`,
                opacity: 0.5,
              }}
            />
          ))}
        </div>
        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>
          {message}
        </span>
      </div>
      <style>{`
        @keyframes agentDot {
          0%, 80%, 100% { transform: scale(1); opacity: 0.4; }
          40% { transform: scale(1.4); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Cart Sidebar Section ────────────────────────────────────────────────────

function CartSidebarSection() {
  const { state } = useCart();
  const { items, total, item_count } = state;

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <ShoppingCart size={13} style={{ color: 'var(--accent-primary)' }} />
          <span
            style={{
              fontSize: 13, fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: '0.12em',
              color: 'var(--text-secondary)',
            }}
          >
            Cart
            {item_count > 0 && (
              <span
                style={{
                  marginLeft: 8,
                  background: 'var(--accent-muted)',
                  color: 'var(--accent-primary)',
                  padding: '2px 7px',
                  borderRadius: 99,
                  fontWeight: 700,
                  fontSize: 11,
                }}
              >
                {item_count}
              </span>
            )}
          </span>
        </div>
        {item_count > 0 && (
          <Link
            href="/cart"
            className="flex items-center gap-1 transition-opacity hover:opacity-60"
            style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-primary)' }}
          >
            View <ChevronRight size={12} />
          </Link>
        )}
      </div>

      {item_count === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', opacity: 0.45, lineHeight: 1.5 }}>
          Cart is empty.
        </p>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {items.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl"
                style={{
                  padding: '10px 12px',
                  background: 'var(--agent-card-elevated)',
                  border: '1px solid var(--border)',
                }}
              >
                {/* Thumbnail */}
                <div
                  className="rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                  style={{ width: 40, height: 40, background: 'var(--background)' }}
                >
                  {item.product.image_url ? (
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package size={14} style={{ color: 'var(--text-secondary)' }} />
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="truncate leading-tight"
                    style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}
                  >
                    {item.product.name}
                  </p>
                  <p
                    className="mt-0.5"
                    style={{ fontSize: 12, color: 'var(--text-secondary)', opacity: 0.7 }}
                  >
                    ×{item.quantity}
                  </p>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-primary)', flexShrink: 0 }}>
                  {item.line_total !== null ? `Rs.${item.line_total.toLocaleString()}` : '—'}
                </span>
              </div>
            ))}
            {item_count > 4 && (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', opacity: 0.5, paddingLeft: 4 }}>
                +{item_count - 4} more items
              </p>
            )}
          </div>
          {/* Total row */}
          <div
            className="flex justify-between items-center pt-3 border-t"
            style={{ borderColor: 'var(--border)' }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Total
            </span>
            <span style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary)' }}>
              Rs.{total.toLocaleString()}
            </span>
          </div>
          {/* Checkout CTA */}
          <Link
            href="/checkout"
            className="mt-3.5 flex items-center justify-center gap-2 w-full rounded-xl transition-all hover:opacity-85 active:scale-[0.98]"
            style={{
              padding: '11px 16px',
              fontSize: 13,
              fontWeight: 700,
              background: 'var(--accent-primary)',
              color: '#FFFDF8',
              boxShadow: '0 2px 10px rgba(160,98,60,0.20)',
            }}
          >
            Checkout <ArrowRight size={13} />
          </Link>
        </>
      )}
    </div>
  );
}

// ─── Sidebar Section Wrapper ─────────────────────────────────────────────────

function SidebarSection({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={13} style={{ color: 'var(--accent-primary)' }} />
        <span
          style={{
            fontSize: 13, fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: '0.12em',
            color: 'var(--text-secondary)',
          }}
        >
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

// ─── Commerce Sidebar ─────────────────────────────────────────────────────────

function CommerceSidebar({
  messages,
  currentTask,
}: {
  messages: Message[];
  currentTask: string | null;
}) {
  const hasBuildContext = messages.some(
    (m) =>
      m.role === 'assistant' &&
      (m.content.toLowerCase().includes(' pc') ||
        m.content.toLowerCase().includes('build') ||
        m.content.toLowerCase().includes('processor') ||
        m.content.toLowerCase().includes('gpu') ||
        m.content.toLowerCase().includes('motherboard'))
  );

  const hasFoodContext = messages.some(
    (m) =>
      m.role === 'assistant' &&
      (m.content.toLowerCase().includes('recipe') ||
        m.content.toLowerCase().includes('grocery') ||
        m.content.toLowerCase().includes('ingredient') ||
        m.content.toLowerCase().includes('dinner') ||
        m.content.toLowerCase().includes('cooking'))
  );

  const hasConversation = messages.length > 0;

  const recentTasks = messages
    .filter((m) => m.role === 'user')
    .slice(-6)
    .reverse()
    .map((m) => m.content.slice(0, 72));

  return (
    <aside
      className="hidden lg:flex flex-col h-full overflow-y-auto no-scrollbar"
      style={{ width: '100%' }}
    >
      {/* Sidebar header */}
      <div
        className="px-6 pt-5 pb-4 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <p
          style={{
            fontSize: 11, fontWeight: 900,
            textTransform: 'uppercase', letterSpacing: '0.18em',
            color: 'var(--text-secondary)', opacity: 0.65,
          }}
        >
          Commerce Context
        </p>
      </div>

      <div className="flex-1 px-6 py-5 flex flex-col gap-5">

        {/* ── Current Task ── */}
        {currentTask && hasConversation && (
          <>
            <SidebarSection icon={ListTodo} label="Current Task">
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'var(--accent-muted)',
                  border: '1px solid rgba(160,98,60,0.15)',
                }}
              >
                <div className="flex items-start gap-2.5">
                  <CheckCircle2
                    size={14}
                    style={{ color: 'var(--accent-primary)', marginTop: 2, flexShrink: 0 }}
                  />
                  <p style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5, color: 'var(--text-primary)' }}>
                    {currentTask}
                  </p>
                </div>
              </div>
            </SidebarSection>
            <div style={{ height: 1, background: 'var(--border)', opacity: 0.5 }} />
          </>
        )}

        {/* ── Cart ── */}
        <CartSidebarSection />

        {/* ── Build Context ── */}
        {hasBuildContext && (
          <>
            <div style={{ height: 1, background: 'var(--border)', opacity: 0.5 }} />
            <SidebarSection icon={Cpu} label="Build Configuration">
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'var(--agent-card-elevated)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="flex items-start gap-2.5">
                  <Monitor size={14} style={{ color: 'var(--accent-primary)', marginTop: 2, flexShrink: 0 }} />
                  <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--text-secondary)' }}>
                    Agent is assembling a build configuration. Review the full spec in the conversation.
                  </p>
                </div>
              </div>
            </SidebarSection>
          </>
        )}

        {/* ── Food / Grocery Context ── */}
        {hasFoodContext && (
          <>
            <div style={{ height: 1, background: 'var(--border)', opacity: 0.5 }} />
            <SidebarSection icon={Utensils} label="Meal / Grocery Plan">
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'var(--agent-card-elevated)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="flex items-start gap-2.5">
                  <Utensils size={14} style={{ color: 'var(--accent-primary)', marginTop: 2, flexShrink: 0 }} />
                  <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--text-secondary)' }}>
                    Agent is planning a meal or grocery list. Items will be added to cart as confirmed.
                  </p>
                </div>
              </div>
            </SidebarSection>
          </>
        )}

        {/* ── Recent Requests ── */}
        {recentTasks.length > 1 && (
          <>
            <div style={{ height: 1, background: 'var(--border)', opacity: 0.5 }} />
            <SidebarSection icon={Clock} label="Recent Requests">
              <div className="flex flex-col gap-2">
                {recentTasks.slice(0, 4).map((task, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div
                      style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: 'var(--border)', marginTop: 7, flexShrink: 0,
                      }}
                    />
                    <p
                      style={{
                        fontSize: 13,
                        lineHeight: 1.5,
                        color: 'var(--text-secondary)',
                        opacity: i === 0 ? 0.9 : 0.55,
                      }}
                    >
                      {task}{task.length >= 72 ? '…' : ''}
                    </p>
                  </div>
                ))}
              </div>
            </SidebarSection>
          </>
        )}

        {/* ── Empty state ── */}
        {!hasConversation && (
          <div className="mt-auto pt-8 pb-4 text-center">
            <div
              className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'var(--agent-card-elevated)', border: '1px solid var(--border)' }}
            >
              <Sparkles size={16} style={{ color: 'var(--text-secondary)', opacity: 0.4 }} />
            </div>
            <p
              className="max-w-[160px] mx-auto leading-relaxed"
              style={{ fontSize: 13, color: 'var(--text-secondary)', opacity: 0.4, lineHeight: 1.55 }}
            >
              Start a conversation to see shopping context here.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}

// ─── Welcome State ────────────────────────────────────────────────────────────

function WelcomeState({ onSend }: { onSend: (text: string) => void }) {
  const [localInput, setLocalInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  }, [localInput]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = localInput.trim();
    if (text) onSend(text);
  };

  const suggestions = [
    { icon: Monitor,      label: 'Build a PC under Rs.80,000',        query: 'Build a PC under Rs.80,000' },
    { icon: ShoppingCart, label: 'Plan my weekly groceries',           query: 'Plan my weekly groceries' },
    { icon: Utensils,     label: "I'm hosting a dinner party",         query: "I'm hosting a dinner party, help me plan the meal and groceries" },
    { icon: Gift,         label: 'Find a gift under Rs.2,000',         query: 'Find a gift under Rs.2,000' },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-16 overflow-y-auto no-scrollbar">
      {/* Avatar */}
      <div className="relative mb-8" style={{ width: 72, height: 72 }}>
        <div
          style={{
            position: 'absolute', inset: -18, borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(160,98,60,0.18) 0%, transparent 70%)',
            filter: 'blur(12px)',
          }}
        />
        <div
          style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'var(--accent-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
            boxShadow: '0 8px 32px rgba(160,98,60,0.28)',
          }}
        >
          <span style={{ color: '#FFFDF8', fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em', fontFamily: 'var(--font-sans)' }}>
            N
          </span>
        </div>
      </div>

      {/* Heading */}
      <h1
        className="font-serif text-center mb-2.5 leading-tight"
        style={{ color: 'var(--text-primary)', fontSize: 34, fontWeight: 700, letterSpacing: '-0.01em' }}
      >
        NeedNow Agent
      </h1>

      {/* Sub-heading */}
      <p
        className="font-serif text-center mb-3.5"
        style={{ color: 'var(--text-primary)', fontSize: 20, opacity: 0.55, fontStyle: 'italic', fontWeight: 400 }}
      >
        What are we finding today?
      </p>

      {/* Supporting copy */}
      <p
        className="text-center mb-10 max-w-[360px] leading-relaxed"
        style={{ color: 'var(--text-secondary)', fontSize: 15, opacity: 0.8 }}
      >
        Tell me what you're planning, building, cooking or buying — I'll find exactly what you need.
      </p>

      {/* Composer */}
      <form onSubmit={handleSubmit} className="w-full max-w-[580px] mb-7">
        <div
          className="relative flex items-end rounded-2xl p-2"
          style={{
            background: 'var(--agent-content)',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 20px rgba(43,31,23,0.06)',
          }}
        >
          <textarea
            ref={inputRef}
            value={localInput}
            onChange={(e) => setLocalInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const text = localInput.trim();
                if (text) onSend(text);
              }
            }}
            placeholder="Describe what you need..."
            rows={1}
            className="flex-1 bg-transparent outline-none resize-none leading-relaxed"
            style={{
              padding: '12px 16px',
              fontSize: 16,
              color: 'var(--text-primary)',
              minHeight: 56,
              maxHeight: 140,
              fontFamily: 'var(--font-sans)',
            }}
          />
          <button
            type="submit"
            disabled={!localInput.trim()}
            className="flex items-center justify-center cursor-pointer transition-all duration-150 hover:opacity-90 active:scale-95"
            style={{
              padding: 13,
              borderRadius: 14,
              background: 'var(--accent-primary)',
              color: '#FFFDF8',
              opacity: localInput.trim() ? 1 : 0.3,
              flexShrink: 0,
            }}
          >
            <Send size={17} strokeWidth={2.5} />
          </button>
        </div>
        <p
          className="text-center mt-2"
          style={{ fontSize: 11, color: 'var(--text-secondary)', opacity: 0.35 }}
        >
          Enter to send · Shift+Enter for new line
        </p>
      </form>

      {/* Quick suggestions */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-[580px]">
        {suggestions.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.label}
              onClick={() => onSend(s.query)}
              className="flex items-center gap-3 text-left cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
              style={{
                padding: '14px 16px',
                borderRadius: 16,
                fontSize: 14,
                fontWeight: 500,
                background: 'var(--agent-content)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                boxShadow: '0 2px 8px rgba(43,31,23,0.04)',
                lineHeight: 1.35,
              }}
            >
              <div
                className="flex items-center justify-center shrink-0 rounded-lg"
                style={{ width: 34, height: 34, background: 'var(--accent-muted)' }}
              >
                <Icon size={16} style={{ color: 'var(--accent-primary)' }} strokeWidth={2} />
              </div>
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Conversation Composer ────────────────────────────────────────────────────

function ConversationComposer({
  input,
  setInput,
  isStreaming,
  onSubmit,
  onCancel,
}: {
  input: string;
  setInput: (v: string) => void;
  isStreaming: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [input]);

  return (
    <div
      className="shrink-0 px-6 py-4"
      style={{
        borderTop: '1px solid var(--border)',
        background: 'var(--agent-conversation)',
        boxShadow: '0 -6px 24px rgba(43,31,23,0.05)',
      }}
    >
      <form onSubmit={onSubmit}>
        <div
          className="flex items-end gap-2 rounded-2xl p-2"
          style={{
            background: 'var(--agent-content)',
            border: '1px solid var(--border)',
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e as any);
              }
            }}
            placeholder="Continue the conversation…"
            disabled={isStreaming}
            rows={1}
            className="flex-1 bg-transparent outline-none resize-none disabled:opacity-50 leading-relaxed"
            style={{
              padding: '14px 14px',
              fontSize: 16,
              color: 'var(--text-primary)',
              minHeight: 58,
              maxHeight: 160,
              fontFamily: 'var(--font-sans)',
            }}
          />
          <div className="flex items-center gap-2 pb-1.5 shrink-0">
            {isStreaming ? (
              <button
                type="button"
                onClick={onCancel}
                className="flex items-center justify-center cursor-pointer transition-all hover:opacity-80 active:scale-95"
                style={{
                  padding: 12, borderRadius: 14,
                  background: 'rgba(185,74,62,0.10)',
                  color: 'var(--destructive)',
                }}
                title="Stop generation"
              >
                <StopCircle size={17} strokeWidth={2} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="flex items-center justify-center cursor-pointer transition-all hover:opacity-90 active:scale-95"
                style={{
                  padding: 12, borderRadius: 14,
                  background: 'var(--accent-primary)',
                  color: '#FFFDF8',
                  opacity: input.trim() ? 1 : 0.3,
                }}
                title="Send"
              >
                <Send size={17} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
        <p
          className="text-center mt-2 px-1"
          style={{ fontSize: 11, color: 'var(--text-secondary)', opacity: 0.32 }}
        >
          Enter to send · Shift+Enter for new line
        </p>
      </form>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTask, setCurrentTask] = useState<string | null>(null);

  const { addItem } = useCart();
  const { triggerFlyAnimation } = useFlyToCart();
  void addItem;
  void triggerFlyAnimation;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, statusMessage]);

  useEffect(() => {
    async function loadHistory() {
      const token = await getToken();
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/agent/history/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.messages) {
            const msgs: Message[] = data.messages.map((m: any) => ({
              id: m.id, role: m.role, content: m.content, createdAt: m.created_at,
            }));
            setMessages(msgs);
            const lastUser = [...msgs].reverse().find((m) => m.role === 'user');
            if (lastUser) setCurrentTask(lastUser.content.slice(0, 80));
          }
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    }
    loadHistory();
  }, []);

  const cancelStream = useCallback(() => {
    readerRef.current?.cancel().catch(() => {});
    setIsStreaming(false);
    setStatusMessage(null);
  }, []);

  const sendMessage = useCallback(
    async (messageText: string) => {
      const text = messageText.trim();
      if (!text || isStreaming) return;

      setError(null);
      setInput('');
      setCurrentTask(text.slice(0, 80));

      const userMessageId = `user-${Date.now()}`;
      const assistantMessageId = `assistant-${Date.now()}`;

      setMessages((prev) => [...prev, { id: userMessageId, role: 'user', content: text }]);
      setIsStreaming(true);
      setStatusMessage('Consulting catalog & generating recommendations…');

      try {
        const token = await getToken();
        if (!token) throw new Error('Authentication required. Please log in.');

        const response = await fetch(`${API_BASE}/agent/chat/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ message: text }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Request failed (${response.status})`);
        }
        if (!response.body) throw new Error('No response stream available');

        setMessages((prev) => [...prev, { id: assistantMessageId, role: 'assistant', content: '' }]);
        setStatusMessage(null);

        const reader = response.body.getReader();
        readerRef.current = reader;
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const event = JSON.parse(trimmed);
              if (event.type === 'status') {
                setStatusMessage(event.message);
              } else if (event.type === 'token') {
                setStatusMessage(null);
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: msg.content + event.content }
                      : msg
                  )
                );
              } else if (event.type === 'done') {
                setStatusMessage(null);
              } else if (event.type === 'error') {
                setError(event.message || 'Stream error occurred.');
                setStatusMessage(null);
              }
            } catch (e) {
              console.error('Failed to parse NDJSON line:', trimmed, e);
            }
          }
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError' && err?.message !== 'Cancelled') {
          setError(err.message || 'An error occurred during chat.');
        }
        setStatusMessage(null);
      } finally {
        setIsStreaming(false);
        setStatusMessage(null);
        readerRef.current = null;
      }
    },
    [isStreaming]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const hasConversation = messages.length > 0;

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: 'var(--background)' }}
    >
      <AtmosphericLayer />

      {/* Navbar */}
      <div className="relative z-10 shrink-0">
        <Navbar />
      </div>

      {/* Workspace — centered max-width with agent container */}
      <div className="relative z-10 flex-1 overflow-hidden flex justify-center" style={{ background: 'var(--background)' }}>
        <div
          className="app-container-agent flex h-full"
          style={{
            gap: '24px',
          }}
        >
          {/* ── LEFT: Conversation Column ── */}
          <div
            className="flex flex-col flex-1 min-w-0 overflow-hidden rounded-2xl"
            style={{
              background: 'var(--agent-conversation)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            {!hasConversation ? (
              <WelcomeState onSend={sendMessage} />
            ) : (
              <>
                {/* Messages scroll area */}
                <div className="flex-1 overflow-y-auto no-scrollbar">
                  {/* Conversation header strip */}
                  <div
                    className="px-9 pt-6 pb-4 shrink-0"
                    style={{ borderBottom: '1px solid var(--border)', opacity: 0.8 }}
                  >
                    <p
                      style={{
                        fontSize: 11, fontWeight: 900,
                        textTransform: 'uppercase', letterSpacing: '0.18em',
                        color: 'var(--text-secondary)', opacity: 0.6,
                      }}
                    >
                      Agent Workspace
                    </p>
                  </div>

                  {/* Messages */}
                  <div className="px-9 py-8 flex flex-col gap-9">
                    {messages.map((msg, idx) => {
                      const isLast = idx === messages.length - 1;
                      return (
                        <React.Fragment key={msg.id}>
                          {msg.role === 'assistant' ? (
                            <AgentMessage
                              msg={msg}
                              onAction={sendMessage}
                              isLatest={isLast && msg.role === 'assistant'}
                            />
                          ) : (
                            <UserMessage msg={msg} />
                          )}
                        </React.Fragment>
                      );
                    })}

                    {/* Typing indicator */}
                    {statusMessage && <AgentTyping message={statusMessage} />}

                    {/* Error */}
                    {error && (
                      <div
                        className="flex items-center gap-3 rounded-xl"
                        style={{
                          padding: '14px 16px',
                          fontSize: 14,
                          fontWeight: 600,
                          background: 'rgba(185,74,62,0.08)',
                          color: 'var(--destructive)',
                          border: '1px solid rgba(185,74,62,0.14)',
                        }}
                      >
                        <X size={15} strokeWidth={2.5} />
                        {error}
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Sticky composer — scoped to conversation column */}
                <ConversationComposer
                  input={input}
                  setInput={setInput}
                  isStreaming={isStreaming}
                  onSubmit={handleSubmit}
                  onCancel={cancelStream}
                />
              </>
            )}
          </div>

          {/* ── RIGHT: Commerce Sidebar ── */}
          <div
            className="hidden lg:block shrink-0 overflow-hidden rounded-2xl"
            style={{
              width: 'clamp(360px, 26vw, 400px)',
              background: 'var(--agent-sidebar)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <CommerceSidebar
              messages={messages}
              currentTask={hasConversation ? currentTask : null}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
