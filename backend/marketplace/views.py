import math
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db import models
from django.db.models import Q, F, ExpressionWrapper, FloatField, Count
from django.db.models.functions import ACos, Cos, Radians, Sin, Cast
from django.contrib.auth import get_user_model

from .models import MarketplaceProfile, MarketplacePost, MarketplaceOffer, ChatMessage, MarketplaceReview
from .serializers import (
    MarketplaceProfileSerializer, MarketplacePostSerializer, 
    MarketplaceOfferSerializer, ChatMessageSerializer, MarketplaceReviewSerializer
)

User = get_user_model()

class MarketplaceProfileView(APIView):
    """
    Profile endpoint for current user.
    GET: Returns profile or 404 (prompting frontend onboarding).
    POST: Creates profile for first-time onboarding.
    PUT/PATCH: Updates profile location/bio.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = MarketplaceProfile.objects.filter(user=request.user).first()
        if not profile:
            return Response(
                {"error": "Marketplace profile not set up yet. Redirect to onboarding."},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = MarketplaceProfileSerializer(profile, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        if MarketplaceProfile.objects.filter(user=request.user).exists():
            return Response(
                {"error": "Profile already exists. Use PUT/PATCH to update."},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = MarketplaceProfileSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        profile = get_object_or_404(MarketplaceProfile, user=request.user)
        serializer = MarketplaceProfileSerializer(profile, data=request.data, partial=False, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        profile = get_object_or_404(MarketplaceProfile, user=request.user)
        serializer = MarketplaceProfileSerializer(profile, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MarketplacePostViewSet(viewsets.ModelViewSet):
    """
    ViewSet for listing, creating, and modifying posts.
    GET /api/marketplace/posts/: lists posts filtered by location coordinates (Haversine & Bounding Box).
    """
    serializer_class = MarketplacePostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # For detail actions (complete, retrieve, update, etc.), return unfiltered posts queryset
        if getattr(self, 'action', None) and self.action != 'list':
            return MarketplacePost.objects.select_related('owner').all()

        # Check if user is requesting their own posts list
        my_posts = self.request.query_params.get('my_posts', 'false').lower() == 'true'
        if my_posts:
            queryset = MarketplacePost.objects.annotate(annotated_offers_count=models.Count('offers')).select_related('owner', 'owner__marketplace_profile').filter(owner=self.request.user).order_by('-created_at')
            category = self.request.query_params.get('category')
            if category and category != 'All':
                queryset = queryset.filter(category__iexact=category)
            search = self.request.query_params.get('search')
            if search:
                queryset = queryset.filter(Q(title__icontains=search) | Q(description__icontains=search))
            return queryset

        queryset = MarketplacePost.objects.annotate(annotated_offers_count=models.Count('offers')).select_related('owner', 'owner__marketplace_profile').filter(status='active')
        
        # Exclude request user's own posts by default on public feed
        exclude_own = self.request.query_params.get('exclude_own', 'true').lower() == 'true'
        if exclude_own:
            queryset = queryset.exclude(owner=self.request.user)

        # Filters
        post_type = self.request.query_params.get('post_type')
        if post_type in ['need', 'sell']:
            queryset = queryset.filter(post_type=post_type)

        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__iexact=category)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )

        # Geographic proximity filtering
        lat = self.request.query_params.get('latitude')
        lng = self.request.query_params.get('longitude')
        radius_param = self.request.query_params.get('radius') # max search override in km

        if lat and lng:
            try:
                user_lat = float(lat)
                user_lng = float(lng)
                
                # Check for radius override or fallback to post's own radius limit
                max_radius = float(radius_param) if radius_param else None

                # 1. Bounding Box pre-filter (uses DB index on latitude, longitude)
                # 1 degree of latitude is roughly 111km.
                # 1 degree of longitude is roughly 111km * cos(lat).
                query_radius = max_radius if max_radius else 50.0 # Bounding box limit fallback: 50km max
                lat_delta = query_radius / 111.0
                cos_rad = math.cos(math.radians(user_lat))
                lng_delta = query_radius / (111.0 * abs(cos_rad)) if abs(cos_rad) > 0.01 else query_radius / 111.0

                queryset = queryset.filter(
                    latitude__gte=user_lat - lat_delta,
                    latitude__lte=user_lat + lat_delta,
                    longitude__gte=user_lng - lng_delta,
                    longitude__lte=user_lng + lng_delta
                )

                # 2. Precise Haversine distance annotation
                rad_lat_user = Radians(user_lat)
                rad_lng_user = Radians(user_lng)
                rad_lat_post = Radians(Cast(F('latitude'), FloatField()))
                rad_lng_post = Radians(Cast(F('longitude'), FloatField()))

                cos_diff_lng = Cos(rad_lng_post - rad_lng_user)
                sin_lat_mul = Sin(rad_lat_user) * Sin(rad_lat_post)
                cos_lat_mul = Cos(rad_lat_user) * Cos(rad_lat_post) * cos_diff_lng
                
                distance_expr = ExpressionWrapper(
                    6371.0 * ACos(sin_lat_mul + cos_lat_mul),
                    output_field=FloatField()
                )
                
                queryset = queryset.annotate(distance=distance_expr)
                
                # 3. Radius filter comparison
                if max_radius:
                    queryset = queryset.filter(distance__lte=max_radius)
                else:
                    # Filter by the post's own defined radius: distance <= F('radius')
                    queryset = queryset.filter(distance__lte=F('radius'))

                queryset = queryset.order_by('distance')
            except ValueError:
                pass # Invalid floats, ignore distance filtering

        return queryset

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark post as completed/closed (deal successfully done)."""
        post = self.get_object()
        if post.owner != request.user:
            return Response({"error": "Only the post owner can mark it completed."}, status=status.HTTP_403_FORBIDDEN)
        
        post.status = 'completed'
        post.save()
        return Response({"status": "completed"})

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Mark post as cancelled/closed."""
        post = self.get_object()
        if post.owner != request.user:
            return Response({"error": "Only the post owner can cancel it."}, status=status.HTTP_403_FORBIDDEN)
        
        post.status = 'cancelled'
        post.save()
        return Response({"status": "cancelled"})


class MarketplacePostOffersView(APIView):
    """
    Sub-route for managing offers linked to a specific post:
    GET /api/marketplace/posts/{id}/offers/
    POST /api/marketplace/posts/{id}/offers/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, post_id=None):
        post = get_object_or_404(MarketplacePost, id=post_id)
        
        # Permission logic:
        # Post owner can see all offers.
        # Other users can only see their own offers on this post.
        if post.owner == request.user:
            offers = post.offers.select_related('user', 'user__marketplace_profile', 'post', 'post__owner', 'post__owner__marketplace_profile').all()
        else:
            offers = post.offers.select_related('user', 'user__marketplace_profile', 'post', 'post__owner', 'post__owner__marketplace_profile').filter(user=request.user)

        serializer = MarketplaceOfferSerializer(offers, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, post_id=None):
        post = get_object_or_404(MarketplacePost, id=post_id)
        
        if post.status != 'active':
            return Response({"error": "Cannot make an offer on an inactive post."}, status=status.HTTP_400_BAD_REQUEST)
            
        if post.owner == request.user:
            return Response({"error": "You cannot submit an offer on your own post."}, status=status.HTTP_400_BAD_REQUEST)
            
        serializer = MarketplaceOfferSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(user=request.user, post=post)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MarketplaceOfferDetailView(APIView):
    """
    Actions on specific offers:
    PATCH: Update status (Accept/Reject). Only post owner can accept/reject.
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk=None):
        offer = get_object_or_404(MarketplaceOffer, id=pk)
        post = offer.post

        if post.owner != request.user:
            return Response({"error": "Only the post owner can accept or reject offers."}, status=status.HTTP_403_FORBIDDEN)

        status_update = request.data.get('status')
        if status_update not in ['accepted', 'rejected']:
            return Response({"error": "Status must be 'accepted' or 'rejected'."}, status=status.HTTP_400_BAD_REQUEST)

        offer.status = status_update
        offer.save()

        # If accepted, reject all other pending offers automatically
        if status_update == 'accepted':
            post.offers.filter(status='pending').exclude(id=offer.id).update(status='rejected')
            # Transition post status to completed (or keep active for reviews based on UX)
            # For our workflow: deal accepted -> chat continues -> complete manually.
            # But accepting an offer sets the transaction stage!
            
        serializer = MarketplaceOfferSerializer(offer, context={'request': request})
        return Response(serializer.data)


class ChatMessageListView(APIView):
    """
    Endpoints for polling-based chat.
    GET /api/marketplace/chat/{user_id}/: Retrieves chat history between current user and user_id.
    POST /api/marketplace/chat/{user_id}/: Sends a new text/image message.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id=None):
        other_user = get_object_or_404(User, id=user_id)
        post_id = request.query_params.get('post_id')

        # Messages between current user and the other user, ordered chronologically with select_related
        queryset = ChatMessage.objects.select_related(
            'sender', 'sender__marketplace_profile', 
            'recipient', 'recipient__marketplace_profile', 
            'post'
        ).filter(
            (Q(sender=request.user) & Q(recipient=other_user)) |
            (Q(sender=other_user) & Q(recipient=request.user))
        ).order_by('created_at')

        # Mark incoming messages as read
        queryset.filter(recipient=request.user, is_read=False).update(is_read=True)

        serializer = ChatMessageSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, user_id=None):
        recipient = get_object_or_404(User, id=user_id)
        post_id = request.data.get('post')
        
        post = get_object_or_404(MarketplacePost, id=post_id) if post_id else None

        serializer = ChatMessageSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            msg = serializer.save(
                sender=request.user,
                recipient=recipient,
                post=post
            )
            msg_obj = ChatMessage.objects.select_related(
                'sender', 'sender__marketplace_profile',
                'recipient', 'recipient__marketplace_profile'
            ).get(id=msg.id)
            res_serializer = ChatMessageSerializer(msg_obj, context={'request': request})
            return Response(res_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MarketplaceReviewCreateView(APIView):
    """
    Endpoint for leaving and listing marketplace reviews.
    GET /api/marketplace/reviews/?user_id=<id>&post_id=<id>&my_reviews=true
    POST /api/marketplace/reviews/: Submits a review.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user_id = request.query_params.get('user_id')
        post_id = request.query_params.get('post_id')
        my_reviews = request.query_params.get('my_reviews', 'false').lower() == 'true'
        by_reviewer = request.query_params.get('by_reviewer', 'false').lower() == 'true'

        queryset = MarketplaceReview.objects.select_related(
            'reviewer', 'reviewer__marketplace_profile',
            'reviewee', 'reviewee__marketplace_profile',
            'post'
        )
        
        if my_reviews:
            queryset = queryset.filter(reviewee=request.user)
        elif by_reviewer:
            queryset = queryset.filter(reviewer=request.user)
        elif user_id:
            queryset = queryset.filter(reviewee_id=user_id)
        
        if post_id:
            queryset = queryset.filter(post_id=post_id)

        serializer = MarketplaceReviewSerializer(queryset.order_by('-created_at'), many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        post_id = request.data.get('post')
        existing_review = MarketplaceReview.objects.filter(post_id=post_id, reviewer=request.user).first()
        
        if existing_review:
            serializer = MarketplaceReviewSerializer(existing_review, data=request.data, partial=True, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer = MarketplaceReviewSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(reviewer=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserOffersView(APIView):
    """
    GET /api/marketplace/my-offers/
    Retrieves all offers submitted by the current user across all posts.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        offers = MarketplaceOffer.objects.filter(user=request.user).select_related('user', 'user__marketplace_profile', 'post', 'post__owner', 'post__owner__marketplace_profile').order_by('-created_at')
        serializer = MarketplaceOfferSerializer(offers, many=True, context={'request': request})
        return Response(serializer.data)
