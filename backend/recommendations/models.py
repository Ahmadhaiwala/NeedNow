from django.db import models
from catalog.models import Product
from users.models import User
from pgvector.django import VectorField


class InteractionType(models.TextChoices):
    VIEW = "view", "View"
    CLICK = "click", "Click"
    CART = "cart", "Cart"
    WISHLIST = "wishlist", "Wishlist"
    PURCHASE = "purchase", "Purchase"
    RATING = "rating", "Rating"
    SEARCH = "search", "Search"
    REMOVE_CART = "remove_cart", "Remove Cart"
    UPDATE_CART = "update_cart", "Update Cart"
    REMOVE_WISHLIST = "remove_wishlist", "Remove Wishlist"


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

    session_id = models.CharField(
    max_length=100,
    blank=True
)

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


class UserEmbedding(models.Model):

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="embedding"
    )

    embedding = VectorField(dimensions=384)

    model_name = models.CharField(
        max_length=100,
        default="all-MiniLM-L6-v2"
    )

    updated_at = models.DateTimeField(auto_now=True)


class ProductEmbedding(models.Model):

    product = models.OneToOneField(
        Product,
        on_delete=models.CASCADE,
        related_name="embedding"
    )

    embedding = VectorField(
        dimensions=384
    )

    model_name = models.CharField(
        max_length=100,
        default="all-MiniLM-L6-v2"
    )

    embedding_version = models.IntegerField(
        default=1
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        indexes = [
            # We'll add ANN indexes later
        ]

class Recommendation(models.Model):

    user = models.ForeignKey(User, on_delete=models.CASCADE)

    product = models.ForeignKey(Product, on_delete=models.CASCADE)

    score = models.FloatField()

    reason = models.JSONField(default=dict)

    created_at = models.DateTimeField(auto_now_add=True)
    
    
    class Meta:
        constraints = [
    models.UniqueConstraint(
        fields=["user", "product"],
        name="unique_user_product_recommendation"
    )
]
        indexes = [
        models.Index(fields=["user"]),
        models.Index(fields=["score"]),
    ]