'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FlyingItem {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  imageUrl: string;
}

interface FlyToCartContextValue {
  triggerFlyAnimation: (event: React.MouseEvent | HTMLElement | null, imageUrl?: string) => void;
  cartPulse: boolean;
}

const FlyToCartContext = createContext<FlyToCartContextValue | null>(null);

export function FlyToCartProvider({ children }: { children: React.ReactNode }) {
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const [cartPulse, setCartPulse] = useState(false);

  const triggerFlyAnimation = useCallback((event: React.MouseEvent | HTMLElement | null, imageUrl = '') => {
    let startX = window.innerWidth / 2;
    let startY = window.innerHeight / 2;

    if (event && 'clientX' in event && typeof event.clientX === 'number' && event.clientX > 0) {
      startX = event.clientX - 25;
      startY = event.clientY - 25;
    } else if (event && event instanceof HTMLElement) {
      const rect = event.getBoundingClientRect();
      startX = rect.left + rect.width / 2 - 25;
      startY = rect.top + rect.height / 2 - 25;
    }

    // Locate the navbar cart icon element
    const cartEl = document.getElementById('nav-cart-icon');
    let endX = window.innerWidth - 120;
    let endY = 30;

    if (cartEl) {
      const rect = cartEl.getBoundingClientRect();
      endX = rect.left + rect.width / 2 - 25;
      endY = rect.top + rect.height / 2 - 25;
    }

    const id = `${Date.now()}-${Math.random()}`;

    setFlyingItems((prev) => [...prev, { id, startX, startY, endX, endY, imageUrl }]);

    // Trigger cart pulse after flight completes (~550ms)
    setTimeout(() => {
      setCartPulse(true);
      setTimeout(() => setCartPulse(false), 300);
      setFlyingItems((prev) => prev.filter((item) => item.id !== id));
    }, 550);
  }, []);

  return (
    <FlyToCartContext.Provider value={{ triggerFlyAnimation, cartPulse }}>
      {children}
      {/* Overlay container for flying thumbnail clones */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 99999, overflow: 'hidden' }}>
        <AnimatePresence>
          {flyingItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{
                x: item.startX,
                y: item.startY,
                scale: 1,
                opacity: 1,
              }}
              animate={{
                x: [item.startX, (item.startX + item.endX) / 2 - 40, item.endX],
                y: [item.startY, Math.min(item.startY, item.endY) - 70, item.endY],
                scale: [1, 0.75, 0.25],
                opacity: [1, 0.9, 0.2],
              }}
              transition={{
                duration: 0.55,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{
                position: 'fixed',
                left: 0,
                top: 0,
                width: 50,
                height: 50,
                borderRadius: '50%',
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                border: '2px solid var(--color-juice)',
                background: '#FFFFFF',
              }}
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'var(--color-juice)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1F3635', fontWeight: 700 }}>
                  🛒
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </FlyToCartContext.Provider>
  );
}

export function useFlyToCart() {
  const ctx = useContext(FlyToCartContext);
  if (!ctx) {
    return {
      triggerFlyAnimation: () => {},
      cartPulse: false,
    };
  }
  return ctx;
}
