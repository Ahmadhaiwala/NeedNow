from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from catalog.models import Product
from users.auth_utils import get_user_from_neon_auth
from .models import UserInteraction
from .serializers import BulkInteractionSerializer


@api_view(["POST"])
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

    return Response(
        {"saved": len(created), "errors": errors},
        status=status.HTTP_201_CREATED
    )


@api_view(["GET"])
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
