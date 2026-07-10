from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework import status
from django.db.models import Q
from .models import Category, Product
from .catalogSerializer import CategorySerializer, ProductSerializer, CategoryTreeSerializer


class CategoryViewSet(ReadOnlyModelViewSet):
    """ViewSet for category operations"""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['get'])
    def tree(self, request):
        """Get categories in hierarchical tree structure"""
        root_categories = Category.objects.filter(parent__isnull=True).order_by('name')
        serializer = CategoryTreeSerializer(root_categories, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def refresh_count(self, request, pk=None):
        """Manually refresh product count for a category"""
        category = self.get_object()
        category.update_ancestors_count()
        serializer = self.get_serializer(category)
        return Response({
            'message': f'Product count updated for {category.name}',
            'category': serializer.data
        })


class ProductViewSet(ReadOnlyModelViewSet):
    """ViewSet for product operations"""
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        """Filter products based on query parameters"""
        queryset = Product.objects.all()
        
        category_id = self.request.query_params.get('category', None)
        search = self.request.query_params.get('search', None)
        in_stock = self.request.query_params.get('in_stock', None)
        
        if category_id:
            try:
                category = Category.objects.get(id=category_id)
                # Include products from subcategories
                subcategory_ids = category.subcategories.values_list('id', flat=True)
                all_category_ids = [category.id, *subcategory_ids]
                queryset = queryset.filter(category__in=all_category_ids)
            except Category.DoesNotExist:
                queryset = queryset.none()
        
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(brand__icontains=search) |
                Q(tags__icontains=search)
            )
        
        if in_stock == 'true':
            queryset = queryset.filter(in_stock=True, stock_quantity__gt=0)
        elif in_stock == 'false':
            queryset = queryset.filter(Q(in_stock=False) | Q(stock_quantity=0))
        
        return queryset.order_by('name')


# Legacy API views for backward compatibility
@api_view(['GET'])
@permission_classes([AllowAny])
def getcategories(request):
    """Return only parent categories (no subcategories)."""
    categories = Category.objects.filter(parent__isnull=True).order_by('name')
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def getproduct(request, id):
    """Return a single product by ID."""
    try:
        product = Product.objects.get(id=id)
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=404)
    
    serializer = ProductSerializer(product)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def getproductforcategory(request, id):
    """Return products for a category and all its subcategories."""
    try:
        category = Category.objects.get(id=id)
    except Category.DoesNotExist:
        return Response({"error": "Category not found"}, status=404)

    # Get subcategory IDs
    subcategory_ids = category.subcategories.values_list('id', flat=True)
    all_category_ids = [category.id, *subcategory_ids]

    products = Product.objects.filter(category__in=all_category_ids)
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_all_category_counts(request):
    """Refresh product counts for all categories"""
    categories = Category.objects.all()
    updated_count = 0
    
    for category in categories:
        old_count = category.product_count
        category.update_product_count()
        if old_count != category.product_count:
            updated_count += 1
    
    return Response({
        'message': f'Updated product counts for {updated_count} categories',
        'total_categories': categories.count()
    })
