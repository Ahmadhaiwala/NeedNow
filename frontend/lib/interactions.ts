/**
 * interactions.ts
 * ---------------
 * Client-side API utilities for recording user interaction events.
 * The frontend queues events locally and flushes them every 30 seconds
 * via the `useInteractionTracker` hook.
 */

import { authClient } from './auth';

/** Must match backend InteractionType choices */
export type InteractionType =
  | 'view'
  | 'click'
  | 'cart'
  | 'wishlist'
  | 'purchase'
  | 'rating'
  | 'search';

export interface InteractionEvent {
  product_id?: string | null;
  interaction_type: InteractionType;
  /** Signal weight; defaults to 1.0 on the backend */
  value?: number;
  /** Any extra context — search query, rating score, page path, etc. */
  metadata?: Record<string, unknown>;
}

/**
 * Post a batch of interaction events to the backend.
 * Returns false silently if the user isn't authenticated.
 */
export async function flushInteractions(events: InteractionEvent[]): Promise<boolean> {
  if (!events.length) return true;

  try {
    // Grab the JWT token from the current session
    const sessionData = await authClient.getSession();
    const token = sessionData?.data?.session?.token;

    if (!token) {
      // User not logged in — skip silently
      return false;
    }

    const res = await fetch('http://localhost:8000/api/recommendations/interactions/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ events }),
    });

    if (!res.ok) {
      console.warn('[Interactions] Flush failed:', res.status, await res.text());
      return false;
    }

    const data = await res.json();
    if (data.errors?.length) {
      console.warn('[Interactions] Partial errors:', data.errors);
    }
    return true;
  } catch (err) {
    console.warn('[Interactions] Network error during flush:', err);
    return false;
  }
}
