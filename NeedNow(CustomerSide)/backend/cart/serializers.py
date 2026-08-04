from rest_framework import serializers
from .models import Cart, CartItem
from catalog.models import Product


class CartProductSerializer(serializers.ModelSerializer):
    """Minimal product info embedded inside cart items."""
    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'price', 'image_url', 'brand', 'in_stock']


class CartItemSerializer(serializers.ModelSerializer):
    product = CartProductSerializer(read_only=True)
    product_id = serializers.UUIDField(write_only=True)
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_id', 'quantity', 'line_total', 'added_at']
        read_only_fields = ['id', 'added_at', 'line_total']

    def get_line_total(self, obj):
        if obj.product.price is not None:
            return float(obj.product.price) * obj.quantity
        return None


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total', 'item_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_total(self, obj):
        total = 0
        for item in obj.items.all():
            if item.product.price is not None:
                total += float(item.product.price) * item.quantity
        return round(total, 2)

    def get_item_count(self, obj):
        return sum(item.quantity for item in obj.items.all())
