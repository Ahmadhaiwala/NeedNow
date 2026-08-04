from rest_framework import status, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.core.exceptions import ValidationError, PermissionDenied

from .models import MarketplaceReview

from .services import (
    FeedService,
    PostService,
    OfferService,
    ChatService,
    ProfileService,
    ReviewService,
)

from .serializers import (
    MarketplaceProfileSerializer,
    MarketplacePostSerializer,
    MarketplacePostImageSerializer,
    MarketplaceOfferSerializer,
    ChatMessageSerializer,
    MarketplaceReviewSerializer,
    MarketplaceCommentSerializer,
)


def api_response(success=True, message="", data=None, errors=None, status_code=status.HTTP_200_OK):
    """
    Standardized API response formatter.
    """
    payload = {"success": success, "message": message}
    if data is not None:
        payload["data"] = data
    if errors is not None:
        payload["errors"] = errors
    return Response(payload, status=status_code)


# -------------------------------------------------
# PROFILE VIEWS
# -------------------------------------------------

class MarketplaceProfileView(APIView):
    """
    Endpoints for user marketplace profile management.
    GET: Retrieves current user profile.
    PUT/PATCH: Updates user profile.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        try:
            profile = ProfileService.get_profile(request.user)
            serializer = MarketplaceProfileSerializer(profile, context={'request': request})
            return api_response(success=True, message="Profile retrieved successfully.", data=serializer.data)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        return self._update(request)

    def patch(self, request):
        return self._update(request)

    def _update(self, request):
        try:
            profile = ProfileService.update_profile(request.user, **request.data)
            serializer = MarketplaceProfileSerializer(profile, context={'request': request})
            return api_response(success=True, message="Profile updated successfully.", data=serializer.data)
        except ValidationError as e:
            err_detail = e.message_dict if hasattr(e, 'message_dict') else (e.messages if hasattr(e, 'messages') else str(e))
            return api_response(success=False, message="Validation error", errors=err_detail, status_code=status.HTTP_400_BAD_REQUEST)
        except PermissionDenied as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)


class ProfileLocationView(APIView):
    """
    POST: Updates profile location coordinates.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def post(self, request):
        location_name = request.data.get('location_name', '')
        lat = request.data.get('latitude')
        lng = request.data.get('longitude')

        if lat is None or lng is None:
            return api_response(success=False, message="latitude and longitude are required.", status_code=status.HTTP_400_BAD_REQUEST)

        try:
            profile = ProfileService.update_location(request.user, location_name, float(lat), float(lng))
            serializer = MarketplaceProfileSerializer(profile, context={'request': request})
            return api_response(success=True, message="Location updated successfully.", data=serializer.data)
        except ValidationError as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)


class ProfilePostsView(APIView):
    """
    GET: Retrieves posts for the authenticated user or specified user_id.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        target_user = request.query_params.get('user_id', request.user.id)
        post_status = request.query_params.get('status')
        try:
            queryset = ProfileService.get_profile_posts(target_user, status=post_status)
            serializer = MarketplacePostSerializer(queryset, many=True, context={'request': request})
            return api_response(success=True, message="User posts retrieved successfully.", data=serializer.data)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)


# -------------------------------------------------
# FEED VIEWS
# -------------------------------------------------

class FeedView(APIView):
    """
    GET /api/marketplace/feed/: Paginated feed with location, type, category, and search filters.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            lat = request.query_params.get('latitude')
            lng = request.query_params.get('longitude')
            radius = request.query_params.get('radius')
            category = request.query_params.get('category')
            post_type = request.query_params.get('post_type')
            search = request.query_params.get('search')
            exclude_own = request.query_params.get('exclude_own', 'false').lower() == 'true'
            post_status = request.query_params.get('status', 'active')
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 20))

            latitude = float(lat) if lat else None
            longitude = float(lng) if lng else None
            radius_km = float(radius) if radius else None

            paginated_data = FeedService.get_feed(
                user=request.user,
                latitude=latitude,
                longitude=longitude,
                radius_km=radius_km,
                category=category,
                post_type=post_type,
                search=search,
                exclude_own=exclude_own,
                status=post_status,
                page=page,
                page_size=page_size
            )

            serializer = MarketplacePostSerializer(paginated_data['results'], many=True, context={'request': request})
            paginated_data['results'] = serializer.data

            response = api_response(success=True, message="Feed retrieved successfully.", data=paginated_data)
            response['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
            response['Pragma'] = 'no-cache'
            return response
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)



