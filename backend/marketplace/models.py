from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

class MarketplaceProfile(models.Model):
    """
    Profile information for users participating in the Community Marketplace.
    Keeps bio, geo-coordinates, and review statistics separate from core auth data.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='marketplace_profile',
        help_text="The core authenticated user linked to this marketplace profile."
    )
    bio = models.TextField(
        blank=True,
        help_text="A short bio introducing the user to the local marketplace community."
    )
    location_name = models.CharField(
        max_length=255,
        blank=True,
        help_text="Text representation of the user's primary marketplace location."
    )
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        help_text="Latitude coordinate for radius calculations."
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        help_text="Longitude coordinate for radius calculations."
    )
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0.00,
        help_text="Average rating calculated from reviews received."
    )
    review_count = models.PositiveIntegerField(
        default=0,
        help_text="Total number of reviews received."
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the marketplace profile was created."
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when the profile details were last updated."
    )

    class Meta:
        db_table = 'marketplace_profiles'
        verbose_name = 'Marketplace Profile'
        verbose_name_plural = 'Marketplace Profiles'

    def __str__(self):
        return f"{self.user.email}'s Marketplace Profile"


class MarketplacePost(models.Model):
    """
    Unified model for Marketplace posts (both Needs and Sells).
    Allows single geographic queries for nearby feeds.
    """
    POST_TYPES = [
        ('need', 'Need'),
        ('sell', 'Sell'),
    ]
    
    URGENCY_CHOICES = [
        ('today', 'Today'),
        ('week', 'This Week'),
        ('flexible', 'Flexible'),
    ]
    
    CONDITION_CHOICES = [
        ('new', 'New'),
        ('like_new', 'Like New'),
        ('good', 'Good'),
        ('fair', 'Fair'),
        ('poor', 'Poor'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='marketplace_posts',
        help_text="The user who created this post."
    )
    post_type = models.CharField(
        max_length=10,
        choices=POST_TYPES,
        help_text="Whether this is a request (Need) or a listing (Sell)."
    )
    title = models.CharField(
        max_length=255,
        help_text="Short title of the post (e.g., 'Need Physics book today')."
    )
    description = models.TextField(
        help_text="Detailed description of the item needed or being sold."
    )
    category = models.CharField(
        max_length=100,
        help_text="Category of the item (e.g., Books, Electronics, Home, etc.)."
    )
    images = models.JSONField(
        default=list,
        blank=True,
        help_text="List of image URLs associated with the post."
    )
    location_name = models.CharField(
        max_length=255,
        help_text="Text representation of the location where the post is active."
    )
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        help_text="Latitude coordinates of the location."
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        help_text="Longitude coordinates of the location."
    )
    radius = models.FloatField(
        default=5.0,
        help_text="Proximity radius in kilometers for matching nearby feeds."
    )
    
    # Specific fields for 'need' posts
    urgency = models.CharField(
        max_length=20,
        choices=URGENCY_CHOICES,
        blank=True,
        help_text="Urgency of the need (Only applicable for Need posts)."
    )
    budget = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Max budget limit (Only applicable/optional for Need posts)."
    )
    
    # Specific fields for 'sell' posts
    condition = models.CharField(
        max_length=20,
        choices=CONDITION_CHOICES,
        blank=True,
        help_text="Condition of the item (Only applicable for Sell posts)."
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Selling price of the item (Only applicable for Sell posts)."
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
        help_text="Current state of the listing/need."
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the post was created."
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when the post was last modified."
    )

    class Meta:
        db_table = 'marketplace_posts'
        verbose_name = 'Marketplace Post'
        verbose_name_plural = 'Marketplace Posts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['post_type']),
            models.Index(fields=['status']),
            models.Index(fields=['latitude', 'longitude']),
        ]

    def __str__(self):
        type_label = dict(self.POST_TYPES).get(self.post_type, self.post_type)
        return f"[{type_label}] {self.title} by {self.owner.email}"


class MarketplaceOffer(models.Model):
    """
    Represents an offer or bid made on a MarketplacePost.
    For a Need post, it is an offer to supply/sell.
    For a Sell post, it is a buying bid.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]

    post = models.ForeignKey(
        MarketplacePost,
        on_delete=models.CASCADE,
        related_name='offers',
        help_text="The post this offer is responding to."
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='marketplace_offers',
        help_text="The user making the offer."
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="The proposed price for the transaction."
    )
    message = models.TextField(
        help_text="Detailed message/proposal from the offer maker."
    )
    images = models.JSONField(
        default=list,
        blank=True,
        help_text="Optional list of image URLs showing the item condition."
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text="Current state of the offer."
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the offer was made."
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when the offer state was last changed."
    )

    class Meta:
        db_table = 'marketplace_offers'
        verbose_name = 'Marketplace Offer'
        verbose_name_plural = 'Marketplace Offers'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"Offer of {self.price} on '{self.post.title}' by {self.user.email}"


