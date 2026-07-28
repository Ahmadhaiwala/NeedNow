import logging

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from catalog.models import Product
from users.auth_utils import get_user_from_neon_auth
from .models import UserInteraction
from .serializers import BulkInteractionSerializer, RecommendedProductSerializer
from .services.recommendation_service import (
    RecommendationService,
    DEFAULT_TOP_K,
    DEFAULT_LIMIT,
)
from .services.preference_services import PreferenceService

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([AllowAny])
def track_interactions(request):
    """
    POST /api/recommendations/interactions/

    Accepts a batch of interaction events from the frontend (fired every 30 s).
    Requires a valid Neon Auth JWT in the Authorization header.

    Request body:
    {
        "events": [
            {
                "product_id": "<uuid or null>",
                "interaction_type": "view|click|cart|wishlist|purchase|rating|search",
                "value": 1.0,
                "metadata": {}
            },
            ...
        ]
    }

    Returns:
    {
        "saved": <int>,   # number of records written
        "errors": []      # any per-event validation problems
    }
    """
    user = get_user_from_neon_auth(request)
    if not user:
        return Response(
            {"error": "Authentication required."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    serializer = BulkInteractionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    events = serializer.validated_data["events"]
    to_create = []
    errors = []

    for idx, event in enumerate(events):
        product = None
        product_id = event.get("product_id")

        if product_id:
            try:
                product = Product.objects.get(id=product_id)
            except Product.DoesNotExist:
                errors.append({"index": idx, "error": f"Product {product_id} not found."})
                continue

        to_create.append(
            UserInteraction(
                user=user,
                product=product,
                interaction_type=event["interaction_type"],
                value=event.get("value", 1.0),
                metadata=event.get("metadata", {}),
            )
        )

    created = UserInteraction.objects.bulk_create(to_create)

    # Incrementally update UserPreference for all saved interactions.
    # Wrapped in try/except: a preference failure must never break the
    # 201 response that the frontend depends on.
    if created:
        try:
            PreferenceService().update_preferences_from_interactions(created)
            from .services.embedding_service import UserEmbeddingService
            UserEmbeddingService().embed_user(user)
        except Exception:
            logger.exception(
                "track_interactions: preference/embedding update failed for user_id=%s", user.pk
            )

    return Response(
        {"saved": len(created), "errors": errors},
        status=status.HTTP_201_CREATED
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def my_interactions(request):
    """
    GET /api/recommendations/interactions/me/

    Returns the last 100 interactions for the authenticated user.
    Useful for debugging the tracking pipeline.
    """
    user = get_user_from_neon_auth(request)
    if not user:
        return Response(
            {"error": "Authentication required."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    interactions = (
        UserInteraction.objects
        .filter(user=user)
        .select_related("product")
        .order_by("-created_at")[:100]
    )

    data = [
        {
            "id": i.id,
            "product_id": str(i.product.id) if i.product else None,
            "product_name": i.product.name if i.product else None,
            "interaction_type": i.interaction_type,
            "value": i.value,
            "metadata": i.metadata,
            "created_at": i.created_at.isoformat(),
        }
        for i in interactions
    ]

    return Response({"interactions": data, "count": len(data)})


@api_view(["GET"])
@permission_classes([AllowAny])
def get_recommendations(request):
    """
    GET /api/recommendations/

    Unified paginated product feed.

    -- Page 1 --
    Returns recommendation-ranked products.
    If ``?personalised=true`` and a valid JWT is present, uses the user's
    embedding (personalised recommendations).  Otherwise falls back to the
    cold-start blend (popularity + rating).

    -- Page 2+ --
    Returns catalog products ordered by -popularity_score, -rating.
    Pass ``?exclude_ids=uuid1,uuid2,...`` (the IDs received on page 1) to
    avoid duplicates.  Category filter via ``?category=<uuid>`` works on
    all pages.

    Query params:
        page          (int, default 1)         -- 1-indexed page number
        page_size     (int, default 20, max 50)
        personal      (bool, default false)    -- requires valid JWT
        exclude_ids   (str)                    -- comma-separated UUIDs to skip
        category      (uuid, optional)         -- filter by category (and subcats)
        top_k         (int, default 50)        -- rec engine candidate pool (page 1 only)

    Response::

        {
            "page":     1,
            "page_size": 20,
            "strategy": "embedding" | "cold_start" | "catalog",
            "count":    20,
            "has_more": true,
            "recommendations": [
                {
                    "product": { ...full product fields... },
                    "score":   <float>,
                    "reason":  {
                        "strategy":    "embedding" | "cold_start" | "catalog",
                        "cosine":      <float>,      // embedding only
                        "popularity":  <float>,      // embedding only
                        "in_stock":    <bool>,       // embedding only
                        "final_score": <float>       // embedding only
                    }
                },
                ...
            ]
        }
    """
    from catalog.models import Category, Product as CatalogProduct
    from catalog.catalogSerializer import ProductSerializer as CatalogProductSerializer

    # ------------------------------------------------------------------ #
    # Parse & validate query params                                        #
    # ------------------------------------------------------------------ #
    try:
        page = max(1, int(request.query_params.get("page", 1)))
        page_size = max(1, min(int(request.query_params.get("page_size", DEFAULT_LIMIT)), 50))
        top_k = max(1, min(int(request.query_params.get("top_k", DEFAULT_TOP_K)), 200))
    except (ValueError, TypeError):
        return Response(
            {"error": "page, page_size, and top_k must be integers."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    personal = request.query_params.get("personal", "false").lower() == "true"
    category_id = request.query_params.get("category", None)

    # Parse exclude_ids (comma-separated UUIDs from frontend, used on page 2+)
    raw_exclude = request.query_params.get("exclude_ids", "")
    exclude_ids: set = set()
    if raw_exclude:
        for part in raw_exclude.split(","):
            part = part.strip()
            if part:
                exclude_ids.add(part)

    # ------------------------------------------------------------------ #
    # Category filter helper                                               #
    # ------------------------------------------------------------------ #
    def _category_product_ids():
        """Return a QS of product IDs matching the requested category + subcats."""
        if not category_id:
            return None
        try:
            cat = Category.objects.get(id=category_id)
        except Category.DoesNotExist:
            return CatalogProduct.objects.none().values_list("id", flat=True)
        sub_ids = cat.subcategories.values_list("id", flat=True)
        all_cat_ids = [cat.id, *sub_ids]
        return CatalogProduct.objects.filter(
            category__in=all_cat_ids
        ).values_list("id", flat=True)

    personal_arg = request.query_params.get("personal", "").lower()

    # ------------------------------------------------------------------ #
    # Page 1 — recommendation-ranked results                               #
    # ------------------------------------------------------------------ #
    if page == 1:
        user = get_user_from_neon_auth(request)

        if personal_arg == "true" and not user:
            return Response(
                {"error": "Authentication required for personal recommendations."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if personal_arg == "false":
            user = None

        service = RecommendationService()

        if user:
            results = service.get_recommendations(
                user=user, top_k=top_k, limit=page_size
            )
        else:
            # Public cold-start path
            results = service._cold_start(limit=page_size)

        # Apply category filter if requested
        if category_id:
            cat_ids = set(str(pid) for pid in _category_product_ids())
            results = [r for r in results if str(r["product"].id) in cat_ids]

        strategy = results[0]["reason"]["strategy"] if results else "cold_start"
        serializer = RecommendedProductSerializer(results, many=True)

        return Response(
            {
                "page": 1,
                "page_size": page_size,
                "strategy": strategy,
                "count": len(results),
                "has_more": True,  # catalog pages always follow
                "recommendations": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    # ------------------------------------------------------------------ #
    # Page 2+ — catalog products ordered by popularity + rating            #
    # ------------------------------------------------------------------ #
    offset = (page - 2) * page_size   # page 2 starts at offset 0 in the catalog qs

    qs = CatalogProduct.objects.select_related("category").order_by(
        "-popularity_score", "-rating", "name"
    )

    # Category filter
    if category_id:
        cat_ids = _category_product_ids()
        qs = qs.filter(id__in=cat_ids)

    # Exclude IDs already shown on page 1
    if exclude_ids:
        qs = qs.exclude(id__in=exclude_ids)

    total_remaining = qs.count()
    products = list(qs[offset : offset + page_size])
    has_more = (offset + page_size) < total_remaining

    # Wrap in the same envelope shape for consistency.
    # Compute max_pop once from the page slice so normalisation is batch-relative.
    max_pop = max((float(p.popularity_score) for p in products), default=1.0) or 1.0

    results = [
        {
            "product": p,
            "score": round(
                0.70 * min(float(p.popularity_score) / max_pop, 1.0)
                + 0.30 * min(float(p.rating) / 5.0, 1.0),
                6,
            ),
            "reason": {"strategy": "catalog"},
        }
        for p in products
    ]

    serializer = RecommendedProductSerializer(results, many=True)

    return Response(
        {
            "page": page,
            "page_size": page_size,
            "strategy": "catalog",
            "count": len(results),
            "has_more": has_more,
            "recommendations": serializer.data,
        },
        status=status.HTTP_200_OK,
    )