class NearbyFeedView(APIView):
    """
    GET /api/marketplace/feed/nearby/: Nearby posts within given coordinates and radius.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        lat = request.query_params.get('latitude')
        lng = request.query_params.get('longitude')
        radius = request.query_params.get('radius', 10.0)
        category = request.query_params.get('category')
        post_type = request.query_params.get('post_type')

        if not lat or not lng:
            return api_response(success=False, message="latitude and longitude query params are required.", status_code=status.HTTP_400_BAD_REQUEST)

        try:
            posts = FeedService.get_nearby_posts(
                latitude=float(lat),
                longitude=float(lng),
                radius_km=float(radius),
                category=category,
                post_type=post_type,
                user=request.user
            )
            serializer = MarketplacePostSerializer(posts, many=True, context={'request': request})
            return api_response(success=True, message="Nearby posts retrieved successfully.", data=serializer.data)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)


class CategoryFeedView(APIView):
    """
    GET /api/marketplace/feed/category/<category>/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, category):
        try:
            posts = FeedService.get_posts_by_category(category, user=request.user)
            serializer = MarketplacePostSerializer(posts, many=True, context={'request': request})
            return api_response(success=True, message=f"Posts for category '{category}' retrieved.", data=serializer.data)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)


class TypeFeedView(APIView):
    """
    GET /api/marketplace/feed/type/<post_type>/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, post_type):
        try:
            posts = FeedService.get_posts_by_type(post_type, user=request.user)
            serializer = MarketplacePostSerializer(posts, many=True, context={'request': request})
            return api_response(success=True, message=f"Posts for type '{post_type}' retrieved.", data=serializer.data)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)


class SearchFeedView(APIView):
    """
    GET /api/marketplace/feed/search/?q=<query>
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', request.query_params.get('search', ''))
        try:
            posts = FeedService.search_posts(query, user=request.user)
            serializer = MarketplacePostSerializer(posts, many=True, context={'request': request})
            return api_response(success=True, message="Search results retrieved.", data=serializer.data)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)


# -------------------------------------------------
# POST VIEWS
# -------------------------------------------------

