from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

# -------------------------------------------------
# Marketplace Profile
# -------------------------------------------------

class MarketplaceProfile(models.Model):
    SELLER_TYPES = [
        ("individual", "Individual"),
        ("student", "Student"),
        ("home_business", "Home Business"),
        ("verified_business", "Verified Business"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="marketplace_profile"
    )

    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to="marketplace/profile/", null=True, blank=True)

    location_name = models.CharField(max_length=255, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    seller_type = models.CharField(
        max_length=30,
        choices=SELLER_TYPES,
        default="individual"
    )

    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    review_count = models.PositiveIntegerField(default=0)
    trust_score = models.PositiveIntegerField(default=0)

    is_verified = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


# -------------------------------------------------
# Marketplace Posts
# -------------------------------------------------

class MarketplacePost(models.Model):

    POST_TYPES = [
        ("sell", "Sell"),
        ("need", "Need"),
        ("rent", "Rent"),
        ("exchange", "Exchange"),
        ("donate", "Donate"),
        ("service", "Service"),
    ]

    STATUS_CHOICES = [
        ("active", "Active"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
        ("expired", "Expired"),
    ]

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="marketplace_posts"
    )

    post_type = models.CharField(max_length=20, choices=POST_TYPES)

    # Keep simple for MVP
    category = models.CharField(max_length=100)

    title = models.CharField(max_length=255)
    description = models.TextField()

    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    budget = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    condition = models.CharField(max_length=50, blank=True)
    urgency = models.CharField(max_length=30, blank=True)

    visibility_radius = models.FloatField(default=5)

    location_name = models.CharField(max_length=255)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)

    expires_at = models.DateTimeField(null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class MarketplacePostImage(models.Model):
    post = models.ForeignKey(
        MarketplacePost,
        on_delete=models.CASCADE,
        related_name="images"
    )

    image = models.ImageField(upload_to="marketplace/posts/")
    display_order = models.PositiveIntegerField(default=0)


# -------------------------------------------------
# Marketplace Offer
# -------------------------------------------------

class MarketplaceOffer(models.Model):

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
        ("withdrawn", "Withdrawn"),
    ]

    post = models.ForeignKey(
        MarketplacePost,
        on_delete=models.CASCADE,
        related_name="offers"
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="marketplace_offers"
    )

    price = models.DecimalField(max_digits=10, decimal_places=2)
    message = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending"
    )

    created_at = models.DateTimeField(auto_now_add=True)


# -------------------------------------------------
# Comments
# -------------------------------------------------

class MarketplaceComment(models.Model):
    post = models.ForeignKey(
        MarketplacePost,
        on_delete=models.CASCADE,
        related_name="comments"
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )

    comment = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)


# -------------------------------------------------
# Chat
# -------------------------------------------------

class ChatMessage(models.Model):

    post = models.ForeignKey(
        MarketplacePost,
        on_delete=models.CASCADE,
        related_name="chat_messages",
        null=True,
        blank=True
    )

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_messages"
    )

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_messages"
    )

    content = models.TextField(blank=True)

    image = models.ImageField(
        upload_to="marketplace/chat/",
        null=True,
        blank=True
    )

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)


# -------------------------------------------------
# Reviews
# -------------------------------------------------

class MarketplaceReview(models.Model):

    post = models.ForeignKey(
        MarketplacePost,
        on_delete=models.CASCADE,
        related_name="reviews"
    )

    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reviews_written"
    )

    reviewee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reviews_received"
    )

    rating = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )

    comment = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)