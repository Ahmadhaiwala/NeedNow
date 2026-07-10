from django.db import models
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
import uuid


class UnitChoices(models.TextChoices):
    PIECE = "piece", "Piece"
    KG = "kg", "Kilogram"
    GRAM = "g", "Gram"
    LITER = "l", "Liter"
    ML = "ml", "Milliliter"
    PACK = "pack", "Pack"


class Category(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    name = models.CharField(
        max_length=100,
        unique=True
    )

    slug = models.SlugField(
        max_length=150,
        unique=True
    )

    image_url = models.URLField(max_length=2000, blank=True)

    parent = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="subcategories"
    )

    product_count = models.IntegerField(default=0)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name
    
    def update_product_count(self):
        """Update the product count for this category"""
        self.product_count = self.products.count()
        self.save(update_fields=['product_count'])
    
    def update_ancestors_count(self):
        """Update product count for this category and all parent categories"""
        # Update this category
        self.update_product_count()
        
        # Update parent categories recursively
        if self.parent:
            self.parent.update_ancestors_count()


class Product(models.Model):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    # Amazon ASIN
    external_id = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
        null=True,
        db_index=True
    )

    name = models.CharField(
        max_length=500
    )

    slug = models.SlugField(
        max_length=600,
        unique=True
    )

    brand = models.CharField(
        max_length=200,
        blank=True
    )

    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products"
    )

    unit = models.CharField(
        max_length=10,
        choices=UnitChoices.choices,
        default=UnitChoices.PIECE
    )

    unit_size = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=1
    )

    barcode = models.CharField(
        max_length=50,
        unique=True,
        blank=True,
        null=True
    )

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )

    original_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )

    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0
    )

    review_count = models.PositiveIntegerField(
        default=0
    )

    image_url = models.URLField(
        max_length=2000,
        blank=True
    )

    # Amazon "features"
    features = models.JSONField(
        default=list,
        blank=True
    )

    # Long descriptions
    description = models.JSONField(
        default=list,
        blank=True
    )

    # Technical details/specifications
    specifications = models.JSONField(
        default=dict,
        blank=True
    )

    # Categories/tags from dataset
    tags = models.JSONField(
        default=list,
        blank=True
    )

    # Frequently bought together
    bought_together = models.JSONField(
        default=list,
        blank=True
    )

    in_stock = models.BooleanField(
        default=True
    )

    stock_quantity = models.PositiveIntegerField(
        default=0
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class ProductImage(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="images"
    )

    image_url = models.URLField(max_length=2000)

    is_primary = models.BooleanField(
        default=False
    )

    def __str__(self):
        return f"{self.product.name} image"


# Signal handlers for automatic product count updates
@receiver(post_save, sender=Product)
def update_category_count_on_product_save(sender, instance, created, **kwargs):
    """Update category product count when a product is created or updated"""
    if instance.category:
        # Handle category change
        if not created and hasattr(instance, '_original_category_id'):
            # Product category was changed
            old_category_id = instance._original_category_id
            if old_category_id != instance.category.id:
                # Update old category count
                try:
                    old_category = Category.objects.get(id=old_category_id)
                    old_category.update_ancestors_count()
                except Category.DoesNotExist:
                    pass
        
        # Update new/current category count
        instance.category.update_ancestors_count()


@receiver(post_delete, sender=Product)
def update_category_count_on_product_delete(sender, instance, **kwargs):
    """Update category product count when a product is deleted"""
    if instance.category:
        instance.category.update_ancestors_count()


# Track category changes for products
@receiver(models.signals.pre_save, sender=Product)
def track_category_change(sender, instance, **kwargs):
    """Track the original category before saving to handle category changes"""
    if instance.pk:
        try:
            original = Product.objects.get(pk=instance.pk)
            instance._original_category_id = original.category.id if original.category else None
        except Product.DoesNotExist:
            instance._original_category_id = None
    else:
        instance._original_category_id = None