class MarketplacePostViewSet(viewsets.ViewSet):
    """
    ViewSet handling post CRUD operations and post state transitions.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def list(self, request):
        """Delegates feed listing."""
        return FeedView().get(request)

    def retrieve(self, request, pk=None):
        try:
            post = FeedService.get_post(pk)
            serializer = MarketplacePostSerializer(post, context={'request': request})
            return api_response(success=True, message="Post details retrieved.", data=serializer.data)
        except ValidationError as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)

    def create(self, request):
        try:
            images = request.FILES.getlist('images')

            def parse_float(val, default=0.0):
                if val is None or val == '' or str(val).strip() == '':
                    return default
                try:
                    return float(val)
                except (ValueError, TypeError):
                    return default

            def parse_optional_num(val):
                if val is None or val == '' or str(val).strip() == '' or str(val).lower() == 'null':
                    return None
                try:
                    return float(val)
                except (ValueError, TypeError):
                    return None

            latitude = parse_float(request.data.get('latitude'), 0.0)
            longitude = parse_float(request.data.get('longitude'), 0.0)
            visibility_radius = parse_float(request.data.get('visibility_radius'), 5.0)
            price = parse_optional_num(request.data.get('price'))
            budget = parse_optional_num(request.data.get('budget'))
            expires_at = request.data.get('expires_at') or None

            post = PostService.create_post(
                user=request.user,
                title=request.data.get('title', ''),
                description=request.data.get('description', ''),
                post_type=request.data.get('post_type', ''),
                category=request.data.get('category', ''),
                location_name=request.data.get('location_name', ''),
                latitude=latitude,
                longitude=longitude,
                price=price,
                budget=budget,
                condition=request.data.get('condition', ''),
                urgency=request.data.get('urgency', ''),
                visibility_radius=visibility_radius,
                expires_at=expires_at,
                images=images
            )
            serializer = MarketplacePostSerializer(post, context={'request': request})
            return api_response(success=True, message="Post created successfully.", data=serializer.data, status_code=status.HTTP_201_CREATED)
        except ValidationError as e:
            err_detail = e.message_dict if hasattr(e, 'message_dict') else (e.messages if hasattr(e, 'messages') else str(e))
            return api_response(success=False, message="Validation error", errors=err_detail, status_code=status.HTTP_400_BAD_REQUEST)
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)

    def update(self, request, pk=None):
        return self._update(request, pk)

    def partial_update(self, request, pk=None):
        return self._update(request, pk)

    def _update(self, request, pk):
        try:
            update_data = dict(request.data)
            if 'images' in request.FILES:
                update_data['images'] = request.FILES.getlist('images')

            flattened = {}
            for k, v in request.data.items():
                flattened[k] = v[0] if isinstance(v, list) and len(v) == 1 else v
            if 'images' in update_data:
                flattened['images'] = update_data['images']

            post = PostService.update_post(pk, request.user, **flattened)
            serializer = MarketplacePostSerializer(post, context={'request': request})
            return api_response(success=True, message="Post updated successfully.", data=serializer.data)
        except ValidationError as e:
            err_detail = e.message_dict if hasattr(e, 'message_dict') else (e.messages if hasattr(e, 'messages') else str(e))
            return api_response(success=False, message="Validation error", errors=err_detail, status_code=status.HTTP_400_BAD_REQUEST)
        except PermissionDenied as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        try:
            PostService.delete_post(pk, request.user)
            return api_response(success=True, message="Post deleted successfully.", status_code=status.HTTP_200_OK)
        except PermissionDenied as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        try:
            post = PostService.archive_post(pk, request.user)
            serializer = MarketplacePostSerializer(post, context={'request': request})
            return api_response(success=True, message="Post archived successfully.", data=serializer.data)
        except PermissionDenied as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        try:
            post = PostService.activate_post(pk, request.user)
            serializer = MarketplacePostSerializer(post, context={'request': request})
            return api_response(success=True, message="Post activated successfully.", data=serializer.data)
        except PermissionDenied as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def expire(self, request, pk=None):
        try:
            post = PostService.expire_post(pk, request.user)
            serializer = MarketplacePostSerializer(post, context={'request': request})
            return api_response(success=True, message="Post marked as expired.", data=serializer.data)
        except PermissionDenied as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)


# -------------------------------------------------
# POST IMAGES VIEWS
# -------------------------------------------------

class PostImagesView(APIView):
    """
    GET/POST image attachment management for a specific post.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request, post_id):
        try:
            images = PostService.get_post_images(post_id)
            serializer = MarketplacePostImageSerializer(images, many=True, context={'request': request})
            return api_response(success=True, message="Images retrieved.", data=serializer.data)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)

    def post(self, request, post_id):
        images = request.FILES.getlist('images')
        if not images:
            return api_response(success=False, message="No image files provided.", status_code=status.HTTP_400_BAD_REQUEST)

        try:
            created_images = PostService.add_images(post_id, request.user, images)
            serializer = MarketplacePostImageSerializer(created_images, many=True, context={'request': request})
            return api_response(success=True, message="Images uploaded successfully.", data=serializer.data, status_code=status.HTTP_201_CREATED)
        except PermissionDenied as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)


