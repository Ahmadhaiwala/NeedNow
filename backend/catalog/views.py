from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.pagination import PageNumberPagination
from rest_framework import status
from django.db.models import Q, Count
from .models import Category, Product
from .catalogSerializer import CategorySerializer, ProductSerializer, CategoryTreeSerializer


class CatalogPagination(PageNumberPagination):
    """
    Shared pagination class for catalog endpoints.
    Supports ?page=N and ?page_size=N (max 50).
    """
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 50
    page_query_param = "page"


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
    """
    ViewSet for product operations.
    Supports pagination via ?page=N&page_size=N (max 50).
    Supports filters: ?category=<uuid>, ?search=<str>, ?in_stock=true|false
    """
    queryset = Product.objects.select_related("category").all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    pagination_class = CatalogPagination

    def get_queryset(self):
        """Filter products based on query parameters."""
        queryset = Product.objects.select_related("category")

        category_id = self.request.query_params.get("category", None)
        search = self.request.query_params.get("search", None)
        in_stock = self.request.query_params.get("in_stock", None)

        if category_id:
            try:
                category = Category.objects.get(id=category_id)
                # Include products from all subcategories
                subcategory_ids = category.subcategories.values_list("id", flat=True)
                all_category_ids = [category.id, *subcategory_ids]
                queryset = queryset.filter(category__in=all_category_ids)
            except Category.DoesNotExist:
                queryset = queryset.none()

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(brand__icontains=search)
                | Q(tags__icontains=search)
            )

        if in_stock == "true":
            queryset = queryset.filter(in_stock=True, stock_quantity__gt=0)
        elif in_stock == "false":
            queryset = queryset.filter(Q(in_stock=False) | Q(stock_quantity=0))

        return queryset.order_by("-popularity_score", "-rating", "name")


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


@api_view(["GET"])
@permission_classes([AllowAny])
def getproductforcategory(request, id):
    """
    GET /api/catalog/products/<uuid>/

    Return products for a category and all its subcategories, paginated.

    Query params:
        page       (int, default 1)
        page_size  (int, default 20, max 50)
    """
    try:
        category = Category.objects.get(id=id)
    except Category.DoesNotExist:
        return Response({"error": "Category not found"}, status=404)

    subcategory_ids = category.subcategories.values_list("id", flat=True)
    all_category_ids = [category.id, *subcategory_ids]

    qs = (
        Product.objects
        .filter(category__in=all_category_ids)
        .select_related("category")
        .order_by("-popularity_score", "-rating", "name")
    )

    paginator = CatalogPagination()
    page = paginator.paginate_queryset(qs, request)

    if page is not None:
        serializer = ProductSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    # Fallback (should not be reached with pagination configured)
    serializer = ProductSerializer(qs, many=True)
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


@api_view(['GET'])
@permission_classes([AllowAny])
def search_products(request):
    """
    GET /api/catalog/search/?q=<query>&limit=<n>

    Full-text search across product name, brand, and tags.
    If a valid Bearer token is present the query is also stored as a
    UserInteraction(type='search') for the recommendation engine.
    """
    from recommendations.models import UserInteraction, InteractionType
    from users.auth_utils import get_user_from_neon_auth

    query = request.query_params.get('q', '').strip()
    limit = min(int(request.query_params.get('limit', 20)), 50)

    if not query:
        return Response({'results': [], 'count': 0, 'query': ''})

    products = Product.objects.filter(
        Q(name__icontains=query) |
        Q(brand__icontains=query) |
        Q(tags__icontains=query)
    ).order_by('name')[:limit]

    serializer = ProductSerializer(products, many=True)

    # Record search interaction for authenticated users
    # (best-effort — never block the response on a tracking failure)
    try:
        user = get_user_from_neon_auth(request)
        if user:
            UserInteraction.objects.create(
                user=user,
                interaction_type=InteractionType.SEARCH,
                value=1.0,
                metadata={'query': query, 'result_count': len(serializer.data)},
            )
    except Exception:
        pass

    return Response({
        'results': serializer.data,
        'count': len(serializer.data),
        'query': query,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def home_feed(request):
    """
    GET /api/catalog/home/

    Returns lightweight section metadata for the homepage feed.
    No products are included — each section's ``endpoint`` is fetched
    lazily by the frontend when the section enters the viewport.

    Response::

        {
            "sections": [
                {
                    "id":            <str>,
                    "type":          "recommendation" | "category",
                    "title":         <str>,
                    "endpoint":      <str>,   # absolute path
                    "requires_auth": <bool>
                },
                ...
            ],
            "meta": {
                "total_categories": <int>,
                "total_products":   <int>
            }
        }
    """
    sections = []

    # ── Recommendation section (always first) ──────────────────────────────
    sections.append({
        "id": "for-you",
        "type": "recommendation",
        "title": "Picked For You",
        "endpoint": "/api/recommendations/",
        "requires_auth": True,
    })

    # ── Category sections ordered by real product count ─────────────────────
    # Use a live annotation instead of the cached product_count field to avoid
    # empty results when the cached count hasn't been recalculated yet.
    categories = (
        Category.objects
        .filter(parent__isnull=True)
        .annotate(live_count=Count("products"))
        .filter(live_count__gt=0)
        .order_by("-live_count")[:12]
    )

    for cat in categories:
        sections.append({
            "id": str(cat.id),
            "type": "category",
            "title": cat.name,
            "endpoint": f"/api/catalog/products/{cat.id}/",
            "requires_auth": False,
        })

    # ── Hero stats ─────────────────────────────────────────────────────────
    total_categories = Category.objects.filter(parent__isnull=True).count()
    total_products = Product.objects.count()

    return Response({
        "sections": sections,
        "meta": {
            "total_categories": total_categories,
            "total_products": total_products,
        },
    })
