from rest_framework import serializers
from catalog.models import Product
from catalog.catalogSerializer import ProductSerializer
from .models import AssetCollection, AssetLocation, Asset, AssetTransaction


class AssetCollectionSerializer(serializers.ModelSerializer):
    """Serializer for AssetCollection model"""
    total_assets = serializers.ReadOnlyField()
    low_stock_count = serializers.ReadOnlyField()
    owner_name = serializers.CharField(source='owner.display_name', read_only=True)
    
    class Meta:
        model = AssetCollection
        fields = [
            'id', 'owner', 'owner_name', 'name', 'description', 
            'total_assets', 'low_stock_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

    def validate_name(self, value):
        """Ensure collection name is unique for the user"""
        owner = self.context['request'].user
        if AssetCollection.objects.filter(owner=owner, name=value).exists():
            raise serializers.ValidationError("You already have a collection with this name.")
        return value


class AssetLocationSerializer(serializers.ModelSerializer):
    """Serializer for AssetLocation model"""
    full_path = serializers.ReadOnlyField()
    asset_count = serializers.ReadOnlyField()
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    children = serializers.SerializerMethodField()
    
    class Meta:
        model = AssetLocation
        fields = [
            'id', 'collection', 'parent', 'parent_name', 'name', 'description',
            'full_path', 'asset_count', 'children', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_children(self, obj):
        """Get child locations"""
        children = obj.children.all()
        return AssetLocationSerializer(children, many=True, context=self.context).data

    def validate(self, data):
        """Validate location data"""
        collection = data.get('collection')
        parent = data.get('parent')
        name = data.get('name')
        
        # Ensure parent belongs to the same collection
        if parent and parent.collection != collection:
            raise serializers.ValidationError("Parent location must be in the same collection.")
        
        # Check for unique name within parent/collection
        existing = AssetLocation.objects.filter(
            collection=collection,
            parent=parent,
            name=name
        )
        
        # Exclude current instance if updating
        if self.instance:
            existing = existing.exclude(id=self.instance.id)
        
        if existing.exists():
            raise serializers.ValidationError("Location name must be unique within the same parent location.")
        
        return data


class AssetLocationTreeSerializer(serializers.ModelSerializer):
    """Serializer for hierarchical location display"""
    children = serializers.SerializerMethodField()
    
    class Meta:
        model = AssetLocation
        fields = ['id', 'name', 'description', 'asset_count', 'children']
    
    def get_children(self, obj):
        """Recursively get all child locations"""
        children = obj.children.all()
        return AssetLocationTreeSerializer(children, many=True).data


class AssetTransactionSerializer(serializers.ModelSerializer):
    """Serializer for AssetTransaction model"""
    asset_name = serializers.CharField(source='asset.product.name', read_only=True)
    location_name = serializers.CharField(source='asset.location.full_path', read_only=True)
    display_change = serializers.ReadOnlyField()
    
    class Meta:
        model = AssetTransaction
        fields = [
            'id', 'asset', 'asset_name', 'location_name', 'transaction_type',
            'quantity_before', 'quantity_after', 'quantity_changed', 'display_change',
            'source', 'note', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class AssetSerializer(serializers.ModelSerializer):
    """Serializer for Asset model"""
    product = ProductSerializer(read_only=True)
    product_id = serializers.UUIDField(write_only=True)
    location_name = serializers.CharField(source='location.full_path', read_only=True)
    collection_name = serializers.CharField(source='collection.name', read_only=True)
    is_low_stock = serializers.ReadOnlyField()
    is_expired = serializers.ReadOnlyField()
    days_until_expiry = serializers.ReadOnlyField()
    recent_transactions = serializers.SerializerMethodField()
    
    class Meta:
        model = Asset
        fields = [
            'id', 'collection', 'collection_name', 'product', 'product_id',
            'location', 'location_name', 'quantity', 'low_stock_threshold',
            'purchase_date', 'expiry_date', 'last_used', 'notes',
            'is_low_stock', 'is_expired', 'days_until_expiry',
            'recent_transactions', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_recent_transactions(self, obj):
        """Get recent transactions for this asset"""
        transactions = obj.transactions.all()[:5]
        return AssetTransactionSerializer(transactions, many=True).data

    def validate(self, data):
        """Validate asset data"""
        collection = data.get('collection')
        product_id = data.get('product_id')
        location = data.get('location')
        
        # Ensure location belongs to the same collection
        if location and location.collection != collection:
            raise serializers.ValidationError("Location must be in the same collection.")
        
        # Ensure product exists
        if product_id:
            try:
                data['product'] = Product.objects.get(id=product_id)
            except Product.DoesNotExist:
                raise serializers.ValidationError("Product not found.")
        
        # Check for duplicate asset in same location (only for creation)
        if not self.instance:
            product = data.get('product')
            existing = Asset.objects.filter(
                collection=collection,
                product=product,
                location=location
            ).exists()
            
            if existing:
                raise serializers.ValidationError(
                    "This product already exists in this location. Use restock instead."
                )
        
        return data


class AssetSummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for asset summaries"""
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.CharField(source='product.image_url', read_only=True)
    location_name = serializers.CharField(source='location.name', read_only=True)
    is_low_stock = serializers.ReadOnlyField()
    is_expired = serializers.ReadOnlyField()
    
    class Meta:
        model = Asset
        fields = [
            'id', 'product_name', 'product_image', 'location_name',
            'quantity', 'low_stock_threshold', 'is_low_stock', 'is_expired',
            'expiry_date', 'updated_at'
        ]


# Action-specific serializers
class ConsumeAssetSerializer(serializers.Serializer):
    """Serializer for consuming assets"""
    quantity = serializers.IntegerField(min_value=1)
    note = serializers.CharField(max_length=500, required=False, allow_blank=True)
    
    def validate_quantity(self, value):
        """Ensure we don't consume more than available"""
        asset = self.context['asset']
        if value > asset.quantity:
            raise serializers.ValidationError(
                f"Cannot consume {value}. Only {asset.quantity} available."
            )
        return value


class RestockAssetSerializer(serializers.Serializer):
    """Serializer for restocking assets"""
    quantity = serializers.IntegerField(min_value=1)
    note = serializers.CharField(max_length=500, required=False, allow_blank=True)


class AdjustAssetSerializer(serializers.Serializer):
    """Serializer for adjusting asset quantity"""
    quantity = serializers.IntegerField(min_value=0)
    note = serializers.CharField(max_length=500, required=False, allow_blank=True)


class MoveAssetSerializer(serializers.Serializer):
    """Serializer for moving assets"""
    location = serializers.UUIDField()
    note = serializers.CharField(max_length=500, required=False, allow_blank=True)
    
    def validate_location(self, value):
        """Validate the new location"""
        asset = self.context['asset']
        try:
            new_location = AssetLocation.objects.get(id=value)
        except AssetLocation.DoesNotExist:
            raise serializers.ValidationError("Location not found.")
        
        if new_location.collection != asset.collection:
            raise serializers.ValidationError(
                "Cannot move asset to location in different collection."
            )
        
        if new_location == asset.location:
            raise serializers.ValidationError("Asset is already in this location.")
        
        return new_location


class BulkConsumeSerializer(serializers.Serializer):
    """Serializer for bulk consumption"""
    items = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        ),
        min_length=1
    )
    
    def validate_items(self, value):
        """Validate bulk consumption items"""
        collection = self.context['collection']
        validated_items = []
        
        for item in value:
            if 'asset_id' not in item or 'quantity' not in item:
                raise serializers.ValidationError(
                    "Each item must have 'asset_id' and 'quantity'."
                )
            
            try:
                asset = Asset.objects.get(id=item['asset_id'], collection=collection)
                quantity = int(item['quantity'])
                
                if quantity <= 0:
                    raise serializers.ValidationError("Quantity must be positive.")
                
                if quantity > asset.quantity:
                    raise serializers.ValidationError(
                        f"Cannot consume {quantity} of {asset.product.name}. "
                        f"Only {asset.quantity} available."
                    )
                
                validated_items.append({
                    'asset_id': item['asset_id'],
                    'quantity': quantity,
                    'note': item.get('note', ''),
                    'source': item.get('source', 'manual')
                })
                
            except Asset.DoesNotExist:
                raise serializers.ValidationError(f"Asset {item['asset_id']} not found.")
            except ValueError:
                raise serializers.ValidationError("Invalid quantity value.")
        
        return validated_items


class DashboardSerializer(serializers.Serializer):
    """Serializer for dashboard data"""
    stats = serializers.DictField()
    locations = serializers.ListField()
    low_stock_items = AssetSummarySerializer(many=True)
    expired_items = AssetSummarySerializer(many=True)
    expiring_soon_items = AssetSummarySerializer(many=True)
    recent_transactions = AssetTransactionSerializer(many=True)
    category_stats = serializers.ListField()


class ShoppingRecommendationSerializer(serializers.Serializer):
    """Serializer for shopping recommendations"""
    type = serializers.CharField()
    priority = serializers.CharField()
    product = ProductSerializer()
    current_quantity = serializers.IntegerField()
    threshold = serializers.IntegerField(required=False)
    location = serializers.CharField()
    suggestion = serializers.CharField()
    recommended_quantity = serializers.IntegerField()
    usage_frequency = serializers.IntegerField(required=False)