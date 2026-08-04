from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AssetCollectionViewSet, AssetLocationViewSet, AssetViewSet, 
    AssetTransactionViewSet, DashboardView, ShoppingRecommendationsView,
    AssetAnalyticsView
)

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'collections', AssetCollectionViewSet, basename='asset-collections')
router.register(r'locations', AssetLocationViewSet, basename='asset-locations')
router.register(r'assets', AssetViewSet, basename='assets')
router.register(r'transactions', AssetTransactionViewSet, basename='asset-transactions')

app_name = 'asset'

urlpatterns = [
    # ViewSet routes
    path('', include(router.urls)),
    
    # Custom endpoints
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('recommendations/', ShoppingRecommendationsView.as_view(), name='shopping-recommendations'),
    path('analytics/', AssetAnalyticsView.as_view(), name='analytics'),
]