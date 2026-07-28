'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../navbar/Navbar';
import { Mic, Send, Sparkles, ShoppingBag, Bookmark, Search, RefreshCw, Cpu, Layers, Loader2, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useFlyToCart } from '@/context/FlyToCartContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
  buildSummary?: {
    title: string;
    totalPrice: string;
    items: string[];
  };
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

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addItem } = useCart();
  const { triggerFlyAnimation } = useFlyToCart();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, statusMessage]);

  useEffect(() => {
    async function loadHistory() {
      const token = await getToken();
      if (!token) return;

      try {
        const res = await fetch(`${API_BASE}/agent/history/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.messages) {
            setMessages(
              data.messages.map((m: any) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                createdAt: m.created_at,
              }))
            );
          }
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    }

    loadHistory();
  }, []);

  const sendMessage = async (messageText: string) => {
    const text = messageText.trim();
    if (!text || isStreaming) return;

    setError(null);
    setInput('');

    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `assistant-${Date.now()}`;

    const userMsg: Message = {
      id: userMessageId,
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    setStatusMessage('Consulting catalog & generating recommendations...');

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }

      const response = await fetch(`${API_BASE}/agent/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed (${response.status})`);
      }

      if (!response.body) {
        throw new Error('No response stream available');
      }

      setMessages((prev) => [
        ...prev,
        { id: assistantMessageId, role: 'assistant', content: '' },
      ]);
      setStatusMessage(null);

      const reader = response.body.getReader();
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
      setError(err.message || 'An error occurred during chat.');
      setStatusMessage(null);
    } finally {
      setIsStreaming(false);
      setStatusMessage(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ background: 'var(--bg-page)' }}>
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col h-[calc(100vh-100px)]">
        {/* Header Bar matching Inspiration Workspace Specs */}
        <div 
          className="mb-4 p-4 rounded-2xl flex items-center justify-between shadow-card"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold" 
              style={{ background: 'var(--accent-primary)', color: '#FFFDF8' }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold text-[var(--text-primary)]">
                AI Agent
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                Your intelligent shopping assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full hover:bg-[var(--bg-page)] text-[var(--text-secondary)]" title="Search history">
              <Search size={16} />
            </button>
            <button className="p-2 rounded-full hover:bg-[var(--bg-page)] text-[var(--text-secondary)]" title="Saved recommendations">
              <Bookmark size={16} />
            </button>
          </div>
        </div>

        {/* Chat Message Scroll Container */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 no-scrollbar">
          {messages.length === 0 ? (
            <div 
              className="h-full flex flex-col items-center justify-center text-center p-8 rounded-3xl"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(154, 101, 60, 0.12)', color: 'var(--accent-primary)' }}
              >
                <Sparkles className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-[var(--text-primary)] mb-2">
                What can I help you build or find today?
              </h2>
              <p className="text-xs text-[var(--text-secondary)] max-w-md mb-8 leading-relaxed">
                Describe your requirements (e.g. "Build me a coding PC under ₹80,000" or "Setup a weekly healthy grocery box") and I'll find optimal products from our catalog.
              </p>

              {/* Sample Quick Prompts matching Reference Image */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                {[
                  '💻 Build me a coding PC under ₹80,000',
                  '🍎 Setup a healthy weekly grocery box',
                  '🎧 Recommend top noise cancelling earbuds',
                  '🏠 Best living room essentials under ₹5,000',
                ].map((promptText) => (
                  <button
                    key={promptText}
                    onClick={() => sendMessage(promptText.replace(/^.\s*/, ''))}
                    className="text-left text-xs font-medium p-4 rounded-2xl transition-all cursor-pointer flex items-center justify-between"
                    style={{
                      background: 'var(--surface-2)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <span>{promptText}</span>
                    <ArrowRight size={13} style={{ color: 'var(--accent-primary)' }} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1"
                    style={{ background: 'var(--accent-primary)', color: '#FFFDF8' }}
                  >
                    N
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'font-medium rounded-br-none'
                      : 'rounded-bl-none'
                  }`}
                  style={{
                    background: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--surface-2)',
                    color: msg.role === 'user' ? '#FFFDF8' : 'var(--text-primary)',
                    border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Render Build Summary Card matching Inspiration reference */}
                  {msg.role === 'assistant' && msg.content.toLowerCase().includes('pc') && (
                    <div 
                      className="mt-4 p-4 rounded-xl border shadow-sm"
                      style={{
                        background: 'var(--surface-1)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <div className="flex items-center justify-between mb-3 border-b pb-2" style={{ borderColor: 'var(--border)' }}>
                        <span className="font-serif font-bold text-xs flex items-center gap-1.5" style={{ color: 'var(--accent-primary)' }}>
                          <Cpu size={14} /> Build Summary
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(154, 101, 60, 0.12)', color: 'var(--accent-primary)' }}>
                          Under ₹80,000
                        </span>
                      </div>

                      <ul className="text-[11px] space-y-1.5 opacity-90 mb-4">
                        <li className="flex items-center gap-2"><span>•</span> Intel Core i5-13400F Processor</li>
                        <li className="flex items-center gap-2"><span>•</span> MSI B760M DDR4 Motherboard</li>
                        <li className="flex items-center gap-2"><span>•</span> Corsair Vengeance 16GB (8x2) 3200MHz RAM</li>
                        <li className="flex items-center gap-2"><span>•</span> Kingston 512GB M.2 NVMe SSD</li>
                        <li className="flex items-center gap-2"><span>•</span> GTX 1650 4GB Graphics Card</li>
                        <li className="flex items-center gap-2"><span>•</span> Cooler Master 550W 80+ Bronze PSU</li>
                      </ul>

                      <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                        <div>
                          <p className="text-[10px] opacity-75">Total Estimated Price</p>
                          <p className="text-sm font-extrabold" style={{ color: 'var(--accent-primary)' }}>₹78,450</p>
                        </div>

                        <button
                          onClick={(e) => {
                            triggerFlyAnimation(e, '');
                            addItem('boAt-01', 1).catch(console.error);
                          }}
                          className="px-4 py-2 rounded-full font-bold text-xs cursor-pointer transition-all"
                          style={{ background: 'var(--accent-primary)', color: '#FFFDF8' }}
                        >
                          Add all to cart
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Quick Action Pills */}
                  {msg.role === 'assistant' && (
                    <div className="mt-3 pt-3 flex flex-wrap gap-2 border-t" style={{ borderColor: 'var(--border)' }}>
                      <button
                        onClick={() => sendMessage('Add these recommended items to my cart')}
                        className="px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer flex items-center gap-1 transition-all"
                        style={{ background: 'rgba(154, 101, 60, 0.12)', color: 'var(--accent-primary)' }}
                      >
                        <ShoppingBag size={11} /> Add to cart
                      </button>
                      <button
                        onClick={() => sendMessage('Show me lower budget alternatives')}
                        className="px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer flex items-center gap-1 transition-all"
                        style={{ background: 'var(--surface-1)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                      >
                        <RefreshCw size={11} /> Show alternatives
                      </button>
                      <button
                        onClick={() => sendMessage('Also recommend a 24 inch monitor')}
                        className="px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer flex items-center gap-1 transition-all"
                        style={{ background: 'var(--surface-1)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                      >
                        <Layers size={11} /> Add monitor too
                      </button>
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                  >
                    U
                  </div>
                )}
              </div>
            ))
          )}

          {/* Status Indicator */}
          {statusMessage && (
            <div 
              className="flex items-center gap-2.5 text-xs font-bold rounded-full px-4 py-2 w-fit shadow-sm"
              style={{ background: 'rgba(154, 101, 60, 0.12)', color: 'var(--accent-primary)' }}
            >
              <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-ping" />
              <span>{statusMessage}</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-2xl text-xs font-semibold" style={{ background: 'rgba(185,74,62,0.12)', color: 'var(--color-heat)' }}>
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="mt-3 pt-2">
          <div 
            className="relative flex items-center rounded-full p-2 shadow-md transition-colors"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
            }}
          >
            <button type="button" className="p-2.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)]" title="Voice Input">
              <Mic size={16} />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything... (e.g., need groceries, party setup, coding PC...)"
              disabled={isStreaming}
              className="flex-1 bg-transparent px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="p-2.5 rounded-full transition-all flex items-center justify-center cursor-pointer shrink-0"
              style={{
                background: 'var(--accent-primary)',
                color: '#FFFDF8',
                opacity: (!input.trim() || isStreaming) ? 0.4 : 1,
              }}
            >
              <Send size={14} />
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}