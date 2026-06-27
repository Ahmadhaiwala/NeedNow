'use client'

import { motion } from 'framer-motion'
import { Send, Mic } from 'lucide-react'
import { ChatMessage } from '@/lib/types'
import { useState } from 'react'

interface ChatInterfaceProps {
  messages: ChatMessage[]
  onSendMessage?: (text: string) => void
  onSelectReply?: (text: string) => void
  isCompact?: boolean
}

export function ChatInterface({
  messages,
  onSendMessage,
  onSelectReply,
  isCompact = false,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage?.(input)
      setInput('')
    }
  }

  const handleReply = (text: string) => {
    onSelectReply?.(text)
    setInput('')
  }

  const containerClass = isCompact
    ? 'flex flex-col h-96 bg-white rounded-lg border border-sky-blue'
    : 'flex flex-col h-full bg-white rounded-lg'

  const messagesClass = isCompact ? 'flex-1 overflow-y-auto p-3 space-y-2' : 'flex-1 overflow-y-auto p-4 space-y-3'

  return (
    <div className={containerClass}>
      {/* Messages */}
      <div className={messagesClass}>
        {messages.map((msg, index) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.sender === 'user'
                  ? 'bg-teal text-white'
                  : 'bg-sky-blue text-navy'
              }`}
            >
              <p className="text-sm">{msg.text}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Replies */}
      {messages[messages.length - 1]?.quickReplies && (
        <div className="px-4 pb-3 space-y-2">
          {messages[messages.length - 1].quickReplies.map((reply, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleReply(reply)}
              className="w-full text-left px-3 py-2 rounded-full border border-navy text-navy text-sm hover:bg-navy hover:text-white transition"
            >
              {reply}
            </motion.button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-sky-blue p-3 space-y-2">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 rounded-full border border-sky-blue focus:outline-none focus:ring-2 focus:ring-teal bg-beige text-sm"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSend()}
            className="p-2 rounded-full bg-teal text-white hover:bg-navy transition"
          >
            <Send className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-full border border-navy text-navy hover:bg-navy hover:text-white transition"
          >
            <Mic className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  )
}