class PostImageDetailView(APIView):
    """
    DELETE: Removes a specific post image.
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, image_id):
        try:
            PostService.delete_image(image_id, request.user)
            return api_response(success=True, message="Image deleted successfully.")
        except PermissionDenied as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)


class PostImageReorderView(APIView):
    """
    POST: Reorders images for a post.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def post(self, request, post_id):
        orders = request.data.get('orders')
        if not orders:
            return api_response(success=False, message="orders payload (dict or list) is required.", status_code=status.HTTP_400_BAD_REQUEST)

        try:
            updated_images = PostService.reorder_images(post_id, request.user, orders)
            serializer = MarketplacePostImageSerializer(updated_images, many=True, context={'request': request})
            return api_response(success=True, message="Images reordered successfully.", data=serializer.data)
        except PermissionDenied as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)


# -------------------------------------------------
# OFFERS VIEWS
# -------------------------------------------------

class MarketplacePostOffersView(APIView):
    """
    GET/POST offers linked to a specific post.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request, post_id):
        try:
            offers = OfferService.get_post_offers(post_id, request.user)
            serializer = MarketplaceOfferSerializer(offers, many=True, context={'request': request})
            return api_response(success=True, message="Offers retrieved.", data=serializer.data)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)

    def post(self, request, post_id):
        import logging
        logger = logging.getLogger(__name__)
        
        price = request.data.get('price')
        raw_message = request.data.get('message', '')
        message = str(raw_message).strip() if raw_message is not None else ''
        
        logger.error(f"Creating offer for post {post_id}: price={price} (type={type(price).__name__}), message={message}")
        logger.error(f"Full request data: {request.data}")

        try:
            offer = OfferService.create_offer(post_id, request.user, price, message)
            serializer = MarketplaceOfferSerializer(offer, context={'request': request})
            return api_response(success=True, message="Offer submitted successfully.", data=serializer.data, status_code=status.HTTP_201_CREATED)
        except ValidationError as e:
            err_detail = e.message_dict if hasattr(e, 'message_dict') else (e.messages if hasattr(e, 'messages') else str(e))
            logger.error(f"Offer validation error: {err_detail}")
            return api_response(success=False, message="Validation error", errors=err_detail, status_code=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Offer creation error: {str(e)}")
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)


class UserOffersView(APIView):
    """
    GET: Retrieves offers by or for the current authenticated user.
    - Default (outgoing): offers the user submitted on other posts.
    - ?incoming=true: offers received on the user's own posts (for post owners).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            incoming = request.query_params.get('incoming', 'false').lower() == 'true'
            if incoming:
                # Return all pending offers on posts owned by this user
                from .models import MarketplaceOffer
                offers = MarketplaceOffer.objects.filter(
                    post__owner=request.user,
                    status='pending'
                ).select_related(
                    'user', 'user__marketplace_profile',
                    'post', 'post__owner', 'post__owner__marketplace_profile'
                ).order_by('-created_at')
            else:
                offers = OfferService.get_my_offers(request.user)
            serializer = MarketplaceOfferSerializer(offers, many=True, context={'request': request})
            return api_response(success=True, message="User offers retrieved.", data=serializer.data)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)



class OfferDetailView(APIView):
    """
    PUT/PATCH/DELETE endpoints for a specific offer.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def put(self, request, pk):
        return self._update(request, pk)

    def patch(self, request, pk):
        return self._update(request, pk)

    def _update(self, request, pk):
        try:
            offer = OfferService.update_offer(pk, request.user, **request.data)
            serializer = MarketplaceOfferSerializer(offer, context={'request': request})
            return api_response(success=True, message="Offer updated successfully.", data=serializer.data)
        except ValidationError as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)
        except PermissionDenied as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)


class OfferAcceptView(APIView):
    """
    POST: Accepts an offer (Atomic transaction).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            offer = OfferService.accept_offer(pk, request.user)
            serializer = MarketplaceOfferSerializer(offer, context={'request': request})
            return api_response(success=True, message="Offer accepted successfully.", data=serializer.data)
        except PermissionDenied as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_403_FORBIDDEN)
        except (ValidationError, Exception) as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)


