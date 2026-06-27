'use client'

import { useState } from 'react'
import { mockChatFlow } from '@/lib/mock-data'
import { AnimatedPage } from '@/components/AnimatedPage'
import { ChatInterface } from '@/components/ChatInterface'
import { CartPanel } from '@/components/CartPanel'
import { ChatMessage } from '@/lib/types'

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatFlow)

  const handleSendMessage = (text: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])

    // Simulate AI response after delay
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'That sounds great! Let me find the best options for you.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
    }, 1500)
  }

  const handleSelectReply = (text: string) => {
    handleSendMessage(text)
  }

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-beige pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-navy mb-8">Chat with NeedNow</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            {/* Chat */}
            <div className="lg:col-span-2">
              <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                onSelectReply={handleSelectReply}
              />
            </div>

            {/* Cart */}
            <div className="lg:col-span-1">
              <CartPanel />
            </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  )
}
