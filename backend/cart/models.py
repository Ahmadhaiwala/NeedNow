from django.db import models
from users.models import User
from catalog.models import Product

class Cart(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="carts"
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s cart"

class CartItem(models.Model):
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name="items"
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE
    )

    quantity = models.PositiveIntegerField(default=1)

    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("cart", "product")

class CartCollaborator(models.Model):
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name="collaborators"
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    role = models.CharField(
        max_length=20,
        choices=[
            ("owner", "Owner"),
            ("editor", "Editor"),
            ("viewer", "Viewer")
        ]
    )
