import { authClient } from '@/lib/auth';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const sessionData = await authClient.getSession();
    const token = sessionData?.data?.session?.token;
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  } catch (e) {
    console.error('Failed to retrieve session token:', e);
  }
  return {};
}

export interface MarketplaceUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  display_name?: string;
  image?: string;
  rating?: number;
  review_count?: number;
}

export interface MarketplaceProfile {
  id?: number;
  user?: string;
  user_details?: MarketplaceUser;
  bio?: string;
  location_name?: string;
  latitude?: number | null;
  longitude?: number | null;
  rating?: number;
  review_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface MarketplacePost {
  id: number;
  owner?: string;
  owner_details?: MarketplaceUser;
  post_type: 'need' | 'sell';
  title: string;
  description: string;
  category: string;
  images?: string[];
  location_name: string;
  latitude: number;
  longitude: number;
  radius?: number;
  urgency?: 'today' | 'week' | 'flexible';
  budget?: string | number | null;
  condition?: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  price?: string | number | null;
  status?: 'active' | 'completed' | 'cancelled';
  offers_count?: number;
  distance?: number;
  distance_km?: number;
  created_at?: string;
  updated_at?: string;
}

export interface MarketplaceOffer {
  id: number;
  post: number;
  post_title?: string;
  post_details?: MarketplacePost;
  user?: string;
  user_details?: MarketplaceUser;
  price: string | number;
  message: string;
  images?: string[];
  status: 'pending' | 'accepted' | 'rejected';
  created_at?: string;
  updated_at?: string;
}

export interface ChatMessage {
  id: number;
  post?: number | null;
  sender?: string;
  sender_details?: MarketplaceUser;
  recipient?: string;
  recipient_details?: MarketplaceUser;
  content: string;
  image_url?: string | null;
  is_read?: boolean;
  created_at?: string;
}

export interface MarketplaceReview {
  id: number;
  post: number;
  post_title?: string;
  reviewer?: string;
  reviewer_details?: MarketplaceUser;
  reviewee?: string;
  reviewee_details?: MarketplaceUser;
  rating: number;
  comment?: string;
  created_at?: string;
}

// ── Profile Endpoints ────────────────────────────────────────────────────────

export async function getMarketplaceProfile(): Promise<MarketplaceProfile> {
  const authHeaders = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/api/marketplace/profile/`, {
    headers: { ...authHeaders },
  });
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('PROFILE_NOT_FOUND');
    }
    throw new Error('Failed to fetch marketplace profile');
  }
  return res.json();
}

export async function createMarketplaceProfile(
  data: Partial<MarketplaceProfile>
): Promise<MarketplaceProfile> {
  const authHeaders = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/api/marketplace/profile/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create marketplace profile');
  }
  return res.json();
}

export async function updateMarketplaceProfile(
  data: Partial<MarketplaceProfile>
): Promise<MarketplaceProfile> {
  const authHeaders = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/api/marketplace/profile/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update marketplace profile');
  }
  return res.json();
}

// ── Posts Endpoints ──────────────────────────────────────────────────────────

export async function getMarketplacePosts(
  params?: Record<string, any>
): Promise<MarketplacePost[]> {
  const authHeaders = await getAuthHeader();
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
  }
  const queryString = query.toString() ? `?${query.toString()}` : '';
  const res = await fetch(`${BASE_URL}/api/marketplace/posts/${queryString}`, {
    headers: { ...authHeaders },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch marketplace posts');
  }
  const data = await res.json();
  return Array.isArray(data) ? data : data.results || [];
}

export async function getMarketplacePost(id: number): Promise<MarketplacePost> {
  const authHeaders = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/api/marketplace/posts/${id}/`, {
    headers: { ...authHeaders },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch post details');
  }
  return res.json();
}

export async function createMarketplacePost(
  data: Partial<MarketplacePost>
): Promise<MarketplacePost> {
  const authHeaders = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/api/marketplace/posts/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to create marketplace post');
  }
  return res.json();
}

