from typing import Any, Dict, Optional
from django.db import models
from django.db.models import Count
from django.core.exceptions import ValidationError

from ..models import MarketplacePost
from .utils import get_user, filter_by_distance, apply_search, paginate_queryset


class FeedService:
    """
    Service handling Marketplace Feed logic.
    """

    @classmethod
    def _apply_feed_filters(
        cls,
        queryset: models.QuerySet,
        category: Optional[str] = None,
        post_type: Optional[str] = None,
        search: Optional[str] = None,
        user: Any = None,
        exclude_own: bool = True
    ) -> models.QuerySet:
        if exclude_own and user:
            user_obj = get_user(user)
            queryset = queryset.exclude(owner=user_obj)

        if category and category != 'All':
            queryset = queryset.filter(category__iexact=category)

        if post_type:
            queryset = queryset.filter(post_type=post_type)

        if search:
            queryset = apply_search(queryset, search)

        return queryset

    @classmethod
    def get_feed(
        cls,
        user: Any = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        radius_km: Optional[float] = None,
        category: Optional[str] = None,
        post_type: Optional[str] = None,
        search: Optional[str] = None,
        exclude_own: bool = True,
        status: str = "active",
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        """
        Retrieves marketplace feed with optimized ORM prefetching, distance calculation, and pagination.
        """
        queryset = MarketplacePost.objects.filter(status=status).select_related(
            'owner', 'owner__marketplace_profile'
        ).prefetch_related(
            'images', 'offers'
        ).annotate(
            annotated_offers_count=Count('offers')
        )

        queryset = cls._apply_feed_filters(
            queryset, category=category, post_type=post_type, search=search, user=user, exclude_own=exclude_own
        )

        if latitude is not None and longitude is not None:
            queryset = filter_by_distance(queryset, latitude, longitude, radius_km=radius_km)
        else:
            queryset = queryset.order_by('-created_at')

        return paginate_queryset(queryset, page=page, page_size=page_size)

    @classmethod
    def get_post(cls, post_id: Any) -> MarketplacePost:
        """
        Retrieves a single marketplace post by ID with optimized related object fetching.
        """
        try:
            return MarketplacePost.objects.select_related(
                'owner', 'owner__marketplace_profile'
            ).prefetch_related(
                'images', 'offers', 'comments', 'comments__user'
            ).annotate(
                annotated_offers_count=Count('offers'),
                annotated_comments_count=Count('comments')
            ).get(id=post_id)
        except MarketplacePost.DoesNotExist:
            raise ValidationError(f"MarketplacePost with ID {post_id} does not exist.")

    @classmethod
    def get_nearby_posts(
        cls,
        latitude: float,
        longitude: float,
        radius_km: float = 10.0,
        category: Optional[str] = None,
        post_type: Optional[str] = None,
        user: Any = None
    ) -> models.QuerySet:
        """
        Retrieves active posts located within radius_km of given latitude/longitude.
        """
        queryset = MarketplacePost.objects.filter(status="active").select_related(
            'owner', 'owner__marketplace_profile'
        ).prefetch_related('images')

        if user:
            user_obj = get_user(user)
            queryset = queryset.exclude(owner=user_obj)

        if category and category != 'All':
            queryset = queryset.filter(category__iexact=category)

        if post_type:
            queryset = queryset.filter(post_type=post_type)

        return filter_by_distance(queryset, latitude, longitude, radius_km=radius_km)

    @classmethod
    def get_posts_by_category(cls, category: str, user: Any = None, status: str = "active") -> models.QuerySet:
        """
        Retrieves posts filtered by category.
        """
        queryset = MarketplacePost.objects.filter(
            category__iexact=category, status=status
        ).select_related('owner', 'owner__marketplace_profile').prefetch_related('images')

        if user:
            queryset = queryset.exclude(owner=get_user(user))

        return queryset.order_by('-created_at')

    @classmethod
    def get_posts_by_type(cls, post_type: str, user: Any = None, status: str = "active") -> models.QuerySet:
        """
        Retrieves posts filtered by post type (sell, need, rent, exchange, donate, service).
        """
        queryset = MarketplacePost.objects.filter(
            post_type=post_type, status=status
        ).select_related('owner', 'owner__marketplace_profile').prefetch_related('images')

        if user:
            queryset = queryset.exclude(owner=get_user(user))

        return queryset.order_by('-created_at')

    @classmethod
    def get_user_posts(cls, user: Any, status: Optional[str] = None) -> models.QuerySet:
        """
        Retrieves all posts created by a specific user.
        """
        user_obj = get_user(user)
        queryset = MarketplacePost.objects.filter(owner=user_obj).select_related(
            'owner', 'owner__marketplace_profile'
        ).prefetch_related('images', 'offers').annotate(
            annotated_offers_count=Count('offers')
        )

        if status:
            queryset = queryset.filter(status=status)

        return queryset.order_by('-created_at')

    @classmethod
    def search_posts(cls, query: str, user: Any = None, status: str = "active") -> models.QuerySet:
        """
        Searches posts matching title, description, or category.
        """
        queryset = MarketplacePost.objects.filter(status=status).select_related(
            'owner', 'owner__marketplace_profile'
        ).prefetch_related('images')

        if user:
            queryset = queryset.exclude(owner=get_user(user))

        return apply_search(queryset, query).order_by('-created_at')