class ChatMessage(models.Model):
    """
    Represents a single chat message sent between two users.
    Optionally associated with a MarketplacePost to group chat threads by item.
    """
    post = models.ForeignKey(
        MarketplacePost,
        on_delete=models.CASCADE,
        related_name='chat_messages',
        null=True,
        blank=True,
        help_text="The post this chat thread belongs to (optional)."
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages',
        help_text="The user who sent this message."
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_messages',
        help_text="The user who receives this message."
    )
    content = models.TextField(
        blank=True,
        help_text="Text content of the message."
    )
    image_url = models.URLField(
        blank=True,
        null=True,
        help_text="Optional URL of an image shared in the chat."
    )
    is_read = models.BooleanField(
        default=False,
        help_text="Whether the message has been read by the recipient."
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the message was sent."
    )

    class Meta:
        db_table = 'marketplace_chat_messages'
        verbose_name = 'Chat Message'
        verbose_name_plural = 'Chat Messages'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['sender', 'recipient']),
            models.Index(fields=['created_at']),
            models.Index(fields=['is_read']),
        ]

    def __str__(self):
        return f"Message from {self.sender.email} to {self.recipient.email} at {self.created_at}"


class MarketplaceReview(models.Model):
    """
    Review left by one user for another regarding a specific deal/post.
    """
    post = models.ForeignKey(
        MarketplacePost,
        on_delete=models.CASCADE,
        related_name='reviews',
        help_text="The deal/post this review is associated with."
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews_written',
        help_text="The user leaving the review."
    )
    reviewee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews_received',
        help_text="The user being rated/reviewed."
    )
    rating = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating score from 1 to 5 stars."
    )
    comment = models.TextField(
        blank=True,
        help_text="Review comment or description."
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the review was created."
    )

    class Meta:
        db_table = 'marketplace_reviews'
        verbose_name = 'Marketplace Review'
        verbose_name_plural = 'Marketplace Reviews'
        ordering = ['-created_at']
        unique_together = ('post', 'reviewer')

    def __str__(self):
        return f"Review by {self.reviewer.email} for {self.reviewee.email} ({self.rating}/5)"


# Signal handlers for automatic rating and review count updates
from django.db.models import Avg
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

def update_reviewee_rating(reviewee):
    """Recalculate and save average rating and total review count for a reviewee."""
    profile, _ = MarketplaceProfile.objects.get_or_create(user=reviewee)
    reviews = MarketplaceReview.objects.filter(reviewee=reviewee)
    stats = reviews.aggregate(
        avg_rating=Avg('rating'),
        total_count=models.Count('id')
    )
    profile.rating = stats['avg_rating'] or 0.00
    profile.review_count = stats['total_count'] or 0
    profile.save()

@receiver(post_save, sender=MarketplaceReview)
def update_rating_on_save(sender, instance, **kwargs):
    """Update reviewee's rating stats when a review is created or updated."""
    update_reviewee_rating(instance.reviewee)

@receiver(post_delete, sender=MarketplaceReview)
def update_rating_on_delete(sender, instance, **kwargs):
    """Update reviewee's rating stats when a review is deleted."""
    update_reviewee_rating(instance.reviewee)





