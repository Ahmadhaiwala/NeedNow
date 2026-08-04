from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q, F
from django.core.cache import caches
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from users.auth_utils import get_user_from_neon_auth
from .models import AssetCollection, AssetLocation, Asset, AssetTransaction
from .serializers import (
    AssetCollectionSerializer, AssetLocationSerializer, AssetLocationTreeSerializer,
    AssetSerializer, AssetSummarySerializer, AssetTransactionSerializer,
    ConsumeAssetSerializer, RestockAssetSerializer, AdjustAssetSerializer,
    MoveAssetSerializer, BulkConsumeSerializer, DashboardSerializer,
    ShoppingRecommendationSerializer
)
from .services import AssetService


class CacheInvalidator:
    """Utility class for consistent cache invalidation patterns"""
    
    @staticmethod
    def invalidate_collection_caches(user_id, collection_id):
        """Invalidate all caches related to a collection"""
        collections_key = f"collections_{user_id}"
        dashboard_key = f"dashboard_{user_id}_{collection_id}"
        
        caches['assets'].delete(collections_key)
        caches['dashboard'].delete(dashboard_key)
        
        # Clear asset list caches with wildcard pattern
        cache = caches['assets']
        if hasattr(cache, '_cache'):
            keys_to_delete = [key for key in cache._cache.keys() 
                            if key.startswith(f"assets_{user_id}_")]
            for key in keys_to_delete:
                cache.delete(key)
    
    @staticmethod
    def invalidate_asset_caches(user_id, collection_id):
        """Invalidate caches when assets are modified"""
        CacheInvalidator.invalidate_collection_caches(user_id, collection_id)
        
        # Also invalidate recommendations cache
        rec_key = f"recommendations_{collection_id}"
        caches['assets'].delete(rec_key)


class AssetCollectionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing asset collections"""
    serializer_class = AssetCollectionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter collections by current user"""
        user = get_user_from_neon_auth(self.request)
        if not user:
            return AssetCollection.objects.none()
        return AssetCollection.objects.filter(owner=user)
    
    def list(self, request, *args, **kwargs):
        """Cached list of collections"""
        user = get_user_from_neon_auth(request)
        if not user:
            return Response([], status=status.HTTP_200_OK)
        
        cache_key = f"collections_{user.id}"
        cached_data = caches['assets'].get(cache_key)
        
        if cached_data:
            return Response(cached_data)
        
        response = super().list(request, *args, **kwargs)
        if response.status_code == 200:
            caches['assets'].set(cache_key, response.data, timeout=600)  # 10 minutes
        
        return response
    
    def perform_create(self, serializer):
        """Set owner to current user and invalidate cache"""
        user = get_user_from_neon_auth(self.request)
        collection = serializer.save(owner=user)
        
        # Invalidate collections cache
        CacheInvalidator.invalidate_collection_caches(user.id, collection.id)
    
    def perform_update(self, serializer):
        """Update and invalidate cache"""
        user = get_user_from_neon_auth(self.request)
        collection_id = serializer.instance.id
        super().perform_update(serializer)
        
        # Invalidate related caches
        CacheInvalidator.invalidate_collection_caches(user.id, collection_id)
    
    def perform_destroy(self, instance):
        """Delete and invalidate cache"""
        user = get_user_from_neon_auth(self.request)
        collection_id = instance.id
        
        # Clean up all related caches
        CacheInvalidator.invalidate_collection_caches(user.id, collection_id)
        
        super().perform_destroy(instance)
    
    @action(detail=True, methods=['post'])
    def add_default_locations(self, request, pk=None):
        """Add common default locations to a collection"""
        collection = self.get_object()
        
        # Check if locations already exist
        if collection.locations.exists():
            return Response(
                {'error': 'Collection already has locations.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create collection with default locations
        AssetService.create_collection_with_default_locations(
            owner=collection.owner,
            name=collection.name,
            description=collection.description
        )
        
        # Delete the old collection and use the new one
        collection.delete()
        new_collection = AssetCollection.objects.get(
            owner=request.user,
            name=collection.name
        )
        
        serializer = self.get_serializer(new_collection)
        return Response(serializer.data)


class AssetLocationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing asset locations"""
    serializer_class = AssetLocationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter locations by user's collections"""
        user = get_user_from_neon_auth(self.request)
        if not user:
            return AssetLocation.objects.none()
        
        collection_id = self.request.query_params.get('collection')
        queryset = AssetLocation.objects.filter(collection__owner=user)
        
        if collection_id:
            queryset = queryset.filter(collection_id=collection_id)
        
        return queryset.order_by('name')
    
    @action(detail=False, methods=['get'])
    def tree(self, request):
        """Get locations in hierarchical tree structure"""
        collection_id = request.query_params.get('collection')
        if not collection_id:
            return Response(
                {'error': 'collection parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = get_user_from_neon_auth(request)
        try:
            collection = AssetCollection.objects.get(id=collection_id, owner=user)
        except AssetCollection.DoesNotExist:
            return Response(
                {'error': 'Collection not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get root locations (no parent)
        root_locations = collection.locations.filter(parent__isnull=True)
        serializer = AssetLocationTreeSerializer(root_locations, many=True)
        
        return Response(serializer.data)


class AssetViewSet(viewsets.ModelViewSet):
    """ViewSet for managing assets with custom actions"""
    serializer_class = AssetSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter assets by user's collections"""
        user = get_user_from_neon_auth(self.request)
        if not user:
            return Asset.objects.none()
        
        queryset = Asset.objects.filter(collection__owner=user).select_related(
            'product', 'location', 'collection'
        )
        
        # Apply filters
        collection_id = self.request.query_params.get('collection')
        location_id = self.request.query_params.get('location')
        search = self.request.query_params.get('search')
        low_stock = self.request.query_params.get('low_stock')
        expired = self.request.query_params.get('expired')
        expiring_soon = self.request.query_params.get('expiring_soon')
        
        if collection_id:
            queryset = queryset.filter(collection_id=collection_id)
        
        if location_id:
            location = get_object_or_404(AssetLocation, id=location_id)
            # Include assets in child locations
            location_ids = [location.id] + [desc.id for desc in location.get_descendants()]
            queryset = queryset.filter(location_id__in=location_ids)
        
        if search:
            queryset = queryset.filter(
                Q(product__name__icontains=search) |
                Q(product__brand__icontains=search) |
                Q(location__name__icontains=search) |
                Q(notes__icontains=search)
            )
        
        if low_stock == 'true':
            queryset = queryset.filter(quantity__lte=F('low_stock_threshold'))
        
        if expired == 'true':
            from django.utils import timezone
            queryset = queryset.filter(expiry_date__lt=timezone.now().date())
        
        if expiring_soon == 'true':
            from django.utils import timezone
            from datetime import timedelta
            queryset = queryset.filter(
                expiry_date__gte=timezone.now().date(),
                expiry_date__lte=timezone.now().date() + timedelta(days=7)
            )
        
        return queryset.order_by('-updated_at')
    
    def get_serializer_class(self):
        """Use appropriate serializer based on action"""
        if self.action == 'list':
            return AssetSummarySerializer
        return AssetSerializer
    
    def list(self, request, *args, **kwargs):
        """Cached list of assets with smart cache keys"""
        user = get_user_from_neon_auth(request)
        if not user:
            return Response([], status=status.HTTP_200_OK)
        
        # Build cache key from query params
        query_params = dict(request.GET)
        cache_suffix = '_'.join([f"{k}:{v[0]}" for k, v in sorted(query_params.items()) if v])
        cache_key = f"assets_{user.id}_{cache_suffix}" if cache_suffix else f"assets_{user.id}"
        
        cached_data = caches['assets'].get(cache_key)
        if cached_data:
            return Response(cached_data)
        
        response = super().list(request, *args, **kwargs)
        if response.status_code == 200:
            # Cache for shorter time if filtered results
            timeout = 180 if cache_suffix else 300  # 3 min filtered, 5 min all
            caches['assets'].set(cache_key, response.data, timeout=timeout)
        
        return response
    
    def perform_create(self, serializer):
        """Create asset and invalidate caches"""
        asset = serializer.save()
        user = get_user_from_neon_auth(self.request)
        
        # Invalidate related caches
        CacheInvalidator.invalidate_asset_caches(user.id, asset.collection.id)
    
    def perform_update(self, serializer):
        """Update asset and invalidate caches"""
        asset = serializer.save()
        user = get_user_from_neon_auth(self.request)
        
        # Invalidate related caches
        CacheInvalidator.invalidate_asset_caches(user.id, asset.collection.id)
    
    def perform_destroy(self, instance):
        """Delete asset and invalidate caches"""
        user = get_user_from_neon_auth(self.request)
        collection_id = instance.collection.id
        
        # Invalidate related caches
        CacheInvalidator.invalidate_asset_caches(user.id, collection_id)
        
        super().perform_destroy(instance)
    
    @action(detail=True, methods=['post'])
    def consume(self, request, pk=None):
        """Consume a quantity of this asset"""
        asset = self.get_object()
        serializer = ConsumeAssetSerializer(
            data=request.data,
            context={'asset': asset}
        )
        
        if serializer.is_valid():
            try:
                asset.consume(
                    quantity=serializer.validated_data['quantity'],
                    note=serializer.validated_data.get('note', ''),
                    source='manual'
                )
                
                # Invalidate related caches
                user = get_user_from_neon_auth(request)
                CacheInvalidator.invalidate_asset_caches(user.id, asset.collection.id)
                
                return Response({
                    'success': True,
                    'message': f"Consumed {serializer.validated_data['quantity']} of {asset.product.name}",
                    'new_quantity': asset.quantity,
                    'is_low_stock': asset.is_low_stock
                })
            
            except ValueError as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def restock(self, request, pk=None):
        """Add quantity to this asset"""
        asset = self.get_object()
        serializer = RestockAssetSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                asset.restock(
                    quantity=serializer.validated_data['quantity'],
                    note=serializer.validated_data.get('note', ''),
                    source='manual'
                )
                
                # Invalidate related caches
                user = get_user_from_neon_auth(request)
                CacheInvalidator.invalidate_asset_caches(user.id, asset.collection.id)
                
                return Response({
                    'success': True,
                    'message': f"Added {serializer.validated_data['quantity']} to {asset.product.name}",
                    'new_quantity': asset.quantity
                })
            
            except ValueError as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def adjust(self, request, pk=None):
        """Adjust asset quantity to a specific amount"""
        asset = self.get_object()
        serializer = AdjustAssetSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                asset.adjust(
                    new_quantity=serializer.validated_data['quantity'],
                    note=serializer.validated_data.get('note', ''),
                    source='manual'
                )
                
                # Invalidate related caches
                user = get_user_from_neon_auth(request)
                CacheInvalidator.invalidate_asset_caches(user.id, asset.collection.id)
                
                return Response({
                    'success': True,
                    'message': f"Adjusted {asset.product.name} quantity to {asset.quantity}",
                    'new_quantity': asset.quantity,
                    'is_low_stock': asset.is_low_stock
                })
            
            except ValueError as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def move(self, request, pk=None):
        """Move asset to a new location"""
        asset = self.get_object()
        serializer = MoveAssetSerializer(
            data=request.data,
            context={'asset': asset}
        )
        
        if serializer.is_valid():
            try:
                new_location = serializer.validated_data['location']
                old_location = asset.location
                
                asset.move(
                    new_location=new_location,
                    note=serializer.validated_data.get('note', ''),
                    source='manual'
                )
                
                # Invalidate related caches
                user = get_user_from_neon_auth(request)
                CacheInvalidator.invalidate_asset_caches(user.id, asset.collection.id)
                
                return Response({
                    'success': True,
                    'message': f"Moved {asset.product.name} from {old_location.name} to {new_location.name}",
                    'new_location': new_location.full_path
                })
            
            except ValueError as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def bulk_consume(self, request):
        """Bulk consume multiple assets"""
        user = get_user_from_neon_auth(request)
        collection_id = request.data.get('collection_id')
        
        if not collection_id:
            return Response(
                {'error': 'collection_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            collection = AssetCollection.objects.get(id=collection_id, owner=user)
        except AssetCollection.DoesNotExist:
            return Response(
                {'error': 'Collection not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = BulkConsumeSerializer(
            data=request.data,
            context={'collection': collection}
        )
        
        if serializer.is_valid():
            results = AssetService.bulk_consume(
                collection=collection,
                consumption_data=serializer.validated_data['items']
            )
            
            return Response({
                'success': True,
                'results': results
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AssetTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing asset transactions"""
    serializer_class = AssetTransactionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter transactions by user's assets"""
        user = get_user_from_neon_auth(self.request)
        if not user:
            return AssetTransaction.objects.none()
        
        queryset = AssetTransaction.objects.filter(
            asset__collection__owner=user
        ).select_related('asset__product', 'asset__location')
        
        # Apply filters
        asset_id = self.request.query_params.get('asset')
        collection_id = self.request.query_params.get('collection')
        transaction_type = self.request.query_params.get('type')
        
        if asset_id:
            queryset = queryset.filter(asset_id=asset_id)
        
        if collection_id:
            queryset = queryset.filter(asset__collection_id=collection_id)
        
        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)
        
        return queryset.order_by('-created_at')


class DashboardView(APIView):
    """Dashboard endpoint with comprehensive collection data"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get dashboard data for a collection with caching"""
        user = get_user_from_neon_auth(request)
        collection_id = request.query_params.get('collection')
        
        if not collection_id:
            return Response(
                {'error': 'collection parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check cache first
        cache_key = f"dashboard_{user.id}_{collection_id}"
        cached_data = caches['dashboard'].get(cache_key)
        
        if cached_data:
            return Response(cached_data)
        
        try:
            collection = AssetCollection.objects.get(id=collection_id, owner=user)
        except AssetCollection.DoesNotExist:
            return Response(
                {'error': 'Collection not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        dashboard_data = AssetService.get_dashboard_data(collection)
        serializer = DashboardSerializer(dashboard_data)
        
        # Cache the result
        caches['dashboard'].set(cache_key, serializer.data, timeout=180)  # 3 minutes
        
        return Response(serializer.data)


class ShoppingRecommendationsView(APIView):
    """Get AI-powered shopping recommendations"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get shopping recommendations for a collection"""
        user = get_user_from_neon_auth(request)
        collection_id = request.query_params.get('collection')
        limit = int(request.query_params.get('limit', 20))
        
        if not collection_id:
            return Response(
                {'error': 'collection parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check cache first
        cache_key = f"recommendations_{user.id}_{collection_id}_{limit}"
        cached_data = caches['assets'].get(cache_key)
        
        if cached_data:
            return Response(cached_data)
        
        try:
            collection = AssetCollection.objects.get(id=collection_id, owner=user)
        except AssetCollection.DoesNotExist:
            return Response(
                {'error': 'Collection not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        recommendations = AssetService.get_shopping_recommendations(collection, limit)
        serializer = ShoppingRecommendationSerializer(recommendations, many=True)
        
        response_data = {
            'collection_id': collection_id,
            'collection_name': collection.name,
            'recommendations': serializer.data,
            'count': len(recommendations)
        }
        
        # Cache the result for longer time (recommendations are expensive to compute)
        caches['assets'].set(cache_key, response_data, timeout=900)  # 15 minutes
        
        return Response(response_data)


class AssetAnalyticsView(APIView):
    """Get analytics data for assets"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get analytics data for a collection"""
        user = get_user_from_neon_auth(request)
        collection_id = request.query_params.get('collection')
        days = int(request.query_params.get('days', 30))
        
        if not collection_id:
            return Response(
                {'error': 'collection parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            collection = AssetCollection.objects.get(id=collection_id, owner=user)
        except AssetCollection.DoesNotExist:
            return Response(
                {'error': 'Collection not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        analytics_data = AssetService.get_asset_analytics(collection, days)
        
        return Response(analytics_data)