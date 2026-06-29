from django.db import models
from django.utils import timezone
from users.models import User
import uuid


class Category(models.Model):
    """
    Product categories for organization
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Icon name or emoji")
    parent = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='subcategories'
    )
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'Categories'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Product(models.Model):
    """
    Master product catalog
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    brand = models.CharField(max_length=100, blank=True)
    
    # Product specifications
    unit = models.CharField(
        max_length=20,
        choices=[
            ('piece', 'Piece'),
            ('kg', 'Kilogram'),
            ('g', 'Gram'),
            ('l', 'Liter'),
            ('ml', 'Milliliter'),
            ('pack', 'Pack'),
            ('bottle', 'Bottle'),
            ('can', 'Can'),
            ('box', 'Box')
        ],
        default='piece'
    )
    
    # AI-related fields
    common_names = models.JSONField(
        default=list,
        help_text="Alternative names AI can recognize"
    )
    typical_shelf_life_days = models.PositiveIntegerField(
        null=True, 
        blank=True,
        help_text="Typical shelf life in days"
    )
    
    # Metadata
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'products'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.brand})" if self.brand else self.name


class UserInventory(models.Model):
    """
    User's personal inventory/pantry
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='inventory')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    
    # Inventory details
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    unit = models.CharField(max_length=20, blank=True)  # Override product unit if needed
    
    # Expiry tracking
    purchase_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    
    # Location in house
    storage_location = models.CharField(
        max_length=50,
        blank=True,
        help_text="Kitchen, Fridge, Pantry, etc."
    )
    
    # AI learning data
    avg_consumption_per_day = models.DecimalField(
        max_digits=6, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="AI calculated average daily consumption"
    )
    last_used_date = models.DateField(null=True, blank=True)
    
    # Status
    is_running_low = models.BooleanField(default=False)
    minimum_threshold = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=1,
        help_text="Alert when quantity falls below this"
    )
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_inventory'
        unique_together = ['user', 'product']
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"{self.user.display_name} - {self.product.name} ({self.quantity})"
    
    @property
    def estimated_days_remaining(self):
        """Calculate estimated days until product runs out"""
        if self.avg_consumption_per_day and self.avg_consumption_per_day > 0:
            return int(self.quantity / self.avg_consumption_per_day)
        return None
    
    @property
    def is_expired(self):
        """Check if product has expired"""
        if self.expiry_date:
            return self.expiry_date < timezone.now().date()
        return False
    
    @property
    def days_until_expiry(self):
        """Days until expiry"""
        if self.expiry_date:
            delta = self.expiry_date - timezone.now().date()
            return delta.days
        return None


class InventoryTransaction(models.Model):
    """
    Track inventory changes for AI learning
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    inventory_item = models.ForeignKey(UserInventory, on_delete=models.CASCADE)
    
    transaction_type = models.CharField(
        max_length=20,
        choices=[
            ('add', 'Added to inventory'),
            ('use', 'Used/Consumed'),
            ('expire', 'Expired/Wasted'),
            ('adjust', 'Manual adjustment')
        ]
    )
    
    quantity_changed = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="Positive for additions, negative for usage"
    )
    quantity_after = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Context for AI learning
    context = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional context like 'cooking pasta', 'breakfast', etc."
    )
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'inventory_transactions'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.display_name} - {self.transaction_type} {self.inventory_item.product.name}"


class ShoppingList(models.Model):
    """
    AI-generated or manual shopping lists
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shopping_lists')
    
    name = models.CharField(max_length=200, default="Shopping List")
    description = models.TextField(blank=True)
    
    # AI context
    ai_prompt = models.TextField(
        blank=True,
        help_text="Original user request that generated this list"
    )
    ai_reasoning = models.JSONField(
        default=dict,
        blank=True,
        help_text="AI's reasoning process and follow-up questions"
    )
    
    # Budget and constraints
    budget_limit = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True
    )
    estimated_total = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('draft', 'Draft'),
            ('active', 'Active'),
            ('shopping', 'Currently Shopping'),
            ('completed', 'Completed'),
            ('cancelled', 'Cancelled')
        ],
        default='draft'
    )
    
    # Group shopping
    is_shared = models.BooleanField(default=False)
    share_code = models.CharField(max_length=10, blank=True, unique=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'shopping_lists'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.display_name} - {self.name}"
    
    def generate_share_code(self):
        """Generate unique share code for group shopping"""
        import random
        import string
        
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            if not ShoppingList.objects.filter(share_code=code).exists():
                self.share_code = code
                self.is_shared = True
                self.save()
                return code


class ShoppingListItem(models.Model):
    """
    Individual items in shopping lists
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    shopping_list = models.ForeignKey(
        ShoppingList, 
        on_delete=models.CASCADE, 
        related_name='items'
    )
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=20, blank=True)
    
    # AI categorization
    priority = models.CharField(
        max_length=20,
        choices=[
            ('essential', 'Essential'),
            ('optional', 'Optional'),
            ('luxury', 'Luxury')
        ],
        default='optional'
    )
    
    # Pricing
    estimated_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True
    )
    actual_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True
    )
    
    # Status
    is_completed = models.BooleanField(default=False)
    added_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True,
        help_text="User who added this item (for group shopping)"
    )
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'shopping_list_items'
        ordering = ['priority', 'created_at']
    
    def __str__(self):
        return f"{self.shopping_list.name} - {self.product.name}"