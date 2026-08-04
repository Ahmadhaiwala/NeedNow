from django.contrib import admin
from .models import AssetCollection, AssetLocation, Asset, AssetTransaction


@admin.register(AssetCollection)
class AssetCollectionAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'total_assets', 'low_stock_count', 'created_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['name', 'owner__email', 'description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(AssetLocation)
class AssetLocationAdmin(admin.ModelAdmin):
    list_display = ['name', 'collection', 'parent', 'full_path', 'asset_count']
    list_filter = ['collection', 'parent']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = [
        'product', 'location', 'collection', 'quantity', 
        'low_stock_threshold', 'is_low_stock', 'is_expired'
    ]
    list_filter = [
        'collection', 'location', 'purchase_date', 'expiry_date'
    ]
    search_fields = ['product__name', 'location__name', 'notes']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(AssetTransaction)
class AssetTransactionAdmin(admin.ModelAdmin):
    list_display = [
        'asset', 'transaction_type', 'quantity_changed', 'quantity_after', 
        'source', 'created_at'
    ]
    list_filter = ['transaction_type', 'source', 'created_at']
    search_fields = ['asset__product__name', 'note']
    readonly_fields = ['created_at']
