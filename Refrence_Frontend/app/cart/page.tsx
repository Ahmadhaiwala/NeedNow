'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AnimatedPage } from '@/components/AnimatedPage'
import { CartItemCard } from '@/components/CartItemCard'
import { useCart } from '@/lib/cart-context'
import { ArrowRight, CheckCircle } from 'lucide-react'

export default function CartPage() {
  const { cartItems, getCartTotal } = useCart()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  const handleCheckout = () => {
    setIsCheckingOut(true)
    setTimeout(() => {
      setIsCheckingOut(false)
      setPaymentSuccess(true)
      setTimeout(() => {
        setPaymentSuccess(false)
      }, 3000)
    }, 2000)
  }

  const categories = ['Essential', 'Optional', 'Luxury'] as const
  const total = getCartTotal()
  const shippingCharge = 49
  const tax = Math.round(total * 0.05)
  const finalTotal = total + shippingCharge + tax

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-beige pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-navy mb-8">Cart Review</h1>

          {paymentSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green text-white rounded-lg flex items-center gap-2"
            >
              <CheckCircle className="w-6 h-6" />
              <span className="font-semibold">Payment successful! Your order has been placed.</span>
            </motion.div>
          )}

          {cartItems.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg">
              <p className="text-teal text-lg">Your cart is empty</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Items */}
              <div className="lg:col-span-2">
                {categories.map((category) => {
                  const items = cartItems.filter((item) => item.category === category)
                  if (items.length === 0) return null

                  return (
                    <div key={category} className="mb-8">
                      <h2 className="text-xl font-bold text-navy mb-4 capitalize">{category}</h2>

                      <div className="space-y-3">
                        {items.map((item) => (
                          <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <CartItemCard item={item} />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-lg border border-sky-blue p-6 sticky top-24 space-y-4"
                >
                  <h3 className="text-lg font-bold text-navy">Order Summary</h3>

                  <div className="space-y-2 border-b border-sky-blue pb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-teal">Subtotal</span>
                      <span className="text-navy font-semibold">₹{total}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-teal">Shipping</span>
                      <span className="text-navy font-semibold">₹{shippingCharge}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-teal">Tax (5%)</span>
                      <span className="text-navy font-semibold">₹{tax}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-bold text-navy">Total</span>
                    <span className="text-2xl font-bold text-green">₹{finalTotal}</span>
                  </div>

                  <motion.button
                    whileHover={{ scale: isCheckingOut ? 1 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className="w-full bg-green text-white py-3 rounded-lg font-semibold hover:bg-opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isCheckingOut ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                        Processing...
                      </>
                    ) : (
                      <>
                        Proceed to Checkout
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>

                  <p className="text-xs text-teal text-center">
                    By placing this order, you agree to our terms and conditions
                  </p>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AnimatedPage>
  )
}