export async function markPostCompleted(id: number): Promise<MarketplacePost> {
  const authHeaders = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/api/marketplace/posts/${id}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify({ status: 'completed' }),
  });
  if (!res.ok) {
    throw new Error('Failed to update post status');
  }
  return res.json();
}

// ── Offers Endpoints ─────────────────────────────────────────────────────────

export async function getPostOffers(postId: number): Promise<MarketplaceOffer[]> {
  const authHeaders = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/api/marketplace/posts/${postId}/offers/`, {
    headers: { ...authHeaders },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch post offers');
  }
  const data = await res.json();
  return Array.isArray(data) ? data : data.results || [];
}

export async function createPostOffer(
  postId: number,
  data: { price: number; message: string; images?: string[] }
): Promise<MarketplaceOffer> {
  const authHeaders = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/api/marketplace/posts/${postId}/offers/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to submit offer');
  }
  return res.json();
}

export async function updateOfferStatus(
  offerId: number,
  status: 'accepted' | 'rejected'
): Promise<MarketplaceOffer> {
  const authHeaders = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/api/marketplace/offers/${offerId}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    throw new Error('Failed to update offer status');
  }
  return res.json();
}

export async function getMyOffers(): Promise<MarketplaceOffer[]> {
  const authHeaders = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/api/marketplace/my-offers/`, {
    headers: { ...authHeaders },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch user offers');
  }
  const data = await res.json();
  return Array.isArray(data) ? data : data.results || [];
}

// ── Chat Endpoints ───────────────────────────────────────────────────────────

export async function getChatHistory(
  otherUserId: string,
  postId?: number
): Promise<ChatMessage[]> {
  const authHeaders = await getAuthHeader();
  const queryString = postId ? `?post_id=${postId}` : '';
  const res = await fetch(
    `${BASE_URL}/api/marketplace/chat/${otherUserId}/${queryString}`,
    {
      headers: { ...authHeaders },
    }
  );
  if (!res.ok) {
    throw new Error('Failed to fetch chat history');
  }
  const data = await res.json();
  return Array.isArray(data) ? data : data.results || [];
}

export async function sendChatMessage(
  recipientId: string,
  contentOrOptions: string | { content: string; post?: number; image_url?: string },
  postId?: number,
  imageUrl?: string
): Promise<ChatMessage> {
  const authHeaders = await getAuthHeader();
  const payload =
    typeof contentOrOptions === 'string'
      ? { content: contentOrOptions, post: postId || null, image_url: imageUrl || null }
      : {
          content: contentOrOptions.content,
          post: contentOrOptions.post || null,
          image_url: contentOrOptions.image_url || null,
        };

  const res = await fetch(`${BASE_URL}/api/marketplace/chat/${recipientId}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('Failed to send chat message');
  }
  return res.json();
}

// ── Reviews Endpoints ────────────────────────────────────────────────────────

export async function getReviews(
  params?: { user_id?: string; post_id?: number; my_reviews?: boolean; by_reviewer?: boolean }
): Promise<MarketplaceReview[]> {
  const authHeaders = await getAuthHeader();
  const query = new URLSearchParams();
  if (params?.user_id) query.append('user_id', params.user_id);
  if (params?.post_id) query.append('post_id', String(params.post_id));
  if (params?.my_reviews) query.append('my_reviews', 'true');
  if (params?.by_reviewer) query.append('by_reviewer', 'true');

  const queryString = query.toString() ? `?${query.toString()}` : '';
  const res = await fetch(`${BASE_URL}/api/marketplace/reviews/${queryString}`, {
    headers: { ...authHeaders },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch reviews');
  }
  const data = await res.json();
  return Array.isArray(data) ? data : data.results || [];
}

export async function submitReview(data: {
  post: number;
  reviewee: string;
  rating: number;
  comment?: string;
}): Promise<MarketplaceReview> {
  const authHeaders = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/api/marketplace/reviews/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to submit review');
  }
  return res.json();
}
