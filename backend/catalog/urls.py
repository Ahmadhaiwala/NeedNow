from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router for ViewSets
router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet)
router.register(r'products', views.ProductViewSet)

urlpatterns = [
    # ViewSet URLs
    path('api/', include(router.urls)),
    
    # Legacy API endpoints for backward compatibility
    path('categories/', views.getcategories, name='getcategories'),
    path('product/<uuid:id>/', views.getproduct, name='getsingleproductdetail'),
    path('products/<uuid:id>/', views.getproductforcategory, name='getproductforcategory'),
    
    # Utility endpoints
    path('refresh-counts/', views.refresh_all_category_counts, name='refresh_category_counts'),
    # Search endpoint — records interaction for authenticated users
    path('search/', views.search_products, name='search-products'),
    # Homepage feed — returns section metadata only (no products)
    path('home/', views.home_feed, name='home-feed'),
]

   
