'use client';

/**
 * ProductInteractionTracker
 * -------------------------
 * Client component that auto-fires "view" on mount and "click" on any
 * user interaction with the product page, then relies on the
 * useInteractionTracker hook for batched 30-second flushes.
 */

import { useEffect, useCallback } from 'react';
import { useInteractionTracker } from '@/hooks/useInteractionTracker';

interface Props {
  productId: string;
  productName?: string;
}

export default function ProductInteractionTracker({ productId, productName }: Props) {
  const { track } = useInteractionTracker();

  // Record a "view" event as soon as the component mounts
  useEffect(() => {
    track({
      interaction_type: 'view',
      product_id: productId,
      value: 1.0,
      metadata: { product_name: productName },
    });
  }, [productId, productName, track]);

  // Record a "click" event when the user clicks anywhere on the page
  const handleClick = useCallback(() => {
    track({
      interaction_type: 'click',
      product_id: productId,
      value: 2.0,
      metadata: { product_name: productName },
    });
  }, [productId, productName, track]);

  // Attach a global click listener — rendered as an invisible overlay
  useEffect(() => {
    document.addEventListener('click', handleClick, { once: true });
    return () => document.removeEventListener('click', handleClick);
  }, [handleClick]);

  // This component renders nothing visible
  return null;
}
