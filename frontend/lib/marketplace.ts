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

function unwrapResponse<T>(json: any): T {
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    return json.data as T;
  }
  return json as T;
}

export interface MarketplaceUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  display_name?: string;
  avatar?: string;
  rating?: number;
  review_count?: number;
}

export interface MarketplaceProfile {
  id?: number;
  user?: string;
  user_details?: MarketplaceUser;
  bio?: string;
  avatar?: string;
  location_name?: string;
  latitude?: number | null;
  longitude?: number | null;
  seller_type?: 'individual' | 'student' | 'home_business' | 'verified_business';
  rating?: number;
  review_count?: number;
  trust_score?: number;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MarketplacePostImage {
  id: number;
  post: number;
  image: string;
  image_url: string;
  display_order: number;
}

export interface MarketplacePost {
  id: number;
  owner?: string;
  owner_details?: MarketplaceUser;
  post_type: 'sell' | 'need' | 'rent' | 'exchange' | 'donate' | 'service';
  title: string;
  description: string;
  category: string;
  images?: MarketplacePostImage[] | string[];
  location_name: string;
  latitude: number;
  longitude: number;
  visibility_radius?: number;
  urgency?: string;
  budget?: string | number | null;
  condition?: string;
  price?: string | number | null;
  expires_at?: string | null;
  status?: 'active' | 'completed' | 'cancelled' | 'expired';
  offers_count?: number;
  comments_count?: number;
  distance?: number;
  created_at?: string;
  updated_at?: string;
}

export interface MarketplaceOffer {
  id: number;
  post: number;
  post_title?: string;
  post_type?: string;
  post_details?: MarketplacePost;
  user?: string;
  user_details?: MarketplaceUser;
  price: string | number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  created_at?: string;
}

export interface MarketplaceComment {
  id: number;
  post: number;
  user?: string;
  user_details?: MarketplaceUser;
  comment: string;
  created_at?: string;
}

export interface ChatMessage {
  id: number;
  post?: number | null;
  post_details?: MarketplacePost;
  sender?: string;
  sender_details?: MarketplaceUser;
  recipient?: string;
  recipient_details?: MarketplaceUser;
  content: string;
  image?: string;
  image_url?: string | null;
  is_read?: boolean;
  created_at?: string;
}

export interface ConversationSummary {
  other_user_id: string;
  other_user_name: string;
  post_id?: number | null;
  post_title?: string | null;
  latest_message: ChatMessage;
  unread_count: number;
  last_updated: string;
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

export interface ReviewSummary {
  total_reviews: number;
  average_rating: number;
  rating_distribution: Record<number, number>;
  trust_score: number;
  is_verified: boolean;
}

export interface PaginatedResult<T> {
  results: T[];
  count: number;
  total_pages: number;
  current_page: number;
  has_next: boolean;
  has_previous: boolean;
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
  const data = await res.json();
  return unwrapResponse<MarketplaceProfile>(data);
}

export async function createMarketplaceProfile(
  data: Partial<MarketplaceProfile>
): Promise<MarketplaceProfile> {
  return updateMarketplaceProfile(data);
}

export async function updateMarketplaceProfile(
  data: Partial<MarketplaceProfile> | FormData
): Promise<MarketplaceProfile> {
  const authHeaders = await getAuthHeader();
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  const headers: Record<string, string> = { ...authHeaders };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE_URL}/api/marketplace/profile/`, {
    method: 'PATCH',
    headers,
    body: isFormData ? data : JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.detail || 'Failed to update marketplace profile');
  }
  const json = await res.json();
  return unwrapResponse<MarketplaceProfile>(json);
}

export async function updateProfileLocation(
  location_name: string,
  latitude: number,
  longitude: number
): Promise<MarketplaceProfile> {
  const authHeaders = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/api/marketplace/profile/location/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify({ location_name, latitude, longitude }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update location');
  }
  const json = await res.json();
  return unwrapResponse<MarketplaceProfile>(json);
}

export async function getUserPosts(userId?: string, status?: string): Promise<MarketplacePost[]> {
  const authHeaders = await getAuthHeader();
  const query = new URLSearchParams();
  if (userId) query.append('user_id', userId);
  if (status) query.append('status', status);

  const queryString = query.toString() ? `?${query.toString()}` : '';
  const res = await fetch(`${BASE_URL}/api/marketplace/profile/posts/${queryString}`, {
    headers: { ...authHeaders },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return unwrapResponse<MarketplacePost[]>(json) || [];
}

// ── Feed & Posts Endpoints ───────────────────────────────────────────────────

export async function getMarketplaceFeed(
  params?: Record<string, any>
): Promise<PaginatedResult<MarketplacePost>> {
  const authHeaders = await getAuthHeader();
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
  }
  // Append cache-bust timestamp so no stale browser/SW cache is ever served
  query.append('_t', Date.now().toString());
  const queryString = `?${query.toString()}`;
  const res = await fetch(`${BASE_URL}/api/marketplace/feed/${queryString}`, {
    headers: { ...authHeaders },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Failed to fetch marketplace feed');
  }
  const json = await res.json();
  const unwrapped = unwrapResponse<any>(json);
  if (Array.isArray(unwrapped)) {
    return { results: unwrapped, count: unwrapped.length, total_pages: 1, current_page: 1, has_next: false, has_previous: false };
  }
  return unwrapped;
}


export async function getMarketplacePosts(
  params?: Record<string, any>
): Promise<MarketplacePost[]> {
  const feed = await getMarketplaceFeed(params);
  return feed.results || [];
}

export async function getNearbyPosts(
  latitude: number,
  longitude: number,
  radius: number = 10,
  category?: string,
  post_type?: string
): Promise<MarketplacePost[]> {
  const authHeaders = await getAuthHeader();
  const query = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    radius: String(radius),
  });
  if (category && category !== 'All') query.append('category', category);
  if (post_type) query.append('post_type', post_type);

  const res = await fetch(`${BASE_URL}/api/marketplace/feed/nearby/?${query.toString()}`, {
    headers: { ...authHeaders },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return unwrapResponse<MarketplacePost[]>(json) || [];
}

export async function getMarketplacePost(id: number): Promise<MarketplacePost> {
  const authHeaders = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/api/marketplace/posts/${id}/`, {
    headers: { ...authHeaders },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch post details');
  }
  const json = await res.json();
  return unwrapResponse<MarketplacePost>(json);
}

export async function createMarketplacePost(
  data: Partial<MarketplacePost> | FormData
): Promise<MarketplacePost> {
  const authHeaders = await getAuthHeader();
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  const headers: Record<string, string> = { ...authHeaders };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE_URL}/api/marketplace/posts/`, {
    method: 'POST',
    headers,
    body: isFormData ? data : JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.detail || 'Failed to create marketplace post');
  }
  const json = await res.json();
  return unwrapResponse<MarketplacePost>(json);
}

export async function updateMarketplacePost(
  id: number,
  data: Partial<MarketplacePost> | FormData
): Promise<MarketplacePost> {
  const authHeaders = await getAuthHeader();
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  const headers: Record<string, string> = { ...authHeaders };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE_URL}/api/marketplace/posts/${id}/`, {
    method: 'PATCH',
    headers,
    body: isFormData ? data : JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.detail || 'Failed to update post');
  }
  const json = await res.json();
  return unwrapResponse<MarketplacePost>(json);
}

