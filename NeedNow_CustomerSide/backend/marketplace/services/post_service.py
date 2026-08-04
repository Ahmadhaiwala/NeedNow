from typing import Any, Dict, List, Optional, Tuple, Union
from decimal import Decimal
from django.db import transaction, models
from django.core.exceptions import ValidationError, PermissionDenied

from ..models import MarketplacePost, MarketplacePostImage, MarketplaceComment
from .utils import get_instance, get_user


class PostService:
    """
    Service handling Marketplace Posts, Post Images, and Comments.
    """

    @staticmethod
    def _create_post_images(post: MarketplacePost, images: List[Any]) -> List[MarketplacePostImage]:
        if not images:
            return []

        existing_max_order = post.images.aggregate(max_order=models.Max('display_order'))['max_order'] or 0
        image_objects = []

        for idx, img in enumerate(images, start=existing_max_order + 1):
            if isinstance(img, MarketplacePostImage):
                continue
            image_objects.append(MarketplacePostImage(post=post, image=img, display_order=idx))

        if image_objects:
            return MarketplacePostImage.objects.bulk_create(image_objects)
        return []

    @staticmethod
    def validate_post(data: Dict[str, Any]) -> bool:
        """
        Validates post creation/update payload.
        """
        errors = {}
        title = data.get('title')
        if not title or not str(title).strip():
            errors['title'] = "Title is required and cannot be empty."

        post_type = data.get('post_type')
        valid_types = [t[0] for t in MarketplacePost.POST_TYPES]
        if post_type and post_type not in valid_types:
            errors['post_type'] = f"Invalid post_type '{post_type}'. Must be one of {valid_types}."

        category = data.get('category')
        if not category or not str(category).strip():
            errors['category'] = "Category is required."

        lat = data.get('latitude')
        lng = data.get('longitude')
        if lat is not None:
            try:
                lat_val = float(lat)
                if not (-90.0 <= lat_val <= 90.0):
                    errors['latitude'] = "Latitude must be between -90 and 90 degrees."
            except (ValueError, TypeError):
                errors['latitude'] = "Latitude must be a valid float number."

        if lng is not None:
            try:
                lng_val = float(lng)
                if not (-180.0 <= lng_val <= 180.0):
                    errors['longitude'] = "Longitude must be between -180 and 180 degrees."
            except (ValueError, TypeError):
                errors['longitude'] = "Longitude must be a valid float number."

        price = data.get('price')
        if price is not None and price != '' and str(price).strip() != '':
            try:
                if float(price) < 0:
                    errors['price'] = "Price cannot be negative."
            except (ValueError, TypeError):
                errors['price'] = "Price must be a valid number."

        budget = data.get('budget')
        if budget is not None and budget != '' and str(budget).strip() != '':
            try:
                if float(budget) < 0:
                    errors['budget'] = "Budget cannot be negative."
            except (ValueError, TypeError):
                errors['budget'] = "Budget must be a valid number."

        if errors:
            raise ValidationError(errors)

        return True

    # -------------------------------------------------
    # POSTS
    # -------------------------------------------------

    @classmethod
    @transaction.atomic
    def create_post(
        cls,
        user: Any,
        title: str,
        description: str,
        post_type: str,
        category: str,
        location_name: str,
        latitude: float,
        longitude: float,
        price: Optional[Union[float, Decimal]] = None,
        budget: Optional[Union[float, Decimal]] = None,
        condition: str = '',
        urgency: str = '',
        visibility_radius: float = 5.0,
        expires_at: Any = None,
        images: Optional[List[Any]] = None
    ) -> MarketplacePost:
        """
        Validates data, creates a new MarketplacePost, attaches uploaded images, and returns the instance.
        """
        user_obj = get_user(user)
        post_data = {
            'title': title,
            'description': description,
            'post_type': post_type,
            'category': category,
            'location_name': location_name,
            'latitude': latitude,
            'longitude': longitude,
            'price': price,
            'budget': budget,
            'condition': condition,
            'urgency': urgency,
            'visibility_radius': visibility_radius,
            'expires_at': expires_at,
        }

        cls.validate_post(post_data)

        post = MarketplacePost.objects.create(
            owner=user_obj,
            title=title,
            description=description,
            post_type=post_type,
            category=category,
            location_name=location_name,
            latitude=latitude,
            longitude=longitude,
            price=price,
            budget=budget,
            condition=condition,
            urgency=urgency,
            visibility_radius=visibility_radius,
            expires_at=expires_at,
            status='active'
        )

        if images:
            cls._create_post_images(post, images)

        return post

    @classmethod
    @transaction.atomic
    def update_post(cls, post_or_id: Any, user: Any, **data) -> MarketplacePost:
        """
        Updates an existing post after verifying ownership and validating data.
        """
        user_obj = get_user(user)
        post = get_instance(MarketplacePost, post_or_id)

        if post.owner != user_obj:
            raise PermissionDenied("You do not have permission to update this post.")

        images = data.pop('images', None)

        valid_fields = [
            'title', 'description', 'post_type', 'category', 'price', 'budget',
            'condition', 'urgency', 'visibility_radius', 'location_name',
            'latitude', 'longitude', 'expires_at', 'status'
        ]

        for field in valid_fields:
            if field in data:
                setattr(post, field, data[field])

        cls.validate_post({
            'title': post.title,
            'post_type': post.post_type,
            'category': post.category,
            'latitude': post.latitude,
            'longitude': post.longitude,
            'price': post.price,
            'budget': post.budget,
        })

        post.save()

        if images:
            cls._create_post_images(post, images)

        return post

    @classmethod
    @transaction.atomic
    def delete_post(cls, post_or_id: Any, user: Any) -> bool:
        """
        Deletes a post after verifying user ownership.
        """
        user_obj = get_user(user)
        post = get_instance(MarketplacePost, post_or_id)

        if post.owner != user_obj:
            raise PermissionDenied("You do not have permission to delete this post.")

        post.delete()
        return True

    @classmethod
    def archive_post(cls, post_or_id: Any, user: Any) -> MarketplacePost:
        """
        Marks a post as completed/archived by post owner.
        """
        user_obj = get_user(user)
        post = get_instance(MarketplacePost, post_or_id)

        if post.owner != user_obj:
            raise PermissionDenied("You do not have permission to archive this post.")

        post.status = "completed"
        post.save(update_fields=['status', 'updated_at'])
        return post

    @classmethod
    def activate_post(cls, post_or_id: Any, user: Any) -> MarketplacePost:
        """
        Re-activates a post.
        """
        user_obj = get_user(user)
        post = get_instance(MarketplacePost, post_or_id)

        if post.owner != user_obj:
            raise PermissionDenied("You do not have permission to activate this post.")

        post.status = "active"
        post.save(update_fields=['status', 'updated_at'])
        return post

    @classmethod
    def expire_post(cls, post_or_id: Any, user: Optional[Any] = None) -> MarketplacePost:
        """
        Marks a post as expired (by owner or automated system task).
        """
        post = get_instance(MarketplacePost, post_or_id)

        if user is not None:
            user_obj = get_user(user)
            if post.owner != user_obj:
                raise PermissionDenied("You do not have permission to expire this post.")

        post.status = "expired"
        post.save(update_fields=['status', 'updated_at'])
        return post

    # -------------------------------------------------
    # POST IMAGES
    # -------------------------------------------------

    @classmethod
    @transaction.atomic
    def add_images(cls, post_or_id: Any, user: Any, images: List[Any]) -> List[MarketplacePostImage]:
        """
        Adds new images to an existing post.
        """
        user_obj = get_user(user)
        post = get_instance(MarketplacePost, post_or_id)

        if post.owner != user_obj:
            raise PermissionDenied("You do not have permission to add images to this post.")

        return cls._create_post_images(post, images)

    @classmethod
    @transaction.atomic
    def delete_image(cls, image_id: Any, user: Any) -> bool:
        """
        Deletes a specific post image after verifying post ownership.
        """
        user_obj = get_user(user)
        image = get_instance(MarketplacePostImage, image_id, select_related=['post'])

        if image.post.owner != user_obj:
            raise PermissionDenied("You do not have permission to delete images from this post.")

        image.delete()
        return True

    @classmethod
    @transaction.atomic
    def reorder_images(cls, post_or_id: Any, user: Any, image_orders: Union[Dict[int, int], List[Tuple[int, int]]]) -> models.QuerySet:
        """
        Reorders post images. Accepts a dictionary of {image_id: order} or a list of (image_id, order) tuples.
        """
        user_obj = get_user(user)
        post = get_instance(MarketplacePost, post_or_id)

        if post.owner != user_obj:
            raise PermissionDenied("You do not have permission to reorder images for this post.")

        if isinstance(image_orders, list):
            orders_dict = {img_id: order for img_id, order in image_orders}
        else:
            orders_dict = image_orders

        images = MarketplacePostImage.objects.filter(post=post, id__in=orders_dict.keys())
        for img in images:
            img.display_order = orders_dict[img.id]

        MarketplacePostImage.objects.bulk_update(images, ['display_order'])
        return cls.get_post_images(post)

    @classmethod
    def get_post_images(cls, post_or_id: Any) -> models.QuerySet:
        """
        Retrieves images for a given post ordered by display_order.
        """
        post = get_instance(MarketplacePost, post_or_id)
        return MarketplacePostImage.objects.filter(post=post).order_by('display_order', 'id')

    # -------------------------------------------------
    # COMMENTS
    # -------------------------------------------------

    @classmethod
    def create_comment(cls, post_or_id: Any, user: Any, comment_text: str) -> MarketplaceComment:
        """
        Creates a comment on a marketplace post.
        """
        user_obj = get_user(user)
        post = get_instance(MarketplacePost, post_or_id)

        if not comment_text or not comment_text.strip():
            raise ValidationError("Comment text cannot be empty.")

        return MarketplaceComment.objects.create(
            post=post,
            user=user_obj,
            comment=comment_text.strip()
        )

    @classmethod
    def edit_comment(cls, comment_or_id: Any, user: Any, comment_text: str) -> MarketplaceComment:
        """
        Edits an existing comment by author.
        """
        user_obj = get_user(user)
        comment = get_instance(MarketplaceComment, comment_or_id)

        if comment.user != user_obj:
            raise PermissionDenied("You do not have permission to edit this comment.")

        if not comment_text or not comment_text.strip():
            raise ValidationError("Comment text cannot be empty.")

        comment.comment = comment_text.strip()
        comment.save(update_fields=['comment'])
        return comment

    @classmethod
    def delete_comment(cls, comment_or_id: Any, user: Any) -> bool:
        """
        Deletes a comment (by author or post owner).
        """
        user_obj = get_user(user)
        comment = get_instance(MarketplaceComment, comment_or_id, select_related=['post'])

        if comment.user != user_obj and comment.post.owner != user_obj:
            raise PermissionDenied("You do not have permission to delete this comment.")

        comment.delete()
        return True

    @classmethod
    def get_post_comments(cls, post_or_id: Any) -> models.QuerySet:
        """
        Retrieves all comments for a given post ordered by creation time.
        """
        post = get_instance(MarketplacePost, post_or_id)
        return MarketplaceComment.objects.filter(post=post).select_related(
            'user', 'user__marketplace_profile'
        ).order_by('created_at')
