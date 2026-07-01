from rest_framework import serializers
from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = '__all__'

    def get_product_count(self, obj):
        """Count products in this category and all its subcategories."""
        subcategory_ids = obj.subcategories.values_list('id', flat=True)
        return Product.objects.filter(
            category__in=[obj.id, *subcategory_ids]
        ).count()


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Product
        fields = '__all__'