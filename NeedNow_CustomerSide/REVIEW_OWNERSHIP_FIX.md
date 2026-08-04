# Review Ownership Logic Fix

## Problem Summary
The review system was conceptually wrong - it was showing reviews WRITTEN by a user on their profile page, when it should show reviews RECEIVED by that user (their reputation).

## Correct Business Logic

### Reviews Received (Profile Display)
- **What**: Reviews written BY OTHER PEOPLE about this user
- **Where**: User's profile page
- **Purpose**: Shows seller/user reputation
- **Filter**: `reviewee = target_user`

### Reviews Written (Order History)
- **What**: Reviews written BY THIS USER about other people
- **Where**: Order history / purchase history (NOT profile)
- **Purpose**: Track what reviews the user has submitted
- **Filter**: `reviewer = current_user`

## Database Schema (Already Correct)

```python
class MarketplaceReview(models.Model):
    reviewer = ForeignKey(User, related_name="reviews_written")  # Who wrote it
    reviewee = ForeignKey(User, related_name="reviews_received") # Who it's about
    post = ForeignKey(MarketplacePost)
    rating = PositiveIntegerField(1-5)
    comment = TextField()
```

## Changes Made

### 1. Backend (`marketplace/views.py`)
✅ **Already correct** - Default behavior was `as_reviewee=true`
✅ **Enhanced** - Added `post_id` filter support for checking existing reviews
✅ **Added import** - `MarketplaceReview` model for direct queries

```python
# NEW: Support filtering by post_id + reviewer
if post_id:
    reviews = MarketplaceReview.objects.filter(post_id=post_id)
    if not as_reviewee:
        reviews = reviews.filter(reviewer=request.user)
```

### 2. Frontend API (`lib/marketplace.ts`)

#### Fixed `getReviews()` function:
**Before:**
```typescript
// Wrong parameters: my_reviews, by_reviewer
{ my_reviews?: boolean; by_reviewer?: boolean }
```

**After:**
```typescript
// Correct parameters matching backend
{ 
  as_reviewee?: boolean;  // Reviews RECEIVED (profile) - default true
  as_reviewer?: boolean;  // Reviews WRITTEN (history)
}
```

**Default behavior:** Always `as_reviewee=true` (show reviews received)

### 3. UserReviewsModal Component

#### Removed incorrect edit/delete functionality:
- ❌ **Removed**: Edit buttons on profile reviews
- ❌ **Removed**: Delete buttons on profile reviews
- ✅ **Why**: Users cannot edit reviews others wrote about them

#### Fixed data fetching:
**Before:**
```typescript
const data = await getReviews({
  user_id: userId,
  my_reviews: myReviews,  // WRONG
});
```

**After:**
```typescript
const data = await getReviews({
  user_id: userId,
  as_reviewee: true,  // ALWAYS show reviews RECEIVED
});
```

#### Updated modal header:
- **Before**: "My Ratings & Reviews"
- **After**: "My Reputation & Reviews"
- **Subtitle**: "Reviews received from buyers and neighbors"

### 4. ReviewModal Component (Submit/Edit Own Reviews)

#### Fixed existing review check:
**Before:**
```typescript
const reviews = await getReviews({ 
  post_id: postId, 
  by_reviewer: true  // Old parameter
});
```

**After:**
```typescript
const reviews = await getReviews({ 
  post_id: postId, 
  as_reviewer: true  // Correct parameter
});
```

## Expected Behavior After Fix

### ✅ Profile Page Display
1. **My Profile**:
   - Shows average rating from reviews I've RECEIVED
   - Shows reviews written BY OTHERS about me
   - Shows trust score based on received reviews
   - Does NOT show reviews I wrote about others

2. **Other User's Profile**:
   - Shows their reputation (reviews RECEIVED)
   - Shows reviews written by buyers about them

### ✅ Review Submission
1. Buyer purchases from Seller
2. Buyer submits review about Seller
3. Review appears on:
   - ✅ Seller's profile page
   - ✅ Product page
   - ❌ NOT on Buyer's profile

### ✅ Edit Capability
- Users can only edit reviews THEY WROTE
- Editing happens through ReviewModal (when re-reviewing a post)
- Cannot edit reviews others wrote about you

## Validation Checklist

- [x] My profile shows only reviews others left for me
- [x] If I wrote 20 reviews but received 0, my profile shows 0 reviews
- [x] Visiting another seller's profile shows reviews buyers left for that seller
- [x] Writing a review updates the seller's profile, not mine
- [x] Backend defaults to `as_reviewee=true` for profile display
- [x] Frontend correctly sends `as_reviewee` parameter
- [x] Review edit/delete removed from profile pages
- [x] Profile stats (rating, count, trust) calculate from reviews RECEIVED

## Testing Instructions

1. **Create two test accounts**: Buyer and Seller
2. **Post an item** as Seller
3. **Purchase and complete** deal as Buyer
4. **Submit review** as Buyer rating the Seller
5. **Check Seller's profile**: Review should appear
6. **Check Buyer's profile**: Review should NOT appear
7. **Check Seller's stats**: Rating/count should update
8. **Buyer re-opens review modal**: Should see existing review for editing

## Files Modified

### Backend
- `backend/marketplace/views.py` - Added post_id filtering, MarketplaceReview import

### Frontend
- `frontend/lib/marketplace.ts` - Fixed getReviews() parameters
- `frontend/components/UserReviewsModal.tsx` - Removed edit/delete, fixed filtering
- `frontend/components/ReviewModal.tsx` - Fixed existing review check parameter

## Breaking Changes

⚠️ **Frontend API Change**: 
- Old parameters `my_reviews`, `by_reviewer` no longer work
- Use `as_reviewee` (default true) and `as_reviewer` instead

## Migration Notes

- ✅ No database changes required
- ✅ No data migration needed
- ✅ Backend was already mostly correct
- ✅ Frontend cache will auto-refresh on next fetch

## Summary

The core issue was a conceptual misunderstanding of review ownership in the frontend. The backend model and service layer were already correctly structured with `reviewer` and `reviewee` fields. The fix primarily involved:

1. Correcting frontend API parameters to match backend expectations
2. Always defaulting to `as_reviewee=true` for profile displays
3. Removing edit/delete functionality from reviews received
4. Updating UI text to clarify "reputation" vs "reviews written"

Profile pages now correctly show a user's REPUTATION (reviews received), not their review history (reviews written). Review history for purchases should be displayed in a separate order history section if needed.
