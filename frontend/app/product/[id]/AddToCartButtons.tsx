'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/lib/auth';
import { useInteractionTracker } from '@/hooks/useInteractionTracker';

interface AddToCartButtonsProps {
  productId: string;
  price: number | null;
}

export default function AddToCartButtons({ productId, price }: AddToCartButtonsProps) {
  const { addItem, state } = useCart();
  const { user } = useAuth();
  const { track } = useInteractionTracker();
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'adding' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddToCart = async () => {
    if (!user) {
      router.push('/');
      return;
    }
    setStatus('adding');
    setErrorMsg('');
    try {
      await addItem(productId, 1);
      // Track cart event — will be flushed in the next 30-second batch
      track({
        interaction_type: 'cart',
        product_id: productId,
        value: 3.0,
        metadata: { price },
      });
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to add to cart';
      setErrorMsg(msg);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      router.push('/');
      return;
    }
    await handleAddToCart();
    // Track purchase intent — buy now is a strong signal
    track({
      interaction_type: 'purchase',
      product_id: productId,
      value: 5.0,
      metadata: { price, source: 'buy_now_button' },
    });
    router.push('/cart');
  };

  const isLoading = status === 'adding' || state.loading;

  return (
    <div className="space-y-3">
      {/* Add to Cart */}
      <button
        id="add-to-cart-btn"
        onClick={handleAddToCart}
        disabled={isLoading}
        className="w-full py-4 flex justify-center items-center gap-2 font-semibold transition-all hover:opacity-90 hover:scale-[1.02] disabled:opacity-60 disabled:scale-100"
        style={{
          background: status === 'success' ? 'var(--color-jade)' : 'var(--accent-primary)',
          color: 'var(--color-core)',
          borderRadius: 'var(--radius-full)',
        }}
      >
        {status === 'adding' ? (
          <><Loader2 size={18} className="animate-spin" /> Adding...</>
        ) : status === 'success' ? (
          <><CheckCircle size={18} /> Added to Cart!</>
        ) : (
          <><ShoppingCart size={18} /> Add to Cart</>
        )}
      </button>

      {/* Buy Now */}
      <button
        id="buy-now-btn"
        onClick={handleBuyNow}
        disabled={isLoading}
        className="w-full py-4 font-semibold transition-all hover:opacity-90 hover:scale-[1.02] disabled:opacity-60"
        style={{
          background: 'var(--color-jade)',
          color: 'white',
          borderRadius: 'var(--radius-full)',
        }}
      >
        Buy Now
      </button>

      {/* Error feedback */}
      {status === 'error' && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
          style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
          <AlertCircle size={14} />
          {errorMsg || 'Something went wrong. Please try again.'}
        </div>
      )}

      {/* Not logged in hint */}
      {!user && (
        <p className="text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
          Please sign in to add items to your cart
        </p>
      )}
    </div>
  );
}
