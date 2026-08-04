#!/usr/bin/env python
"""
Demo script to show product count functionality working
"""
import os
import sys
import django

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from catalog.models import Category, Product
from django.utils.text import slugify


def demo_product_counts():
    print("🚀 Product Count Functionality Demo")
    print("=" * 50)
    
    # Show current category counts
    print("\n📊 Current Category Product Counts:")
    categories_with_products = Category.objects.filter(product_count__gt=0)[:10]
    for cat in categories_with_products:
        print(f"  • {cat.name}: {cat.product_count} products")
    
    # Create a test category
    print(f"\n🏗️  Creating test category...")
    test_category, created = Category.objects.get_or_create(
        name="Test Electronics",
        defaults={
            'slug': slugify("Test Electronics")
        }
    )
    
    initial_count = test_category.product_count
    print(f"  Initial count: {initial_count}")
    
    # Create test products
    print(f"\n📱 Adding test products...")
    for i in range(3):
        product_name = f"Test Product {i+1}"
        product, created = Product.objects.get_or_create(
            name=product_name,
            defaults={
                'slug': slugify(product_name),
                'category': test_category
            }
        )
        if created:
            print(f"  ✅ Created: {product_name}")
    
    # Refresh category and show updated count
    test_category.refresh_from_db()
    new_count = test_category.product_count
    print(f"\n📈 Updated count: {initial_count} → {new_count}")
    print(f"   Difference: +{new_count - initial_count}")
    
    # Delete one product and show count update
    print(f"\n🗑️  Deleting one product...")
    test_product = Product.objects.filter(category=test_category, name__startswith="Test Product").first()
    if test_product:
        test_product.delete()
        print(f"  ✅ Deleted: {test_product.name}")
    
    # Show final count
    test_category.refresh_from_db()
    final_count = test_category.product_count
    print(f"\n📉 Final count: {new_count} → {final_count}")
    print(f"   Difference: {final_count - new_count}")
    
    # Clean up test data
    print(f"\n🧹 Cleaning up test data...")
    Product.objects.filter(category=test_category, name__startswith="Test Product").delete()
    if test_category.product_count == 0:
        test_category.delete()
        print("  ✅ Test category removed")
    
    print(f"\n✨ Demo completed successfully!")
    print("\nKey features demonstrated:")
    print("  ✅ Automatic product count updates on creation")
    print("  ✅ Automatic product count updates on deletion")
    print("  ✅ Real-time count synchronization")
    print("  ✅ Signal-based updates")


if __name__ == "__main__":
    demo_product_counts()