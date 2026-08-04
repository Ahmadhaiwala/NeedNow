from django.test import TestCase
from django.utils.text import slugify
from .models import Category, Product


class ProductCountTestCase(TestCase):
    def setUp(self):
        """Set up test categories and products"""
        # Create parent category
        self.parent_category = Category.objects.create(
            name="Electronics",
            slug=slugify("Electronics")
        )
        
        # Create child category
        self.child_category = Category.objects.create(
            name="Smartphones",
            slug=slugify("Smartphones"),
            parent=self.parent_category
        )
    
    def test_product_creation_updates_count(self):
        """Test that creating a product updates category count"""
        initial_count = self.parent_category.product_count
        
        # Create a product
        product = Product.objects.create(
            name="iPhone 15",
            slug=slugify("iPhone 15"),
            category=self.parent_category
        )
        
        # Refresh from database
        self.parent_category.refresh_from_db()
        
        # Count should be incremented
        self.assertEqual(self.parent_category.product_count, initial_count + 1)
    
    def test_product_deletion_updates_count(self):
        """Test that deleting a product updates category count"""
        # Create a product
        product = Product.objects.create(
            name="Samsung Galaxy",
            slug=slugify("Samsung Galaxy"),
            category=self.child_category
        )
        
        # Get initial count
        self.child_category.refresh_from_db()
        initial_count = self.child_category.product_count
        
        # Delete the product
        product.delete()
        
        # Refresh from database
        self.child_category.refresh_from_db()
        
        # Count should be decremented
        self.assertEqual(self.child_category.product_count, initial_count - 1)
    
    def test_product_category_change_updates_counts(self):
        """Test that changing product category updates both old and new category counts"""
        # Create a product in parent category
        product = Product.objects.create(
            name="iPad",
            slug=slugify("iPad"),
            category=self.parent_category
        )
        
        # Get initial counts
        self.parent_category.refresh_from_db()
        self.child_category.refresh_from_db()
        parent_initial = self.parent_category.product_count
        child_initial = self.child_category.product_count
        
        # Move product to child category
        product.category = self.child_category
        product.save()
        
        # Refresh from database
        self.parent_category.refresh_from_db()
        self.child_category.refresh_from_db()
        
        # Parent count should decrease, child count should increase
        self.assertEqual(self.parent_category.product_count, parent_initial - 1)
        self.assertEqual(self.child_category.product_count, child_initial + 1)
    
    def test_update_ancestors_count_method(self):
        """Test the update_ancestors_count method"""
        # Create products in child category
        Product.objects.create(
            name="Product 1",
            slug="product-1",
            category=self.child_category
        )
        Product.objects.create(
            name="Product 2", 
            slug="product-2",
            category=self.child_category
        )
        
        # Reset counts to 0 manually
        self.parent_category.product_count = 0
        self.parent_category.save()
        self.child_category.product_count = 0
        self.child_category.save()
        
        # Update counts using the method
        self.child_category.update_ancestors_count()
        
        # Refresh from database
        self.parent_category.refresh_from_db()
        self.child_category.refresh_from_db()
        
        # Both should have correct counts
        self.assertEqual(self.child_category.product_count, 2)
        # Parent category doesn't have direct products, so its count should be 0
        # (The signals only update direct product counts, not recursive counts)
        self.assertEqual(self.parent_category.product_count, 0)