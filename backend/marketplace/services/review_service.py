from typing import Any, Dict
from decimal import Decimal
from django.db import transaction, models
from django.db.models import Avg, Count
from django.core.exceptions import ValidationError, PermissionDenied

from ..models import MarketplacePost, MarketplaceReview, MarketplaceProfile
from .utils import get_instance, get_user
from .profile_service import ProfileService


class ReviewService:
    """
    Service handling Marketplace Reviews logic.
    """

    @staticmethod
    def _update_profile_rating(user: Any) -> MarketplaceProfile:
        """
        Recalculates profile rating, review count, and trust score.
        """
        user_obj = get_user(user)
        profile, _ = MarketplaceProfile.objects.get_or_create(user=user_obj)

        stats = MarketplaceReview.objects.filter(reviewee=user_obj).aggregate(
            avg_rating=Avg('rating'),
            count=Count('id')
        )
        avg_rating = stats['avg_rating'] or 0.0
        review_count = stats['count'] or 0

        profile.rating = Decimal(str(round(float(avg_rating), 2)))
        profile.review_count = review_count

        trust_bonus = int(review_count * 5 + float(avg_rating) * 10)
        profile.trust_score = min(100, 50 + trust_bonus) if profile.is_verified else min(80, trust_bonus)
        profile.save(update_fields=['rating', 'review_count', 'trust_score', 'updated_at'])

        return profile

    @classmethod
    @transaction.atomic
    def create_review(
        cls,
        post_or_id: Any,
        reviewer: Any,
        reviewee_or_id: Any,
        rating: int,
        comment: str = ''
    ) -> MarketplaceReview:
        """
        Creates or updates review for a user, then recalculates target profile stats.
        """
        reviewer_obj = get_user(reviewer)
        reviewee_obj = get_user(reviewee_or_id)
        post = get_instance(MarketplacePost, post_or_id)

        if reviewer_obj == reviewee_obj:
            raise ValidationError("You cannot review yourself.")

        if rating < 1 or rating > 5:
            raise ValidationError("Rating must be between 1 and 5.")

        review, created = MarketplaceReview.objects.update_or_create(
            post=post,
            reviewer=reviewer_obj,
            defaults={
                'reviewee': reviewee_obj,
                'rating': rating,
                'comment': comment
            }
        )

        cls._update_profile_rating(reviewee_obj)
        return review

    @classmethod
    @transaction.atomic
    def update_review(cls, review_or_id: Any, user: Any, **data) -> MarketplaceReview:
        """
        Updates existing review by reviewer and recalculates target profile stats.
        """
        user_obj = get_user(user)
        review = get_instance(MarketplaceReview, review_or_id)

        if review.reviewer != user_obj:
            raise PermissionDenied("You do not have permission to update this review.")

        if 'rating' in data:
            rating = int(data['rating'])
            if rating < 1 or rating > 5:
                raise ValidationError("Rating must be between 1 and 5.")
            review.rating = rating

        if 'comment' in data:
            review.comment = data['comment']

        review.save()
        cls._update_profile_rating(review.reviewee)
        return review

    @classmethod
    @transaction.atomic
    def delete_review(cls, review_or_id: Any, user: Any) -> bool:
        """
        Deletes review and updates reviewee profile stats.
        """
        user_obj = get_user(user)
        review = get_instance(MarketplaceReview, review_or_id)

        if review.reviewer != user_obj:
            raise PermissionDenied("You do not have permission to delete this review.")

        reviewee = review.reviewee
        review.delete()
        cls._update_profile_rating(reviewee)
        return True

    @classmethod
    def get_user_reviews(cls, user_or_id: Any, as_reviewee: bool = True) -> models.QuerySet:
        """
        Gets reviews received or written by a user.
        """
        user_obj = get_user(user_or_id)
        filter_kwargs = {'reviewee': user_obj} if as_reviewee else {'reviewer': user_obj}

        return MarketplaceReview.objects.filter(**filter_kwargs).select_related(
            'reviewer', 'reviewer__marketplace_profile',
            'reviewee', 'reviewee__marketplace_profile',
            'post'
        ).order_by('-created_at')

    @classmethod
    def get_review_summary(cls, user_or_id: Any) -> Dict[str, Any]:
        """
        Calculates review summary stats including rating distribution for a user.
        """
        user_obj = get_user(user_or_id)
        reviews = MarketplaceReview.objects.filter(reviewee=user_obj)

        total_reviews = reviews.count()
        avg_rating = reviews.aggregate(avg=Avg('rating'))['avg'] or 0.0

        distribution = {
            1: reviews.filter(rating=1).count(),
            2: reviews.filter(rating=2).count(),
            3: reviews.filter(rating=3).count(),
            4: reviews.filter(rating=4).count(),
            5: reviews.filter(rating=5).count(),
        }

        profile = ProfileService.get_profile(user_obj)

        return {
            'total_reviews': total_reviews,
            'average_rating': round(float(avg_rating), 2),
            'rating_distribution': distribution,
            'trust_score': profile.trust_score,
            'is_verified': profile.is_verified,
        }
