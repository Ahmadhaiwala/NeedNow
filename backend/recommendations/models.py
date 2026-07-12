from django.db import models
from catalog.models import Product
from users.models import User


class InteractionType(models.TextChoices):
    VIEW = "view", "View"
    CLICK = "click", "Click"
    CART = "cart", "Cart"
    WISHLIST = "wishlist", "Wishlist"
    PURCHASE = "purchase", "Purchase"
    RATING = "rating", "Rating"
    SEARCH = "search", "Search"


class UserInteraction(models.Model):
    """
    Records every user interaction event for the recommendation engine.
    Each event is a single row: one user, one interaction type, one optional product.
    """

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="interactions"
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="interactions"
    )

    interaction_type = models.CharField(
        max_length=20,
        choices=InteractionType.choices
    )

    # Weighted signal strength: view=1, click=2, cart=3, wishlist=2.5, purchase=5, rating=varies
    value = models.FloatField(default=1.0)

    # Optional extra context (e.g. search query, rating score, page URL, session info)
    metadata = models.JSONField(
        default=dict,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["product"]),
            models.Index(fields=["interaction_type"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["user", "interaction_type"]),
            models.Index(fields=["user", "product"]),
        ]

    def __str__(self):
        product_str = self.product.name if self.product else "N/A"
        return f"{self.user} → {self.interaction_type} → {product_str}"


class UserPreference(models.Model):
    """
    Aggregated preference scores per user, updated by the recommendation engine.
    """

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="preference"
    )

    category_scores = models.JSONField(default=dict)

    brand_scores = models.JSONField(default=dict)

    tag_scores = models.JSONField(default=dict)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Preferences for {self.user}"