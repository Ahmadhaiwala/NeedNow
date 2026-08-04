from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    MarketplaceProfile,
    MarketplacePost,
    MarketplacePostImage,
    MarketplaceOffer,
    MarketplaceComment,
    ChatMessage,
    MarketplaceReview,
)

User = get_user_model()


class MarketplaceUserSerializer(serializers.ModelSerializer):
    """Lightweight read-only serializer for nested user profile contexts in the marketplace."""
    rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'avatar', 'rating', 'review_count']
        read_only_fields = fields

    def get_rating(self, obj):
        try:
            return float(obj.marketplace_profile.rating)
        except Exception:
            return 0.0

    def get_review_count(self, obj):
        try:
            return obj.marketplace_profile.review_count
        except Exception:
            return 0

    def get_avatar(self, obj):
        try:
            profile = getattr(obj, 'marketplace_profile', None)
            if profile and profile.avatar:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(profile.avatar.url)
                return profile.avatar.url
        except Exception:
            pass
        return None


class MarketplaceProfileSerializer(serializers.ModelSerializer):
    """Serializer for managing a user's marketplace-specific bio and profile details."""
    user_details = MarketplaceUserSerializer(source='user', read_only=True)

    class Meta:
        model = MarketplaceProfile
        fields = [
            'id', 'user', 'user_details', 'bio', 'avatar', 'location_name',
            'latitude', 'longitude', 'seller_type', 'rating', 'review_count',
            'trust_score', 'is_verified', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'rating', 'review_count', 'trust_score', 'is_verified', 'created_at', 'updated_at']


class MarketplacePostImageSerializer(serializers.ModelSerializer):
    """Serializer for images linked to marketplace posts."""
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = MarketplacePostImage
        fields = ['id', 'post', 'image', 'image_url', 'display_order']
        read_only_fields = ['id', 'image_url']

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class MarketplaceCommentSerializer(serializers.ModelSerializer):
    """Serializer for comments posted on marketplace listings."""
    user_details = MarketplaceUserSerializer(source='user', read_only=True)

    class Meta:
        model = MarketplaceComment
        fields = ['id', 'post', 'user', 'user_details', 'comment', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class MarketplacePostSerializer(serializers.ModelSerializer):
    """Serializer for marketplace posts."""
    owner_details = MarketplaceUserSerializer(source='owner', read_only=True)
    images = MarketplacePostImageSerializer(many=True, read_only=True)
    offers_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    distance = serializers.FloatField(read_only=True, required=False)

    class Meta:
        model = MarketplacePost
        fields = [
            'id', 'owner', 'owner_details', 'post_type', 'title', 'description',
            'category', 'images', 'location_name', 'latitude', 'longitude',
            'visibility_radius', 'urgency', 'budget', 'condition', 'price',
            'expires_at', 'status', 'offers_count', 'comments_count',
            'distance', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'owner', 'distance', 'created_at', 'updated_at']

    def get_offers_count(self, obj):
        if hasattr(obj, 'annotated_offers_count'):
            return obj.annotated_offers_count
        return obj.offers.count()

    def get_comments_count(self, obj):
        if hasattr(obj, 'annotated_comments_count'):
            return obj.annotated_comments_count
        return obj.comments.count()


class MarketplaceOfferSerializer(serializers.ModelSerializer):
    """Serializer for bids/offers on marketplace posts."""
    user_details = MarketplaceUserSerializer(source='user', read_only=True)
    post_details = MarketplacePostSerializer(source='post', read_only=True)
    post_title = serializers.ReadOnlyField(source='post.title')
    post_type = serializers.ReadOnlyField(source='post.post_type')
    post = serializers.PrimaryKeyRelatedField(queryset=MarketplacePost.objects.all(), required=False, allow_null=True)

    class Meta:
        model = MarketplaceOffer
        fields = [
            'id', 'post', 'post_title', 'post_type', 'post_details', 'user', 'user_details',
            'price', 'message', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at']


class ChatMessageSerializer(serializers.ModelSerializer):
    """Serializer for messages in marketplace chat threads."""
    sender_details = MarketplaceUserSerializer(source='sender', read_only=True)
    recipient_details = MarketplaceUserSerializer(source='recipient', read_only=True)
    post_details = MarketplacePostSerializer(source='post', read_only=True)
    post = serializers.PrimaryKeyRelatedField(queryset=MarketplacePost.objects.all(), required=False, allow_null=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = [
            'id', 'post', 'post_details', 'sender', 'sender_details', 'recipient', 'recipient_details',
            'content', 'image', 'image_url', 'is_read', 'created_at'
        ]
        read_only_fields = ['id', 'sender', 'recipient', 'is_read', 'created_at', 'image_url']

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class MarketplaceReviewSerializer(serializers.ModelSerializer):
    """Serializer for ratings and comments submitted on completed deals."""
    reviewer_details = MarketplaceUserSerializer(source='reviewer', read_only=True)
    reviewee_details = MarketplaceUserSerializer(source='reviewee', read_only=True)

    class Meta:
        model = MarketplaceReview
        fields = [
            'id', 'post', 'reviewer', 'reviewer_details', 'reviewee', 'reviewee_details',
            'rating', 'comment', 'created_at'
        ]
        read_only_fields = ['id', 'reviewer', 'created_at']
