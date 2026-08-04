/**
 * useInteractionTracker.ts
 * ------------------------
 * A React hook that:
 *  1. Accepts `track(event)` calls from anywhere in the app.
 *  2. Queues events in an in-memory buffer.
 *  3. Flushes the buffer to the backend every FLUSH_INTERVAL_MS (30 s),
 *     and also on page unload (best-effort sendBeacon).
 *
 * Usage:
 *   const { track } = useInteractionTracker();
 *   track({ interaction_type: 'view', product_id: product.id });
 */

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { flushInteractions, InteractionEvent } from '@/lib/interactions';
import { authClient } from '@/lib/auth';

/** Flush every 30 seconds */
const FLUSH_INTERVAL_MS = 30_000;

export function useInteractionTracker() {
  // Mutable buffer — not state, so adds don't cause re-renders
  const bufferRef = useRef<InteractionEvent[]>([]);

  /** Add an event to the buffer */
  const track = useCallback((event: InteractionEvent) => {
    bufferRef.current.push({
      ...event,
      metadata: {
        ...event.metadata,
        timestamp: new Date().toISOString(),
        path: typeof window !== 'undefined' ? window.location.pathname : undefined,
      },
    });
  }, []);

  /** Drain the buffer and send to the backend */
  const flush = useCallback(async () => {
    const events = bufferRef.current.splice(0); // take all, clear buffer
    if (!events.length) return;
    await flushInteractions(events);
  }, []);

  // ── Periodic flush every 30 s ──────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(flush, FLUSH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [flush]);

  // ── Flush on page unload (sendBeacon fallback) ─────────────────────────────
  useEffect(() => {
    const handleUnload = async () => {
      const events = bufferRef.current.splice(0);
      if (!events.length) return;

      try {
        const sessionData = await authClient.getSession();
        const token = sessionData?.data?.session?.token;
        if (!token) return;

        // sendBeacon is fire-and-forget — browser queues it even during unload
        const payload = JSON.stringify({ events });
        const blob = new Blob([payload], { type: 'application/json' });

        const sent = navigator.sendBeacon(
          'http://localhost:8000/api/recommendations/interactions/',
          blob
        );

        // sendBeacon doesn't support custom headers on all browsers, so fall back
        // to a synchronous XHR if the beacon was rejected (e.g. large payload)
        if (!sent) {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', 'http://localhost:8000/api/recommendations/interactions/', false);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          xhr.send(payload);
        }
      } catch {
        // Best-effort — ignore errors on unload
      }
    };

    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') handleUnload();
    });
    window.addEventListener('pagehide', handleUnload);

    return () => {
      window.removeEventListener('visibilitychange', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, []);

  return { track, flush };
}
