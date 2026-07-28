'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../navbar/Navbar';

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

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, statusMessage]);

  // Load chat history on mount
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
    setStatusMessage('Connecting to assistant...');

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

      // Add placeholder assistant message
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
    <div className="min-h-screen bg-[var(--bg-page,#1F3635)] text-[var(--text-primary,#FCFBF4)] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col h-[calc(100vh-80px)]">
        {/* Header */}
        <div className="mb-4 pb-4 border-b border-[#3D6A68] flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary,#FCFBF4)] tracking-wide flex items-center gap-2">
              NeedNow Intelligent Shopping Assistant
            </h1>
            <p className="text-xs text-[var(--text-secondary,#C9C1AC)] mt-0.5">
              Context-aware catalog search, specs comparison, recommendations, and cart management
            </p>
          </div>
        </div>

        {/* Chat Message Scroll Container */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-[#3D6A68] rounded-3xl bg-[var(--bg-surface,#3D6A68)]/30">
              <div className="w-12 h-12 rounded-2xl bg-[var(--accent-primary,#CACE00)]/20 text-[var(--accent-primary,#CACE00)] flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-[var(--text-primary,#FCFBF4)] mb-2">
                Welcome to NeedNow Assistant
              </h2>
              <p className="text-sm text-[var(--text-secondary,#C9C1AC)] max-w-md mb-6">
                Ask about products, compare specifications, request personalized recommendations, or manage your shopping cart.
              </p>

              {/* Sample Prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {[
                  'My CPU is overheating. What should I buy?',
                  'Find top rated winter boots for men',
                  'What is in my shopping cart?',
                  'Show personalized recommendations for me',
                ].map((promptText) => (
                  <button
                    key={promptText}
                    onClick={() => sendMessage(promptText)}
                    className="text-left text-xs p-3 rounded-2xl bg-[var(--bg-surface,#3D6A68)] hover:bg-[var(--bg-surface-raised,#487D7B)] border border-white/5 transition-all duration-200 text-[var(--text-primary,#FCFBF4)]"
                  >
                    {promptText}
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
                  <div className="w-8 h-8 rounded-xl bg-[var(--accent-primary,#CACE00)] text-[#1F3635] flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                    AI
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-3xl px-5 py-3.5 text-sm shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-[var(--accent-primary,#CACE00)] text-[#1F3635] font-medium rounded-br-none'
                      : 'bg-[var(--bg-surface,#3D6A68)] text-[var(--text-primary,#FCFBF4)] rounded-bl-none border border-white/5'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-[#487D7B] text-[var(--text-primary,#FCFBF4)] flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                    U
                  </div>
                )}
              </div>
            ))
          )}

          {/* Status Indicator */}
          {statusMessage && (
            <div className="flex items-center gap-3 text-xs text-[var(--accent-primary,#CACE00)] bg-[var(--bg-surface,#3D6A68)]/60 border border-[var(--accent-primary,#CACE00)]/30 rounded-2xl px-4 py-2.5 w-fit">
              <div className="w-2 h-2 rounded-full bg-[var(--accent-primary,#CACE00)] animate-ping" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Error Message Display */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-900/40 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
              <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="mt-4 pt-3">
          <div className="relative flex items-center bg-[var(--bg-surface,#3D6A68)] rounded-3xl p-1.5 border border-white/10 focus-within:border-[var(--accent-primary,#CACE00)] transition-colors">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for products, compare specs, get recommendations..."
              disabled={isStreaming}
              className="flex-1 bg-transparent px-4 py-3 text-sm text-[var(--text-primary,#FCFBF4)] placeholder-[var(--text-secondary,#C9C1AC)]/60 outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="bg-[var(--accent-primary,#CACE00)] text-[#1F3635] px-5 py-2.5 rounded-2xl text-xs font-semibold hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:hover:brightness-100 transition-all flex items-center gap-1.5"
            >
              <span>Send</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}