class OfferRejectView(APIView):
    """
    POST: Rejects an offer.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            offer = OfferService.reject_offer(pk, request.user)
            serializer = MarketplaceOfferSerializer(offer, context={'request': request})
            return api_response(success=True, message="Offer rejected successfully.", data=serializer.data)
        except PermissionDenied as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)


class OfferWithdrawView(APIView):
    """
    POST: Withdraws an offer.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            offer = OfferService.withdraw_offer(pk, request.user)
            serializer = MarketplaceOfferSerializer(offer, context={'request': request})
            return api_response(success=True, message="Offer withdrawn successfully.", data=serializer.data)
        except PermissionDenied as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)


# -------------------------------------------------
# COMMENTS VIEWS
# -------------------------------------------------

class PostCommentsView(APIView):
    """
    GET/POST comments on a post.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request, post_id):
        try:
            comments = PostService.get_post_comments(post_id)
            serializer = MarketplaceCommentSerializer(comments, many=True, context={'request': request})
            return api_response(success=True, message="Comments retrieved.", data=serializer.data)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)

    def post(self, request, post_id):
        comment_text = request.data.get('comment', '')
        try:
            comment = PostService.create_comment(post_id, request.user, comment_text)
            serializer = MarketplaceCommentSerializer(comment, context={'request': request})
            return api_response(success=True, message="Comment posted.", data=serializer.data, status_code=status.HTTP_201_CREATED)
        except ValidationError as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)


class CommentDetailView(APIView):
    """
    PUT/PATCH/DELETE endpoints for a specific comment.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def put(self, request, pk):
        return self._update(request, pk)

    def patch(self, request, pk):
        return self._update(request, pk)

    def _update(self, request, pk):
        comment_text = request.data.get('comment', '')
        try:
            comment = PostService.edit_comment(pk, request.user, comment_text)
            serializer = MarketplaceCommentSerializer(comment, context={'request': request})
            return api_response(success=True, message="Comment edited.", data=serializer.data)
        except PermissionDenied as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            PostService.delete_comment(pk, request.user)
            return api_response(success=True, message="Comment deleted.")
        except PermissionDenied as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)


# -------------------------------------------------
# CHAT VIEWS
# -------------------------------------------------

class ChatMessageView(APIView):
    """
    POST: Sends a chat message.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def post(self, request):
        recipient_id = request.data.get('recipient')
        post_id = request.data.get('post')
        content = request.data.get('content', '')
        image = request.FILES.get('image')

        if not recipient_id:
            return api_response(success=False, message="recipient user ID is required.", status_code=status.HTTP_400_BAD_REQUEST)

        try:
            msg = ChatService.send_message(
                sender=request.user,
                recipient_or_id=recipient_id,
                post_or_id=post_id,
                content=content,
                image=image
            )
            serializer = ChatMessageSerializer(msg, context={'request': request})
            return api_response(success=True, message="Message sent.", data=serializer.data, status_code=status.HTTP_201_CREATED)
        except ValidationError as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)


class ChatMessagesListView(APIView):
    """
    GET /api/marketplace/chat/<user_id>/: Retrieves thread history with other user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        post_id = request.query_params.get('post_id')
        try:
            messages = ChatService.get_chat_messages(request.user, user_id, post_or_id=post_id)
            serializer = ChatMessageSerializer(messages, many=True, context={'request': request})
            return api_response(success=True, message="Messages retrieved.", data=serializer.data)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)