export async function deleteMarketplacePost(id: number): Promise<boolean> {
  const authHeaders = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/api/marketplace/posts/${id}/`, {
    method: 'DELETE',
    headers: { ...authHeaders },
  });
  return res.ok;
}

export async function markPostCompleted(id: number): Promise<MarketplacePost> {
  const authHeaders = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/api/marketplace/posts/${id}/archive/`, {
    method: 'POST',
    headers: { ...authHeaders },
  });
  if (!res.ok) throw new Error('Failed to archive post');
  const json = await res.json();
  return unwrapResponse<MarketplacePost>(json);
}

export async function archiveMarketplacePost(id: number): Promise<MarketplacePost> {
  return markPostCompleted(id);
}

// ── Images Endpoints ────────────────────────────────────────────────────────

export async function uploadPostImages(postId: number, files: File[]): Promise<MarketplacePostImage[]> {
  const authHeaders = await getAuthHeader();
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));

  const res = await fetch(`${BASE_URL}/api/marketplace/posts/${postId}/images/`, {
    method: 'POST',
    headers: { ...authHeaders },
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload images');
  const json = await res.json();
  return unwrapResponse<MarketplacePostImage[]>(json);
}

export async function deletePostImage(imageId: number): Promise<boolean> {
  const authHeaders = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/api/marketplace/posts/images/${imageId}/`, {
    method: 'DELETE',
    headers: { ...authHeaders },
  });
  return res.ok;
}

// ── Offers Endpoints ─────────────────────────────────────────────────────────

export async function getPostOffers(postId: number): Promise<MarketplaceOffer[]> {
  const authHeaders = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/api/marketplace/posts/${postId}/offers/`, {
    headers: { ...authHeaders },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return unwrapResponse<MarketplaceOffer[]>(json) || [];
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
    throw new Error(errorData.message || errorData.detail || 'Failed to submit offer');
  }
  const json = await res.json();
  return unwrapResponse<MarketplaceOffer>(json);
}

export async function updateOfferStatus(
  offerId: number,
  status: 'accepted' | 'rejected'
): Promise<MarketplaceOffer> {
  if (status === 'accepted') return acceptOffer(offerId);
  return rejectOffer(offerId);
}

export async function getMyOffers(): Promise<MarketplaceOffer[]> {
  const authHeaders = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/api/marketplace/my-offers/`, {
    headers: { ...authHeaders },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return unwrapResponse<MarketplaceOffer[]>(json) || [];
}

export async function acceptOffer(offerId: number): Promise<MarketplaceOffer> {
  const authHeaders = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/api/marketplace/offers/${offerId}/accept/`, {
    method: 'POST',
    headers: { ...authHeaders },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to accept offer');
  }
  const json = await res.json();
  return unwrapResponse<MarketplaceOffer>(json);
}

export async function rejectOffer(offerId: number): Promise<MarketplaceOffer> {
  const authHeaders = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/api/marketplace/offers/${offerId}/reject/`, {
    method: 'POST',
    headers: { ...authHeaders },
  });
  if (!res.ok) throw new Error('Failed to reject offer');
  const json = await res.json();
  return unwrapResponse<MarketplaceOffer>(json);
}

export async function withdrawOffer(offerId: number): Promise<MarketplaceOffer> {
  const authHeaders = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/api/marketplace/offers/${offerId}/withdraw/`, {
    method: 'POST',
    headers: { ...authHeaders },
  });
  if (!res.ok) throw new Error('Failed to withdraw offer');
  const json = await res.json();
  return unwrapResponse<MarketplaceOffer>(json);
}

