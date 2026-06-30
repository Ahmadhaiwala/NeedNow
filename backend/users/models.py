from django.db import models
from django.utils import timezone
import uuid

class User(models.Model):
    """
    User model for NeedNow - Neon Auth integration
    This model syncs with Neon Auth's Better Auth backend
    """
    # Primary identifier - use UUID for Neon compatibility
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique user identifier"
    )
    
    # Neon Auth fields (synced from Neon Auth)
    neon_auth_id = models.CharField(
        max_length=255,
        unique=True,
        null=True,
        blank=True,
        help_text="Neon Auth user ID"
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        default=timezone.now,
        help_text="When the user account was created"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="When the user profile was last updated"
    )
    
    # Basic Profile Information (synced from Neon Auth)
    email = models.EmailField(
        unique=True,
        help_text="User's primary email address"
    )
    first_name = models.CharField(
        max_length=100,
        blank=True,
        help_text="User's first name"
    )
    last_name = models.CharField(
        max_length=100,
        blank=True,
        help_text="User's last name"
    )
    username = models.CharField(
        max_length=50,
        unique=True,
        blank=True,
        null=True,
        help_text="Unique username (optional)"
    )
    profile_image_url = models.URLField(
        blank=True,
        help_text="URL to user's profile image"
    )
    
    # Auth provider info
    provider = models.CharField(
        max_length=50,
        default='neon-auth',
        help_text="Authentication provider (google, github, etc.)"
    )
    
    # Status
    is_active = models.BooleanField(
        default=True,
        help_text="Whether the user account is active"
    )
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}".strip() or self.email
    
    @property
    def full_name(self):
        """Return user's full name"""
        return f"{self.first_name} {self.last_name}".strip()
    
    @property
    def display_name(self):
        """Return the best display name for the user"""
        if self.full_name:
            return self.full_name
        elif self.username:
            return self.username
        return self.email.split('@')[0]