'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { UserButton, useUser } from '@clerk/nextjs'

export function Navbar() {
  const { cartItems } = useCart()
  const { isSignedIn } = useUser()
  const cartCount = cartItems.length

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-sky-blue shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-teal to-green rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">N</span>
            </div>
            <span className="text-xl font-bold text-navy hidden sm:inline">NeedNow</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/chat" className="text-navy hover:text-teal font-medium transition">
              Chat
            </Link>
            <Link href="/products" className="text-navy hover:text-teal font-medium transition">
              Products
            </Link>
            <Link href="/pantry" className="text-navy hover:text-teal font-medium transition">
              Pantry
            </Link>
            <Link href="/cart" className="text-navy hover:text-teal font-medium transition">
              Cart
            </Link>
            <Link href="/groups" className="text-navy hover:text-teal font-medium transition">
              Groups
            </Link>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {isSignedIn && (
              <>
                {/* Cart Icon */}
                <Link href="/cart" className="relative p-2 hover:bg-sky-blue rounded-lg transition">
                  <ShoppingCart className="w-6 h-6 text-navy" />
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 bg-green text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                      {cartCount}
                    </span>
                  )}
                </Link>

                {/* User Button */}
                <div className="p-2 hover:bg-sky-blue rounded-lg transition">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: 'w-6 h-6',
                      },
                    }}
                  />
                </div>
              </>
            )}

            {!isSignedIn && (
              <>
                <Link
                  href="/sign-in"
                  className="px-4 py-2 text-navy font-medium hover:text-teal transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="px-4 py-2 bg-green text-white rounded-lg font-medium hover:bg-opacity-90 transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