// ── Comments Endpoints ───────────────────────────────────────────────────────

export async function getPostComments(postId: number): Promise<MarketplaceComment[]> {
  const authHeaders = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/api/marketplace/posts/${postId}/comments/`, {
    headers: { ...authHeaders },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return unwrapResponse<MarketplaceComment[]>(json) || [];
}

export async function createPostComment(postId: number, comment: string): Promise<MarketplaceComment> {
  const authHeaders = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/api/marketplace/posts/${postId}/comments/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify({ comment }),
  });
  if (!res.ok) throw new Error('Failed to post comment');
  const json = await res.json();
  return unwrapResponse<MarketplaceComment>(json);
}

export async function deletePostComment(commentId: number): Promise<boolean> {
  const authHeaders = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/api/marketplace/comments/${commentId}/`, {
    method: 'DELETE',
    headers: { ...authHeaders },
  });
  return res.ok;
}

// ── Chat Endpoints ───────────────────────────────────────────────────────────

export async function getChatHistory(otherUserId: string, postId?: number): Promise<ChatMessage[]> {
  const authHeaders = await getAuthHeader();
  const queryString = postId ? `?post_id=${postId}` : '';
  const res = await fetch(`${BASE_URL}/api/marketplace/chat/${otherUserId}/${queryString}`, {
    headers: { ...authHeaders },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return unwrapResponse<ChatMessage[]>(json) || [];
}

export async function sendChatMessage(
  recipientId: string,
  contentOrOptions: string | { content: string; post?: number; image_url?: string },
  postId?: number,
  imageFile?: File
): Promise<ChatMessage> {
  const authHeaders = await getAuthHeader();
  const formData = new FormData();
  formData.append('recipient', recipientId);

  if (typeof contentOrOptions === 'string') {
    if (contentOrOptions) formData.append('content', contentOrOptions);
    if (postId) formData.append('post', String(postId));
    if (imageFile) formData.append('image', imageFile);
  } else {
    if (contentOrOptions.content) formData.append('content', contentOrOptions.content);
    if (contentOrOptions.post) formData.append('post', String(contentOrOptions.post));
    if (imageFile) formData.append('image', imageFile);
  }

  const res = await fetch(`${BASE_URL}/api/marketplace/chat/`, {
    method: 'POST',
    headers: { ...authHeaders },
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to send message');
  }
  const json = await res.json();
  return unwrapResponse<ChatMessage>(json);
}

export async function getChatConversations(): Promise<ConversationSummary[]> {
  const authHeaders = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/api/marketplace/chat/conversations/`, {
    headers: { ...authHeaders },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return unwrapResponse<ConversationSummary[]>(json) || [];
}

// ── Reviews Endpoints ────────────────────────────────────────────────────────

export async function getReviews(
  param?: string | { user_id?: string; post_id?: number; my_reviews?: boolean; by_reviewer?: boolean }
): Promise<MarketplaceReview[]> {
  const authHeaders = await getAuthHeader();
  const query = new URLSearchParams();

  if (typeof param === 'string') {
    if (param) query.append('user_id', param);
  } else if (param && typeof param === 'object') {
    if (param.user_id) query.append('user_id', param.user_id);
    if (param.post_id) query.append('post_id', String(param.post_id));
    if (param.my_reviews) query.append('my_reviews', 'true');
    if (param.by_reviewer) query.append('by_reviewer', 'true');
  }

  const queryString = query.toString() ? `?${query.toString()}` : '';
  const res = await fetch(`${BASE_URL}/api/marketplace/reviews/${queryString}`, {
    headers: { ...authHeaders },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return unwrapResponse<MarketplaceReview[]>(json) || [];
}

export async function getReviewSummary(userId?: string): Promise<ReviewSummary> {
  const authHeaders = await getAuthHeader();
  const queryString = userId ? `?user_id=${userId}` : '';
  const res = await fetch(`${BASE_URL}/api/marketplace/reviews/summary/${queryString}`, {
    headers: { ...authHeaders },
  });
  if (!res.ok) throw new Error('Failed to fetch review summary');
  const json = await res.json();
  return unwrapResponse<ReviewSummary>(json);
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
    throw new Error(errorData.message || errorData.detail || 'Failed to submit review');
  }
  const json = await res.json();
  return unwrapResponse<MarketplaceReview>(json);
}
