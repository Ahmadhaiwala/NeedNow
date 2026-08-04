from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from django.utils import timezone
from catalog.models import Product
import uuid


class AssetCollection(models.Model):
    """
    Represents a logical collection of assets.
    Examples: Home, Hostel Room, Apartment, Office
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="asset_collections"
    )
    name = models.CharField(
        max_length=100,
        help_text="Name of the collection (e.g., Home, Apartment, Office)"
    )
    description = models.TextField(
        blank=True,
        help_text="Optional description of the collection"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'asset_collections'
        verbose_name = 'Asset Collection'
        verbose_name_plural = 'Asset Collections'
        ordering = ['-created_at']
        unique_together = ['owner', 'name']

    def __str__(self):
        return f"{self.owner}'s {self.name}"

    @property
    def total_assets(self):
        """Return total number of assets in this collection"""
        return self.assets.count()

    @property
    def low_stock_count(self):
        """Return number of assets below their low stock threshold"""
        return self.assets.filter(
            quantity__lte=models.F('low_stock_threshold')
        ).count()


class AssetLocation(models.Model):
    """
    Represents where assets are stored within a collection.
    Supports nested locations using self-referencing parent relationship.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    collection = models.ForeignKey(
        AssetCollection,
        on_delete=models.CASCADE,
        related_name="locations"
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children",
        help_text="Parent location for nested structure"
    )
    name = models.CharField(
        max_length=100,
        help_text="Name of the location (e.g., Kitchen, Pantry, Fridge)"
    )
    description = models.TextField(
        blank=True,
        help_text="Optional description of the location"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'asset_locations'
        verbose_name = 'Asset Location'
        verbose_name_plural = 'Asset Locations'
        ordering = ['name']
        unique_together = ['collection', 'parent', 'name']

    def __str__(self):
        if self.parent:
            return f"{self.parent.name} > {self.name}"
        return self.name

    @property
    def full_path(self):
        """Return full hierarchical path of the location"""
        path = [self.name]
        current = self.parent
        while current:
            path.append(current.name)
            current = current.parent
        return " > ".join(reversed(path))

    @property
    def asset_count(self):
        """Return number of assets in this location"""
        return self.assets.count()

    def get_descendants(self):
        """Return all descendant locations"""
        descendants = []
        for child in self.children.all():
            descendants.append(child)
            descendants.extend(child.get_descendants())
        return descendants


class Asset(models.Model):
    """
    Represents what the user owns in their home.
    Links to Product from catalog app for product information.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    collection = models.ForeignKey(
        AssetCollection,
        on_delete=models.CASCADE,
        related_name="assets"
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="owned_assets"
    )
    location = models.ForeignKey(
        AssetLocation,
        on_delete=models.CASCADE,
        related_name="assets"
    )
    quantity = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(0)],
        help_text="Current quantity owned"
    )
    low_stock_threshold = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(0)],
        help_text="Alert when quantity falls below this level"
    )
    purchase_date = models.DateField(
        null=True,
        blank=True,
        help_text="When the item was purchased"
    )
    expiry_date = models.DateField(
        null=True,
        blank=True,
        help_text="When the item expires (if applicable)"
    )
    last_used = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the item was last used/consumed"
    )
    notes = models.TextField(
        blank=True,
        help_text="Additional notes about this asset"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'assets'
        verbose_name = 'Asset'
        verbose_name_plural = 'Assets'
        ordering = ['-updated_at']
        unique_together = ['collection', 'product', 'location']

    def __str__(self):
        return f"{self.product.name} in {self.location.name} ({self.quantity})"

    @property
    def is_low_stock(self):
        """Check if asset is below low stock threshold"""
        return self.quantity <= self.low_stock_threshold

    @property
    def is_expired(self):
        """Check if asset has expired"""
        if not self.expiry_date:
            return False
        return self.expiry_date < timezone.now().date()

    @property
    def days_until_expiry(self):
        """Return days until expiry (negative if expired)"""
        if not self.expiry_date:
            return None
        return (self.expiry_date - timezone.now().date()).days

    def consume(self, quantity, note="", source="manual"):
        """Consume a quantity of this asset"""
        if quantity <= 0:
            raise ValueError("Consume quantity must be positive")
        if quantity > self.quantity:
            raise ValueError("Cannot consume more than available quantity")
        
        # Update quantity
        old_quantity = self.quantity
        self.quantity -= quantity
        self.last_used = timezone.now()
        self.save()

        # Create transaction
        AssetTransaction.objects.create(
            asset=self,
            transaction_type=AssetTransaction.TransactionType.CONSUME,
            quantity_before=old_quantity,
            quantity_after=self.quantity,
            quantity_changed=-quantity,
            source=source,
            note=note
        )

    def restock(self, quantity, note="", source="manual"):
        """Add quantity to this asset"""
        if quantity <= 0:
            raise ValueError("Restock quantity must be positive")
        
        # Update quantity
        old_quantity = self.quantity
        self.quantity += quantity
        self.save()

        # Create transaction
        AssetTransaction.objects.create(
            asset=self,
            transaction_type=AssetTransaction.TransactionType.ADD,
            quantity_before=old_quantity,
            quantity_after=self.quantity,
            quantity_changed=quantity,
            source=source,
            note=note
        )

    def adjust(self, new_quantity, note="", source="manual"):
        """Adjust quantity to a specific amount"""
        if new_quantity < 0:
            raise ValueError("Quantity cannot be negative")
        
        # Calculate change
        old_quantity = self.quantity
        quantity_changed = new_quantity - old_quantity
        
        # Update quantity
        self.quantity = new_quantity
        self.save()

        # Create transaction
        AssetTransaction.objects.create(
            asset=self,
            transaction_type=AssetTransaction.TransactionType.ADJUST,
            quantity_before=old_quantity,
            quantity_after=self.quantity,
            quantity_changed=quantity_changed,
            source=source,
            note=note
        )

    def move(self, new_location, note="", source="manual"):
        """Move asset to a new location"""
        if new_location.collection != self.collection:
            raise ValueError("Cannot move asset to location in different collection")
        
        old_location = self.location
        self.location = new_location
        self.save()

        # Create transaction
        AssetTransaction.objects.create(
            asset=self,
            transaction_type=AssetTransaction.TransactionType.MOVE,
            quantity_before=self.quantity,
            quantity_after=self.quantity,
            quantity_changed=0,
            source=source,
            note=note or f"Moved from {old_location.name} to {new_location.name}"
        )


class AssetTransaction(models.Model):
    """
    Tracks every change to assets for audit trail and history.
    """
    class TransactionType(models.TextChoices):
        ADD = "add", "Add"
        CONSUME = "consume", "Consume"
        ADJUST = "adjust", "Adjust"
        REMOVE = "remove", "Remove"
        MOVE = "move", "Move"

    class Source(models.TextChoices):
        MANUAL = "manual", "Manual"
        ORDER = "order", "Order"
        AI = "ai", "AI Suggestion"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    asset = models.ForeignKey(
        Asset,
        on_delete=models.CASCADE,
        related_name="transactions"
    )
    transaction_type = models.CharField(
        max_length=20,
        choices=TransactionType.choices
    )
    quantity_before = models.PositiveIntegerField(
        help_text="Quantity before the transaction"
    )
    quantity_after = models.PositiveIntegerField(
        help_text="Quantity after the transaction"
    )
    quantity_changed = models.IntegerField(
        help_text="Change in quantity (positive or negative)"
    )
    source = models.CharField(
        max_length=20,
        choices=Source.choices,
        default=Source.MANUAL
    )
    note = models.TextField(
        blank=True,
        help_text="Additional note about the transaction"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'asset_transactions'
        verbose_name = 'Asset Transaction'
        verbose_name_plural = 'Asset Transactions'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.transaction_type.title()} {abs(self.quantity_changed)} {self.asset.product.name}"

    @property
    def display_change(self):
        """Return formatted quantity change"""
        if self.quantity_changed > 0:
            return f"+{self.quantity_changed}"
        elif self.quantity_changed < 0:
            return str(self.quantity_changed)
        else:
            return "0"