from typing import Any, Dict, Union
from decimal import Decimal
from django.db import transaction, models
from django.core.exceptions import ValidationError, PermissionDenied

from ..models import MarketplacePost, MarketplaceOffer
from .utils import get_instance, get_user


class OfferService:
    """
    Service handling Marketplace Offers logic.
    """

    @staticmethod
    def validate_offer(data: Dict[str, Any]) -> bool:
        """
        Validates offer creation/update payload.
        """
        errors = {}
        price = data.get('price')
        if price is None:
            errors['price'] = "Price is required for an offer."
        else:
            try:
                if float(price) < 0:
                    errors['price'] = "Offer price cannot be negative."
            except (ValueError, TypeError):
                errors['price'] = "Offer price must be a valid number."

        message = data.get('message')
        # Treat blank/empty message as None (not provided)
        if message is not None and str(message).strip() == '':
            data['message'] = None

        if errors:
            raise ValidationError(errors)

        return True

    @classmethod
    @transaction.atomic
    def create_offer(cls, post_or_id: Any, user: Any, price: Union[float, Decimal], message: str) -> MarketplaceOffer:
        """
        Submits a new offer for a post. Validates status, ownership, and offer data.
        """
        user_obj = get_user(user)
        post = get_instance(MarketplacePost, post_or_id)

        if post.status != 'active':
            raise ValidationError("Cannot make an offer on an inactive post.")

        # TODO: Re-enable in production
        # if post.owner == user_obj:
        #     raise ValidationError("You cannot submit an offer on your own post.")

        cls.validate_offer({'price': price, 'message': message})

        offer = MarketplaceOffer.objects.create(
            post=post,
            user=user_obj,
            price=price,
            message=message,
            status='pending'
        )
        return offer

    @classmethod
    def update_offer(cls, offer_or_id: Any, user: Any, **data) -> MarketplaceOffer:
        """
        Updates price/message of a pending offer by offer author.
        """
        user_obj = get_user(user)
        offer = get_instance(MarketplaceOffer, offer_or_id)

        if offer.user != user_obj:
            raise PermissionDenied("You do not have permission to update this offer.")

        if offer.status != 'pending':
            raise ValidationError("Only pending offers can be updated.")

        if 'price' in data:
            offer.price = data['price']
        if 'message' in data:
            offer.message = data['message']

        cls.validate_offer({'price': offer.price, 'message': offer.message})
        offer.save()
        return offer

    @classmethod
    def withdraw_offer(cls, offer_or_id: Any, user: Any) -> MarketplaceOffer:
        """
        Withdraws a pending offer by offer creator.
        """
        user_obj = get_user(user)
        offer = get_instance(MarketplaceOffer, offer_or_id)

        if offer.user != user_obj:
            raise PermissionDenied("You do not have permission to withdraw this offer.")

        if offer.status != 'pending':
            raise ValidationError("Only pending offers can be withdrawn.")

        offer.status = 'withdrawn'
        offer.save(update_fields=['status'])
        return offer

    @classmethod
    def accept_offer(cls, offer_or_id: Any, user: Any) -> MarketplaceOffer:
        """
        Accepts an offer using atomic transaction and row locking. Automatically rejects
        competing pending offers on the same post.
        """
        user_obj = get_user(user)

        with transaction.atomic():
            offer_id = offer_or_id.id if isinstance(offer_or_id, MarketplaceOffer) else offer_or_id
            try:
                offer = MarketplaceOffer.objects.select_for_update().select_related('post', 'post__owner').get(id=offer_id)
            except MarketplaceOffer.DoesNotExist:
                raise ValidationError(f"MarketplaceOffer with ID {offer_id} does not exist.")

            post = offer.post
            if post.owner != user_obj:
                raise PermissionDenied("Only the post owner can accept offers.")

            if offer.status != 'pending':
                raise ValidationError(f"Cannot accept offer with status '{offer.status}'. It must be pending.")

            offer.status = 'accepted'
            offer.save(update_fields=['status'])

            # Atomic rejection of other pending offers on this post
            post.offers.filter(status='pending').exclude(id=offer.id).update(status='rejected')

        return offer

    @classmethod
    def reject_offer(cls, offer_or_id: Any, user: Any) -> MarketplaceOffer:
        """
        Rejects an offer by post owner.
        """
        user_obj = get_user(user)
        offer = get_instance(MarketplaceOffer, offer_or_id, select_related=['post', 'post__owner'])

        if offer.post.owner != user_obj:
            raise PermissionDenied("Only the post owner can reject offers.")

        if offer.status != 'pending':
            raise ValidationError(f"Cannot reject offer with status '{offer.status}'. It must be pending.")

        offer.status = 'rejected'
        offer.save(update_fields=['status'])
        return offer

    @classmethod
    def get_post_offers(cls, post_or_id: Any, user: Any) -> models.QuerySet:
        """
        Returns offers for a post. If user is post owner, returns all offers. Otherwise returns user's offers.
        """
        user_obj = get_user(user)
        post = get_instance(MarketplacePost, post_or_id)

        queryset = MarketplaceOffer.objects.filter(post=post).select_related(
            'user', 'user__marketplace_profile', 'post', 'post__owner'
        )

        if post.owner != user_obj:
            queryset = queryset.filter(user=user_obj)

        return queryset.order_by('-created_at')

    @classmethod
    def get_my_offers(cls, user: Any) -> models.QuerySet:
        """
        Returns all offers submitted by user across all marketplace posts.
        """
        user_obj = get_user(user)
        return MarketplaceOffer.objects.filter(user=user_obj).select_related(
            'user', 'user__marketplace_profile', 'post', 'post__owner', 'post__owner__marketplace_profile'
        ).order_by('-created_at')
