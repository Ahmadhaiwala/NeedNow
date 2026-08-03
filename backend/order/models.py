from django.db import models
from django.conf import settings
from catalog.models import Product


class Order(models.Model):

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PLACED = "placed", "Placed"
        CONFIRMED = "confirmed", "Confirmed"
        PROCESSING = "processing", "Processing"
        SHIPPED = "shipped", "Shipped"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"
        REFUNDED = "refunded", "Refunded"

    class PaymentStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PARTIALLY_PAID = "partially_paid", "Partially Paid"
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"
        REFUNDED = "refunded", "Refunded"

    class Platform(models.TextChoices):
        NEEDNOW = "neednow", "NeedNow"
        AMAZON = "amazon", "Amazon"
        FLIPKART = "flipkart", "Flipkart"
        BLINKIT = "blinkit", "Blinkit"
        ZEPTO = "zepto", "Zepto"
        INSTAMART = "instamart", "Instamart"
        SWIGGY = "swiggy", "Swiggy"
        ZOMATO = "zomato", "Zomato"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="orders"
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING
    )

    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    currency = models.CharField(
        max_length=10,
        default="INR"
    )

    platform = models.CharField(
        max_length=20,
        choices=Platform.choices,
        default=Platform.NEEDNOW
    )

    external_order_id = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order #{self.id} - {self.user.username}"


class OrderItem(models.Model):

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items"
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    quantity = models.PositiveIntegerField(default=1)

    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    total_price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    added_by_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="added_order_items"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)

    def __str__(self):
        product_name = self.product.name if self.product else "Deleted Product"
        return f"{product_name} x {self.quantity}"


class OrderCollaborator(models.Model):

    class Role(models.TextChoices):
        OWNER = "owner", "Owner"
        EDITOR = "editor", "Editor"
        VIEWER = "viewer", "Viewer"

    class SplitType(models.TextChoices):
        EQUAL = "equal", "Equal"
        CUSTOM = "custom", "Custom"
        ITEMWISE = "itemwise", "Item Wise"
        PERCENTAGE = "percentage", "Percentage"

    class CollaboratorPaymentStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="collaborators"
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="collaborative_orders"
    )

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.VIEWER
    )

    split_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    split_type = models.CharField(
        max_length=20,
        choices=SplitType.choices,
        default=SplitType.EQUAL
    )

    payment_status = models.CharField(
        max_length=20,
        choices=CollaboratorPaymentStatus.choices,
        default=CollaboratorPaymentStatus.PENDING
    )

    paid_at = models.DateTimeField(
        blank=True,
        null=True
    )

    class Meta:
        unique_together = ("order", "user")

    def __str__(self):
        return f"{self.user.username} - {self.order.id}"