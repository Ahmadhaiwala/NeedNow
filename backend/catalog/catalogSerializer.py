from rest_framework import serializers
from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    subcategory_count = serializers.SerializerMethodField()
    total_product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = '__all__'

    def get_subcategory_count(self, obj):
        """Get the number of direct subcategories"""
        return obj.subcategories.count()

    def get_total_product_count(self, obj):
        """Get product count including all subcategories (recursive)"""
        def get_all_subcategory_ids(category):
            """Recursively get all subcategory IDs"""
            subcategory_ids = [category.id]
            for subcategory in category.subcategories.all():
                subcategory_ids.extend(get_all_subcategory_ids(subcategory))
            return subcategory_ids
        
        all_category_ids = get_all_subcategory_ids(obj)
        return Product.objects.filter(category__in=all_category_ids).count()


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Product
        fields = '__all__'


class CategoryTreeSerializer(serializers.ModelSerializer):
    """Serializer for hierarchical category display"""
    subcategories = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'image_url', 'product_count', 'subcategories']
    
    def get_subcategories(self, obj):
        """Get direct subcategories with their product counts"""
        subcategories = obj.subcategories.all()
        return CategoryTreeSerializer(subcategories, many=True, context=self.context).data