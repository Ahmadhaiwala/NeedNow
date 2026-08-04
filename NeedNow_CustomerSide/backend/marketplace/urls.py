from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    # Profile
    MarketplaceProfileView,
    ProfileLocationView,
    ProfilePostsView,
    # Feed
    FeedView,
    NearbyFeedView,
    CategoryFeedView,
    TypeFeedView,
    SearchFeedView,
    # Posts
    MarketplacePostViewSet,
    # Post Images
    PostImagesView,
    PostImageDetailView,
    PostImageReorderView,
    # Comments
    PostCommentsView,
    CommentDetailView,
    # Offers
    MarketplacePostOffersView,
    UserOffersView,
    OfferDetailView,
    OfferAcceptView,
    OfferRejectView,
    OfferWithdrawView,
    # Chat
    ChatMessageView,
    ChatMessagesListView,
    ChatConversationsView,
    ChatMarkReadView,
    ChatMessageDetailView,
    # Reviews
    MarketplaceReviewView,
    ReviewSummaryView,
    ReviewDetailView,
)

router = DefaultRouter()
router.register(r'posts', MarketplacePostViewSet, basename='posts')

app_name = 'marketplace'

urlpatterns = [
    # Feed endpoints
    path('feed/', FeedView.as_view(), name='feed'),
    path('feed/nearby/', NearbyFeedView.as_view(), name='feed-nearby'),
    path('feed/category/<str:category>/', CategoryFeedView.as_view(), name='feed-category'),
    path('feed/type/<str:post_type>/', TypeFeedView.as_view(), name='feed-type'),
    path('feed/search/', SearchFeedView.as_view(), name='feed-search'),

    # Profile & Location endpoints
    path('profile/', MarketplaceProfileView.as_view(), name='profile'),
    path('profile/location/', ProfileLocationView.as_view(), name='profile-location'),
    path('profile/posts/', ProfilePostsView.as_view(), name='profile-posts'),

    # Post Image endpoints
    path('posts/<int:post_id>/images/', PostImagesView.as_view(), name='post-images'),
    path('posts/<int:post_id>/images/reorder/', PostImageReorderView.as_view(), name='post-images-reorder'),
    path('posts/images/<int:image_id>/', PostImageDetailView.as_view(), name='post-image-detail'),

    # Post Comment endpoints
    path('posts/<int:post_id>/comments/', PostCommentsView.as_view(), name='post-comments'),
    path('comments/<int:pk>/', CommentDetailView.as_view(), name='comment-detail'),

    # Offer endpoints
    path('posts/<int:post_id>/offers/', MarketplacePostOffersView.as_view(), name='post-offers'),
    path('my-offers/', UserOffersView.as_view(), name='my-offers'),
    path('offers/<int:pk>/', OfferDetailView.as_view(), name='offer-detail'),
    path('offers/<int:pk>/accept/', OfferAcceptView.as_view(), name='offer-accept'),
    path('offers/<int:pk>/reject/', OfferRejectView.as_view(), name='offer-reject'),
    path('offers/<int:pk>/withdraw/', OfferWithdrawView.as_view(), name='offer-withdraw'),

    # Chat endpoints
    path('chat/', ChatMessageView.as_view(), name='chat-send'),
    path('chat/conversations/', ChatConversationsView.as_view(), name='chat-conversations'),
    path('chat/mark-read/', ChatMarkReadView.as_view(), name='chat-mark-read'),
    path('chat/messages/<int:pk>/', ChatMessageDetailView.as_view(), name='chat-message-detail'),
    path('chat/<uuid:user_id>/', ChatMessagesListView.as_view(), name='chat-messages'),

    # Review endpoints
    path('reviews/', MarketplaceReviewView.as_view(), name='reviews'),
    path('reviews/summary/', ReviewSummaryView.as_view(), name='reviews-summary'),
    path('reviews/<int:pk>/', ReviewDetailView.as_view(), name='review-detail'),

    # ViewSet router endpoints (e.g. /posts/, /posts/{id}/)
    path('', include(router.urls)),
]
