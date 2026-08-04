'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Send, 
  Image as ImageIcon, 
  Paperclip, 
  MapPin, 
  Star, 
  ShieldCheck, 
  CheckCheck, 
  Search, 
  ArrowLeft,
  DollarSign
} from 'lucide-react';
import { 
  ChatMessage, 
  ConversationSummary, 
  getChatHistory, 
  sendChatMessage, 
  getChatConversations 
} from '@/lib/marketplace';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialRecipientId?: string | null;
  initialRecipientName?: string;
  initialPostId?: number;
  initialPostTitle?: string;
}

export default function ChatDrawer({
  isOpen,
  onClose,
  initialRecipientId,
  initialRecipientName = 'Community Member',
  initialPostId,
  initialPostTitle,
}: ChatDrawerProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeUser, setActiveUser] = useState<{ id: string; name: string } | null>(null);
  const [activePostId, setActivePostId] = useState<number | undefined>(initialPostId);
  const [activePostTitle, setActivePostTitle] = useState<string | undefined>(initialPostTitle);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch conversation thread list
      getChatConversations().then(setConversations).catch(() => []);

      if (initialRecipientId) {
        setActiveUser({ id: initialRecipientId, name: initialRecipientName });
        setActivePostId(initialPostId);
        setActivePostTitle(initialPostTitle);
      }
    }
  }, [isOpen, initialRecipientId, initialRecipientName, initialPostId, initialPostTitle]);

  useEffect(() => {
    if (activeUser?.id) {
      setLoading(true);
      getChatHistory(activeUser.id, activePostId)
        .then((msgs) => {
          setMessages(msgs);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [activeUser, activePostId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSendMessage = async () => {
    if (!messageText.trim() && !selectedImage) return;
    if (!activeUser?.id) return;

    try {
      const newMsg = await sendChatMessage(
        activeUser.id,
        messageText,
        activePostId,
        selectedImage || undefined
      );
      setMessages([...messages, newMsg]);
      setMessageText('');
      setSelectedImage(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Chat Main Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          className="relative w-full max-w-4xl h-[85vh] rounded-3xl overflow-hidden flex z-10 shadow-modal"
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border)',
          }}
        >
          {/* Left Conversations Sidebar */}
          <div className={`w-full sm:w-80 border-r border-[var(--border-muted)] flex flex-col shrink-0 ${activeUser ? 'hidden sm:flex' : 'flex'}`}>
            <div className="p-4 border-b border-[var(--border-muted)] flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg" style={{ color: 'var(--foreground)' }}>
                Messages
              </h3>
              <button onClick={onClose} className="sm:hidden text-[var(--foreground-muted)]">
                <X size={18} />
              </button>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-muted)]">
              {conversations.length === 0 && !activeUser ? (
                <p className="text-xs text-center py-8" style={{ color: 'var(--foreground-muted)' }}>
                  No messages yet.
                </p>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={`${conv.other_user_id}_${conv.post_id}`}
                    onClick={() => {
                      setActiveUser({ id: conv.other_user_id, name: conv.other_user_name });
                      setActivePostId(conv.post_id || undefined);
                      setActivePostTitle(conv.post_title || undefined);
                    }}
                    className={`p-4 flex items-center gap-3 cursor-pointer transition-colors ${
                      activeUser?.id === conv.other_user_id ? 'bg-[var(--surface-2)] font-bold' : 'hover:bg-[var(--surface-2)]/60'
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(conv.other_user_name)}&background=A0623C&color=fff`}
                        alt="User"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      {conv.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold flex items-center justify-center">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold truncate" style={{ color: 'var(--foreground)' }}>
                          {conv.other_user_name}
                        </h4>
                        <span className="text-[10px]" style={{ color: 'var(--foreground-muted)' }}>
                          {new Date(conv.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {conv.post_title && (
                        <p className="text-[11px] truncate text-[var(--accent)]">
                          🏷️ {conv.post_title}
                        </p>
                      )}
                      <p className="text-xs truncate opacity-80" style={{ color: 'var(--foreground-muted)' }}>
                        {conv.latest_message.content || 'Image attachment'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Chat Thread & Window */}
          <div className={`flex-1 flex flex-col ${!activeUser ? 'hidden sm:flex justify-center items-center p-8' : 'flex'}`}>
            {!activeUser ? (
              <div className="text-center space-y-2">
                <h4 className="font-serif font-bold text-lg" style={{ color: 'var(--foreground)' }}>
                  Select a Conversation
                </h4>
                <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                  Choose a chatter from the sidebar to view thread history.
                </p>
              </div>
            ) : (
              <>
                {/* Chat Header with Linked Listing Banner */}
                <div className="p-4 border-b border-[var(--border-muted)] flex items-center justify-between bg-[var(--surface-2)]">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setActiveUser(null)} className="sm:hidden text-[var(--foreground-muted)]">
                      <ArrowLeft size={18} />
                    </button>
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(activeUser.name)}&background=A0623C&color=fff`}
                      alt={activeUser.name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
                        {activeUser.name}
                      </h4>
                      <span className="text-[11px] text-[var(--success)] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" /> Online
                      </span>
                    </div>
                  </div>

                  {activePostTitle && (
                    <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs" style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
                      <span className="truncate max-w-[180px]" style={{ color: 'var(--foreground)' }}>{activePostTitle}</span>
                    </div>
                  )}

                  <button onClick={onClose} className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
                    <X size={18} />
                  </button>
                </div>

                {/* Message Stream */}
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
                  {messages.map((msg) => {
                    const isSender = activeUser.id !== msg.sender;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isSender ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3.5 rounded-2xl text-xs space-y-2 ${
                            isSender
                              ? 'bg-[var(--accent)] text-white rounded-br-none'
                              : 'bg-[var(--surface-2)] text-[var(--foreground)] border border-[var(--border)] rounded-bl-none'
                          }`}
                        >
                          {msg.image_url && (
                            <img src={msg.image_url} alt="Attachment" className="rounded-xl max-h-48 object-cover" />
                          )}
                          {msg.content && <p className="leading-relaxed">{msg.content}</p>}
                        </div>
                        <span className="text-[10px] mt-1 opacity-70" style={{ color: 'var(--foreground-muted)' }}>
                          {new Date(msg.created_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Footer / Input */}
                <div className="p-4 border-t border-[var(--border-muted)] bg-[var(--surface-2)] space-y-2">
                  {selectedImage && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent)]">
                      <ImageIcon size={14} /> Attached: {selectedImage.name}
                      <button onClick={() => setSelectedImage(null)} className="text-red-500 text-[10px]">Remove</button>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => document.getElementById('chat-file')?.click()}
                      className="p-2.5 rounded-xl cursor-pointer hover:bg-[var(--surface-1)]"
                      style={{ color: 'var(--foreground-muted)' }}
                    >
                      <Paperclip size={18} />
                    </button>
                    <input
                      id="chat-file"
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && setSelectedImage(e.target.files[0])}
                      className="hidden"
                    />

                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 p-2.5 rounded-xl text-xs outline-none font-medium"
                      style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                    />

                    <button
                      onClick={handleSendMessage}
                      className="p-2.5 rounded-xl cursor-pointer transition-all hover:scale-105"
                      style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
