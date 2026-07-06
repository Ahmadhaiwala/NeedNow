from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
import uuid

class UserManager(BaseUserManager):
    """Custom user manager for the User model"""
    
    def create_user(self, email, password=None, **extra_fields):
        """Create and return a regular user with an email and password"""
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """Create and return a superuser with an email and password"""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
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
    is_staff = models.BooleanField(
        default=False,
        help_text="Whether the user can access admin interface"
    )
    
    # Required fields for Django auth
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    objects = UserManager()
    
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
    
    # Authentication interface methods required by Django REST Framework
    @property
    def is_authenticated(self):
        """Always return True for authenticated users"""
        return True
    
    @property
    def is_anonymous(self):
        """Always return False for authenticated users"""
        return False
    
    def get_username(self):
        """Return the username identifying this user"""
        return self.email