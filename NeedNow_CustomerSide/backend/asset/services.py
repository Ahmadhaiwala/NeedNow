"""
Business logic services for asset management.
Keeps views thin by handling complex operations here.
"""
from django.db import transaction
from django.db.models import F, Q, Sum, Count, Max
from django.utils import timezone
from datetime import timedelta
from catalog.models import Product
from .models import AssetCollection, AssetLocation, Asset, AssetTransaction


class AssetService:
    """Service class for asset-related business logic"""

    @staticmethod
    def create_collection_with_default_locations(owner, name, description=""):
        """Create a collection with common default locations"""
        with transaction.atomic():
            collection = AssetCollection.objects.create(
                owner=owner,
                name=name,
                description=description
            )
            
            # Create common home locations
            default_locations = [
                {"name": "Kitchen", "children": ["Pantry", "Fridge", "Freezer", "Countertop"]},
                {"name": "Bathroom", "children": ["Medicine Cabinet", "Shower", "Vanity"]},
                {"name": "Bedroom", "children": ["Closet", "Nightstand", "Dresser"]},
                {"name": "Living Room", "children": ["TV Stand", "Coffee Table"]},
                {"name": "Garage", "children": ["Tool Bench", "Storage Shelves"]},
                {"name": "Laundry Room", "children": ["Washer Area", "Storage"]},
                {"name": "Office", "children": ["Desk", "Bookshelf", "Storage"]},
            ]
            
            for location_data in default_locations:
                parent = AssetLocation.objects.create(
                    collection=collection,
                    name=location_data["name"]
                )
                
                for child_name in location_data.get("children", []):
                    AssetLocation.objects.create(
                        collection=collection,
                        parent=parent,
                        name=child_name
                    )
            
            return collection

    @staticmethod
    def add_asset_from_product(collection, product_id, location_id, quantity=1, 
                              low_stock_threshold=1, purchase_date=None, 
                              expiry_date=None, notes="", source="manual"):
        """Add a new asset from a product"""
        with transaction.atomic():
            product = Product.objects.get(id=product_id)
            location = AssetLocation.objects.get(id=location_id, collection=collection)
            
            # Check if asset already exists in this location
            existing_asset = Asset.objects.filter(
                collection=collection,
                product=product,
                location=location
            ).first()
            
            if existing_asset:
                # Restock existing asset
                existing_asset.restock(quantity, notes, source)
                return existing_asset
            else:
                # Create new asset
                asset = Asset.objects.create(
                    collection=collection,
                    product=product,
                    location=location,
                    quantity=quantity,
                    low_stock_threshold=low_stock_threshold,
                    purchase_date=purchase_date,
                    expiry_date=expiry_date,
                    notes=notes
                )
                
                # Create initial transaction
                AssetTransaction.objects.create(
                    asset=asset,
                    transaction_type=AssetTransaction.TransactionType.ADD,
                    quantity_before=0,
                    quantity_after=quantity,
                    quantity_changed=quantity,
                    source=source,
                    note=f"Initial stock: {notes}" if notes else "Initial stock"
                )
                
                return asset

    @staticmethod
    def get_dashboard_data(collection):
        """Get comprehensive dashboard data for a collection"""
        # Basic stats
        total_assets = collection.assets.count()
        low_stock_items = collection.assets.filter(
            quantity__lte=F('low_stock_threshold')
        )
        expired_items = collection.assets.filter(
            expiry_date__lt=timezone.now().date()
        )
        expiring_soon = collection.assets.filter(
            expiry_date__gte=timezone.now().date(),
            expiry_date__lte=timezone.now().date() + timedelta(days=7)
        )
        
        # Location breakdown
        locations_data = []
        for location in collection.locations.filter(parent__isnull=True):
            location_assets = Asset.objects.filter(
                location__in=[location] + location.get_descendants()
            )
            locations_data.append({
                'id': location.id,
                'name': location.name,
                'asset_count': location_assets.count(),
                'low_stock_count': location_assets.filter(
                    quantity__lte=F('low_stock_threshold')
                ).count()
            })
        
        # Recent transactions
        recent_transactions = AssetTransaction.objects.filter(
            asset__collection=collection
        )[:10]
        
        # Category breakdown (from products)
        category_stats = collection.assets.values(
            'product__category__name'
        ).annotate(
            count=Count('id'),
            total_quantity=Sum('quantity')
        ).order_by('-count')
        
        return {
            'stats': {
                'total_assets': total_assets,
                'low_stock': low_stock_items.count(),
                'expired': expired_items.count(),
                'expiring_soon': expiring_soon.count(),
            },
            'locations': locations_data,
            'low_stock_items': low_stock_items[:10],  # Top 10
            'expired_items': expired_items[:10],
            'expiring_soon_items': expiring_soon[:10],
            'recent_transactions': recent_transactions,
            'category_stats': category_stats[:10]
        }

    @staticmethod
    def get_shopping_recommendations(collection, limit=20):
        """Generate shopping recommendations based on low stock and usage patterns"""
        recommendations = []
        
        # Low stock items
        low_stock_assets = collection.assets.filter(
            quantity__lte=F('low_stock_threshold')
        ).select_related('product', 'location')
        
        for asset in low_stock_assets:
            recommendations.append({
                'type': 'low_stock',
                'priority': 'high',
                'product': asset.product,
                'current_quantity': asset.quantity,
                'threshold': asset.low_stock_threshold,
                'location': asset.location.full_path,
                'suggestion': f"Running low on {asset.product.name}",
                'recommended_quantity': max(asset.low_stock_threshold * 2, 1)
            })
        
        # Items that haven't been restocked in a while but are consumed regularly
        frequently_used = collection.assets.filter(
            transactions__transaction_type=AssetTransaction.TransactionType.CONSUME,
            transactions__created_at__gte=timezone.now() - timedelta(days=30)
        ).annotate(
            consume_count=Count(
                'transactions',
                filter=Q(
                    transactions__transaction_type=AssetTransaction.TransactionType.CONSUME,
                    transactions__created_at__gte=timezone.now() - timedelta(days=30)
                )
            ),
            last_restock=Max(
                'transactions__created_at',
                filter=Q(transactions__transaction_type=AssetTransaction.TransactionType.ADD)
            )
        ).filter(
            consume_count__gte=3,  # Used at least 3 times in last 30 days
            last_restock__lt=timezone.now() - timedelta(days=14)  # Not restocked in 2 weeks
        )
        
        for asset in frequently_used:
            if asset not in [r['product'] for r in recommendations]:  # Avoid duplicates
                recommendations.append({
                    'type': 'frequent_use',
                    'priority': 'medium',
                    'product': asset.product,
                    'current_quantity': asset.quantity,
                    'usage_frequency': asset.consume_count,
                    'location': asset.location.full_path,
                    'suggestion': f"Frequently used - consider restocking {asset.product.name}",
                    'recommended_quantity': 2
                })
        
        # Sort by priority and limit results
        priority_order = {'high': 0, 'medium': 1, 'low': 2}
        recommendations.sort(key=lambda x: priority_order.get(x['priority'], 3))
        
        return recommendations[:limit]

    @staticmethod
    def bulk_consume(collection, consumption_data):
        """Bulk consume multiple assets"""
        with transaction.atomic():
            results = []
            
            for item in consumption_data:
                try:
                    asset = Asset.objects.get(
                        id=item['asset_id'],
                        collection=collection
                    )
                    
                    asset.consume(
                        quantity=item['quantity'],
                        note=item.get('note', ''),
                        source=item.get('source', 'manual')
                    )
                    
                    results.append({
                        'asset_id': asset.id,
                        'success': True,
                        'new_quantity': asset.quantity,
                        'message': f"Consumed {item['quantity']} of {asset.product.name}"
                    })
                    
                except Exception as e:
                    results.append({
                        'asset_id': item.get('asset_id'),
                        'success': False,
                        'error': str(e)
                    })
            
            return results

    @staticmethod
    def search_assets(collection, query, filters=None):
        """Search assets with various filters"""
        assets = collection.assets.select_related('product', 'location')
        
        # Text search
        if query:
            assets = assets.filter(
                Q(product__name__icontains=query) |
                Q(product__brand__icontains=query) |
                Q(location__name__icontains=query) |
                Q(notes__icontains=query)
            )
        
        # Apply filters
        if filters:
            if filters.get('location_id'):
                location = AssetLocation.objects.get(id=filters['location_id'])
                location_ids = [location.id] + [desc.id for desc in location.get_descendants()]
                assets = assets.filter(location_id__in=location_ids)
            
            if filters.get('category_id'):
                assets = assets.filter(product__category_id=filters['category_id'])
            
            if filters.get('low_stock_only'):
                assets = assets.filter(quantity__lte=F('low_stock_threshold'))
            
            if filters.get('expired_only'):
                assets = assets.filter(expiry_date__lt=timezone.now().date())
            
            if filters.get('expiring_soon'):
                assets = assets.filter(
                    expiry_date__gte=timezone.now().date(),
                    expiry_date__lte=timezone.now().date() + timedelta(days=7)
                )
        
        return assets.order_by('-updated_at')

    @staticmethod
    def get_asset_analytics(collection, days=30):
        """Get analytics data for assets over a period"""
        start_date = timezone.now() - timedelta(days=days)
        
        # Transaction analytics
        transactions = AssetTransaction.objects.filter(
            asset__collection=collection,
            created_at__gte=start_date
        )
        
        consumption_trend = transactions.filter(
            transaction_type=AssetTransaction.TransactionType.CONSUME
        ).values('created_at__date').annotate(
            total_consumed=Sum('quantity_changed')
        ).order_by('created_at__date')
        
        restocking_trend = transactions.filter(
            transaction_type=AssetTransaction.TransactionType.ADD
        ).values('created_at__date').annotate(
            total_added=Sum('quantity_changed')
        ).order_by('created_at__date')
        
        # Most consumed items
        most_consumed = collection.assets.annotate(
            total_consumed=Sum(
                'transactions__quantity_changed',
                filter=Q(
                    transactions__transaction_type=AssetTransaction.TransactionType.CONSUME,
                    transactions__created_at__gte=start_date
                )
            )
        ).filter(total_consumed__isnull=False).order_by('-total_consumed')[:10]
        
        return {
            'consumption_trend': list(consumption_trend),
            'restocking_trend': list(restocking_trend),
            'most_consumed': most_consumed,
            'total_transactions': transactions.count(),
            'period_days': days
        }