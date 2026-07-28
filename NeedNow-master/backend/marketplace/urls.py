from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MarketplaceProfileView, MarketplacePostViewSet, 
    MarketplacePostOffersView, MarketplaceOfferDetailView, 
    ChatMessageListView, MarketplaceReviewCreateView,
    UserOffersView
)

router = DefaultRouter()
router.register(r'posts', MarketplacePostViewSet, basename='posts')

app_name = 'marketplace'

urlpatterns = [
    # Router endpoints (e.g. /posts/, /posts/{id}/)
    path('', include(router.urls)),
    
    # Profile & Offers endpoints
    path('profile/', MarketplaceProfileView.as_view(), name='profile'),
    path('my-offers/', UserOffersView.as_view(), name='my-offers'),
    
    # Offers endpoints
    path('posts/<int:post_id>/offers/', MarketplacePostOffersView.as_view(), name='post-offers'),
    path('offers/<int:pk>/', MarketplaceOfferDetailView.as_view(), name='offer-detail'),
    
    # Chat endpoints (User ID is a UUID in this project)
    path('chat/<uuid:user_id>/', ChatMessageListView.as_view(), name='chat-messages'),
    
    # Reviews endpoints
    path('reviews/', MarketplaceReviewCreateView.as_view(), name='reviews'),
]
