from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Category, Product
from .catalogSerializer import CategorySerializer, ProductSerializer


@api_view(['GET'])
def getcategories(request):
    """Return only parent categories (no subcategories)."""
    categories = Category.objects.filter(parent__isnull=True)
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def getproducts(request):
    products = Product.objects.all()
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)


@api_view(['GET'])
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
