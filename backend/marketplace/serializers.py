from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import MarketplaceProfile, MarketplacePost, MarketplaceOffer, ChatMessage, MarketplaceReview

User = get_user_model()

class MarketplaceUserSerializer(serializers.ModelSerializer):
    """Lightweight read-only serializer for nested user profile contexts in the marketplace."""
    rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'profile_image_url', 'display_name', 'rating', 'review_count']
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


class MarketplaceProfileSerializer(serializers.ModelSerializer):
    """Serializer for managing a user's marketplace-specific bio and location coordinates."""
    user_details = MarketplaceUserSerializer(source='user', read_only=True)

    class Meta:
        model = MarketplaceProfile
        fields = [
            'id', 'user', 'user_details', 'bio', 'location_name', 
            'latitude', 'longitude', 'rating', 'review_count', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'rating', 'review_count', 'created_at', 'updated_at']


class MarketplacePostSerializer(serializers.ModelSerializer):
    """Serializer for Need and Sell posts. Handles validation of conditional fields."""
    owner_details = MarketplaceUserSerializer(source='owner', read_only=True)
    offers_count = serializers.SerializerMethodField()
    distance = serializers.FloatField(read_only=True, required=False)

    class Meta:
        model = MarketplacePost
        fields = [
            'id', 'owner', 'owner_details', 'post_type', 'title', 'description', 
            'category', 'images', 'location_name', 'latitude', 'longitude', 
            'radius', 'urgency', 'budget', 'condition', 'price', 'status', 
            'offers_count', 'distance', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'owner', 'distance', 'created_at', 'updated_at']

    def get_offers_count(self, obj):
        if hasattr(obj, 'annotated_offers_count'):
            return obj.annotated_offers_count
        return obj.offers.count()

    def validate(self, data):
        """Validate type-specific parameters for Needs and Sells."""
        post_type = data.get('post_type')
        
        if post_type == 'need':
            if not data.get('urgency'):
                raise serializers.ValidationError({"urgency": "Urgency field is required for Need posts."})
            # Condition and Price should be blank/null for Need posts
            data['condition'] = ''
            data['price'] = None
            
        elif post_type == 'sell':
            if not data.get('condition'):
                raise serializers.ValidationError({"condition": "Condition field is required for Sell posts."})
            if data.get('price') is None or data.get('price') <= 0:
                raise serializers.ValidationError({"price": "A positive selling price is required for Sell posts."})
            # Urgency and Budget should be blank/null for Sell posts
            data['urgency'] = ''
            data['budget'] = None
            
        return data


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
            'price', 'message', 'images', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class ChatMessageSerializer(serializers.ModelSerializer):
    """Serializer for messages in polling chat threads."""
    sender_details = MarketplaceUserSerializer(source='sender', read_only=True)
    recipient_details = MarketplaceUserSerializer(source='recipient', read_only=True)
    post = serializers.PrimaryKeyRelatedField(queryset=MarketplacePost.objects.all(), required=False, allow_null=True)

    class Meta:
        model = ChatMessage
        fields = [
            'id', 'post', 'sender', 'sender_details', 'recipient', 'recipient_details', 
            'content', 'image_url', 'is_read', 'created_at'
        ]
        read_only_fields = ['id', 'sender', 'recipient', 'is_read', 'created_at']


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

    def validate(self, data):
        post = data.get('post')
        reviewee = data.get('reviewee')
        request = self.context.get('request')
        
        if not request:
            return data
            
        reviewer = request.user

        # 1. Reviewer cannot review themselves
        if reviewer == reviewee:
            raise serializers.ValidationError("You cannot rate yourself.")

        # 2. Must be part of the transaction (post owner or accepted offer maker)
        is_owner = (post.owner == reviewer and reviewee != reviewer)
        accepted_offer = post.offers.filter(status='accepted').first()
        is_accepted_buyer_seller = (accepted_offer and accepted_offer.user == reviewer)

        if not (is_owner or is_accepted_buyer_seller):
            raise serializers.ValidationError("You can only review users you have completed a deal with.")

        # 3. Post must be completed to leave review
        if post.status != 'completed':
            raise serializers.ValidationError("Reviews can only be left after a deal is marked as completed.")

        return data