class ChatConversationsView(APIView):
    """
    GET /api/marketplace/chat/conversations/: User chat threads summary.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            conversations = ChatService.get_chat_list(request.user)
            formatted = []
            for conv in conversations:
                msg_data = ChatMessageSerializer(conv['latest_message'], context={'request': request}).data
                formatted.append({
                    'other_user_id': conv['other_user'].id,
                    'other_user_name': f"{conv['other_user'].first_name} {conv['other_user'].last_name}".strip() or conv['other_user'].email,
                    'post_id': conv['post'].id if conv['post'] else None,
                    'post_title': conv['post'].title if conv['post'] else None,
                    'latest_message': msg_data,
                    'unread_count': conv['unread_count'],
                    'last_updated': conv['last_updated']
                })
            return api_response(success=True, message="Conversations retrieved.", data=formatted)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)


class ChatMarkReadView(APIView):
    """
    POST /api/marketplace/chat/mark-read/: Marks messages from sender as read.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def post(self, request):
        sender_id = request.data.get('sender')
        post_id = request.data.get('post')

        if not sender_id:
            return api_response(success=False, message="sender ID is required.", status_code=status.HTTP_400_BAD_REQUEST)

        try:
            count = ChatService.mark_messages_read(request.user, sender_id, post_or_id=post_id)
            return api_response(success=True, message=f"{count} messages marked as read.", data={'marked_count': count})
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)


class ChatMessageDetailView(APIView):
    """
    DELETE /api/marketplace/chat/messages/<id>/: Deletes a message.
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        try:
            ChatService.delete_message(pk, request.user)
            return api_response(success=True, message="Message deleted.")
        except PermissionDenied as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)


# -------------------------------------------------
# REVIEWS VIEWS
# -------------------------------------------------

class MarketplaceReviewView(APIView):
    """
    GET/POST endpoints for marketplace reviews.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        target_user = request.query_params.get('user_id', request.user.id)
        post_id = request.query_params.get('post_id')
        as_reviewee = request.query_params.get('as_reviewee', 'true').lower() == 'true'
        
        try:
            if post_id:
                # Filter reviews for a specific post
                reviews = MarketplaceReview.objects.filter(post_id=post_id).select_related(
                    'reviewer', 'reviewer__marketplace_profile',
                    'reviewee', 'reviewee__marketplace_profile',
                    'post'
                )
                # If as_reviewee=false, filter by current user as reviewer
                if not as_reviewee:
                    reviews = reviews.filter(reviewer=request.user)
                reviews = reviews.order_by('-created_at')
            else:
                # Filter reviews by user
                reviews = ReviewService.get_user_reviews(target_user, as_reviewee=as_reviewee)
            
            serializer = MarketplaceReviewSerializer(reviews, many=True, context={'request': request})
            return api_response(success=True, message="Reviews retrieved.", data=serializer.data)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        post_id = request.data.get('post')
        reviewee_id = request.data.get('reviewee')
        rating = request.data.get('rating')
        comment = request.data.get('comment', '')

        if not post_id or not reviewee_id or rating is None:
            return api_response(success=False, message="post, reviewee, and rating are required.", status_code=status.HTTP_400_BAD_REQUEST)

        try:
            review = ReviewService.create_review(post_id, request.user, reviewee_id, int(rating), comment)
            serializer = MarketplaceReviewSerializer(review, context={'request': request})
            return api_response(success=True, message="Review submitted successfully.", data=serializer.data, status_code=status.HTTP_201_CREATED)
        except ValidationError as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)


class ReviewSummaryView(APIView):
    """
    GET /api/marketplace/reviews/summary/?user_id=<id>
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        target_user = request.query_params.get('user_id', request.user.id)
        try:
            summary = ReviewService.get_review_summary(target_user)
            return api_response(success=True, message="Review summary retrieved.", data=summary)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)


class ReviewDetailView(APIView):
    """
    PUT/PATCH/DELETE endpoints for a specific review.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def put(self, request, pk):
        return self._update(request, pk)

    def patch(self, request, pk):
        return self._update(request, pk)

    def _update(self, request, pk):
        try:
            review = ReviewService.update_review(pk, request.user, **request.data)
            serializer = MarketplaceReviewSerializer(review, context={'request': request})
            return api_response(success=True, message="Review updated.", data=serializer.data)
        except PermissionDenied as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            ReviewService.delete_review(pk, request.user)
            return api_response(success=True, message="Review deleted.")
        except PermissionDenied as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST)
