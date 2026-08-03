from typing import Any, Optional
from django.db import transaction, models
from ..models import MarketplaceProfile
from .utils import get_user
from .feed_service import FeedService


class ProfileService:
    """
    Service handling Marketplace Profile logic.
    """

    @classmethod
    def get_profile(cls, user_or_id: Any) -> MarketplaceProfile:
        """
        Retrieves or creates MarketplaceProfile for user.
        """
        user_obj = get_user(user_or_id)
        profile, _ = MarketplaceProfile.objects.select_related('user').get_or_create(user=user_obj)
        return profile

    @classmethod
    @transaction.atomic
    def update_profile(cls, user: Any, **data) -> MarketplaceProfile:
        """
        Updates MarketplaceProfile fields for user.
        """
        profile = cls.get_profile(user)

        updatable_fields = ['bio', 'avatar', 'location_name', 'latitude', 'longitude', 'seller_type']
        fields_to_save = []

        for field in updatable_fields:
            if field in data:
                setattr(profile, field, data[field])
                fields_to_save.append(field)

        if fields_to_save:
            fields_to_save.append('updated_at')
            profile.save(update_fields=fields_to_save)

        return profile

    @classmethod
    def get_profile_posts(cls, user_or_id: Any, status: Optional[str] = None) -> models.QuerySet:
        """
        Retrieves all posts created by a profile owner.
        """
        return FeedService.get_user_posts(user_or_id, status=status)

    @classmethod
    def update_location(cls, user: Any, location_name: str, latitude: float, longitude: float) -> MarketplaceProfile:
        """
        Updates user's geographical location coordinates and location name.
        """
        profile = cls.get_profile(user)
        profile.location_name = location_name
        profile.latitude = latitude
        profile.longitude = longitude
        profile.save(update_fields=['location_name', 'latitude', 'longitude', 'updated_at'])
        return profile

    @classmethod
    def verify_profile(cls, profile_or_user: Any) -> MarketplaceProfile:
        """
        Marks marketplace profile as verified and boosts trust score.
        """
        if isinstance(profile_or_user, MarketplaceProfile):
            profile = profile_or_user
        else:
            profile = cls.get_profile(profile_or_user)

        profile.is_verified = True
        profile.trust_score = min(100, profile.trust_score + 30)
        profile.save(update_fields=['is_verified', 'trust_score', 'updated_at'])
        return profile
