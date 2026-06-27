'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ShoppingCart, MessageSquare, UtensilsCrossed, Users } from 'lucide-react'
import { AnimatedPage } from '@/components/AnimatedPage'
import { CategoryCard } from '@/components/CategoryCard'
import { mockCategories } from '@/lib/mock-data'

export default function HomePage() {
  const features = [
    {
      icon: MessageSquare,
      title: 'AI Chat Assistant',
      description: 'Chat with NeedNow to get personalized ingredient recommendations',
    },
    {
      icon: ShoppingCart,
      title: 'Smart Shopping',
      description: 'Browse products and add to cart with smart price comparisons',
    },
    {
      icon: UtensilsCrossed,
      title: 'Pantry Management',
      description: 'Keep track of your pantry items and expiry dates',
    },
    {
      icon: Users,
      title: 'Group Shopping',
      description: 'Shop together with friends and split costs easily',
    },
  ]

  const scenarios = [
    { title: 'Cooking Dinner', emoji: '🍛', color: 'bg-orange-100 text-orange-700' },
    { title: 'Party Planning', emoji: '🎉', color: 'bg-pink-100 text-pink-700' },
    { title: 'Weekend Groceries', emoji: '🛒', color: 'bg-green-100 text-green-700' },
    { title: 'Baking Treats', emoji: '🍰', color: 'bg-purple-100 text-purple-700' },
  ]

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-beige pt-20">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-navy mb-6">
              Shopping Made{' '}
              <span className="bg-gradient-to-r from-teal to-green bg-clip-text text-transparent">
                Smarter
              </span>
            </h1>
            <p className="text-xl text-teal max-w-2xl mx-auto mb-8">
              Your AI-powered shopping assistant for smarter ingredient shopping and meal planning
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/chat"
                  className="inline-block px-8 py-3 bg-gradient-to-r from-teal to-green text-white rounded-lg font-semibold hover:shadow-lg transition"
                >
                  Start Chatting
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/products"
                  className="inline-block px-8 py-3 border-2 border-navy text-navy rounded-lg font-semibold hover:bg-navy hover:text-white transition"
                >
                  Browse Products
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Scenarios */}
          <div className="mb-20">
            <h2 className="text-2xl font-bold text-navy text-center mb-8">What are you planning?</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {scenarios.map((scenario, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`py-6 rounded-lg font-semibold text-lg ${scenario.color} transition hover:shadow-md`}
                >
                  <div className="text-4xl mb-2">{scenario.emoji}</div>
                  {scenario.title}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Browse Categories */}
          <div className="mb-20">
            <h2 className="text-2xl font-bold text-navy text-center mb-8">Browse Categories</h2>
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-6 justify-center flex-nowrap">
                {mockCategories.map((category) => (
                  <CategoryCard key={category.id} {...category} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-white py-20 border-t border-sky-blue border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-navy text-center mb-12">How It Works</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, idx) => {
                const Icon = feature.icon
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="text-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-sky-blue flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-8 h-8 text-teal" />
                    </div>
                    <h3 className="font-bold text-navy mb-2">{feature.title}</h3>
                    <p className="text-teal text-sm">{feature.description}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-navy to-teal rounded-2xl p-12 text-center text-white"
          >
            <h2 className="text-3xl font-bold mb-4">Ready to Shop Smarter?</h2>
            <p className="text-lg mb-8 opacity-90">Join thousands of users who save time and money with NeedNow</p>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/chat"
                className="inline-block px-8 py-3 bg-green text-white rounded-lg font-semibold hover:bg-opacity-90 transition"
              >
                Get Started Now
              </Link>
            </motion.div>
          </motion.div>
        </section>
      </div>
    </AnimatedPage>
  )
}
