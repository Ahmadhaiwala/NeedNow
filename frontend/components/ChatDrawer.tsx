'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ChatMessage, 
  getChatHistory, 
  sendChatMessage 
} from '@/lib/marketplace';
import { 
  X, 
  Send, 
  Loader2, 
  MessageSquare, 
  User 
} from 'lucide-react';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  otherUserId: string;
  otherUserName: string;
  postId?: number;
  currentUserId: string;
  currentUserEmail?: string;
}

export default function ChatDrawer({
  isOpen,
  onClose,
  otherUserId,
  otherUserName,
  postId,
  currentUserId,
  currentUserEmail,
}: ChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputContent, setInputContent] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll for messages every 2 seconds when chat is open
  useEffect(() => {
    if (!isOpen || !otherUserId) return;

    fetchMessages();
    const interval = setInterval(() => {
      fetchMessages(true); // silent polling
    }, 2000);

    return () => clearInterval(interval);
  }, [isOpen, otherUserId, postId]);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 100);
  };

  // Scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const fetchMessages = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getChatHistory(otherUserId, postId);
      if (Array.isArray(data)) {
        setMessages((prev) => {
          const map = new Map<number, ChatMessage>();
          prev.forEach((m) => map.set(m.id, m));
          data.forEach((m) => map.set(m.id, m));
          return Array.from(map.values()).sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
      }
    } catch (err) {
      console.error('Error polling chat history:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim()) return;

    const contentToSend = inputContent.trim();
    setInputContent('');

    // Create 0ms Optimistic Message
    const tempId = -Date.now();
    const tempMsg: ChatMessage = {
      id: tempId,
      sender: currentUserId,
      recipient: otherUserId,
      content: contentToSend,
      is_read: false,
      created_at: new Date().toISOString(),
      sender_details: {
        id: currentUserId,
        email: currentUserEmail || '',
        display_name: 'You',
      },
    };

    setMessages((prev) => [...prev, tempMsg]);
    scrollToBottom();
    setSending(true);

    try {
      const realMsg = await sendChatMessage(otherUserId, {
        content: contentToSend,
        post: postId,
      });
      // Replace optimistic message with real server message
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? realMsg : m))
      );
      scrollToBottom();
    } catch (err) {
      console.error('Error sending message:', err);
      // Remove optimistic message and restore input on error
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInputContent(contentToSend);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] shadow-2xl animate-slideInRight flex flex-col"
      style={{
        background: 'var(--bg-surface)',
        borderLeft: '1px solid rgba(31,54,53,0.1)',
      }}
    >
      {/* Header */}
      <div className="p-4 sm:p-5 flex justify-between items-center border-b border-[rgba(31,54,53,0.08)] bg-[var(--bg-surface)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[var(--color-sky)] text-[var(--color-core)] font-bold text-xs flex items-center justify-center uppercase">
            {otherUserName[0] || 'U'}
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              {otherUserName}
            </h3>
            <p className="text-[10px] text-[var(--color-jade)] font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-jade)] animate-pulse" />
              Live Marketplace Chat (Polling)
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-[var(--bg-page)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages List Area */}
      <div className="flex-grow min-h-0 p-4 overflow-y-auto flex flex-col gap-3 bg-[var(--bg-page)] scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center h-full gap-2 text-xs text-[var(--text-secondary)]">
            <Loader2 size={16} className="animate-spin text-[var(--color-juice)]" />
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center my-auto py-8">
            <MessageSquare size={32} className="mx-auto mb-2 text-[var(--text-secondary)] opacity-30" />
            <p className="text-xs font-semibold text-[var(--text-primary)]">Start the conversation</p>
            <p className="text-[11px] text-[var(--text-secondary)] mt-1">
              Send a message to agree on pickup time or item details.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = Boolean(
              (currentUserId && String(msg.sender).toLowerCase() === String(currentUserId).toLowerCase()) ||
              (currentUserId && String(msg.sender_details?.id).toLowerCase() === String(currentUserId).toLowerCase()) ||
              (currentUserEmail && msg.sender_details?.email && currentUserEmail.toLowerCase() === msg.sender_details.email.toLowerCase())
            );

            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[80%] ${
                  isMe ? 'self-end items-end' : 'self-start items-start'
                }`}
              >
                {!isMe && (
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] mb-0.5 px-1">
                    {msg.sender_details?.display_name || msg.sender_details?.first_name || otherUserName}
                  </span>
                )}
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    isMe
                      ? 'bg-[var(--color-juice)] text-[var(--color-core)] font-semibold rounded-tr-none shadow-xs'
                      : 'bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-tl-none border border-[rgba(31,54,53,0.08)] shadow-xs'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[9px] text-[var(--text-secondary)] mt-1 px-1">
                  {isMe ? 'You • ' : ''}
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Footer */}
      <form onSubmit={handleSend} className="p-4 border-t border-[rgba(31,54,53,0.08)] bg-[var(--bg-surface)] flex gap-2">
        <input
          type="text"
          placeholder="Type a message..."
          value={inputContent}
          onChange={(e) => setInputContent(e.target.value)}
          className="flex-grow p-3 text-xs bg-[var(--bg-page)] text-[var(--text-primary)] rounded-[var(--radius-md)] border-0 focus:ring-2 focus:ring-[var(--color-juice)] outline-none"
        />
        <button
          type="submit"
          disabled={sending || !inputContent.trim()}
          className="px-4 py-3 bg-[var(--accent-primary)] text-[var(--color-core)] font-bold text-xs rounded-[var(--radius-md)] hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>
    </div>
  );
}
