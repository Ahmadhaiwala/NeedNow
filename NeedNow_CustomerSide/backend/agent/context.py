from recommendations.models import UserPreference, UserInteraction, InteractionType
from order.models import Order, OrderItem

def get_user_context(user):
    """
    Builds the complete shopping context for the agent.
    """

    return {
        "preferences": get_user_preferences(user),

        "recent_interactions": get_recent_interactions(
            user,
            limit=20
        ),

        "recent_purchases": get_recent_purchases(
            user,
            limit=10
        ),
    }

def get_recent_purchases(user, limit=10):
    """
    Returns products actually purchased by the user.

    Order/OrderItem is used as the source of truth instead
    of recommendation interaction events.
    """

    purchases = (
        OrderItem.objects
        .filter(
            order__user=user,
            order__status__in=[
                Order.Status.PLACED,
                Order.Status.CONFIRMED,
                Order.Status.PROCESSING,
                Order.Status.SHIPPED,
                Order.Status.DELIVERED,
            ],
        )
        .select_related("product", "order")
        .order_by("-order__created_at")[:limit]
    )

    return [
        {
            "product_id": (
                str(item.product.id)
                if item.product
                else None
            ),
            "product_name": (
                item.product.name
                if item.product
                else "Deleted Product"
            ),
            "quantity": item.quantity,
            "unit_price": float(item.unit_price),
            "total_price": float(item.total_price),

            "order_id": str(item.order.id),
            "order_status": item.order.status,
            "platform": item.order.platform,

            "purchased_at": item.order.created_at.isoformat(),
        }
        for item in purchases
    ]


def get_user_preferences(user):
    """
    Returns the user's learned long-term shopping preferences.
    """

    try:
        preference = UserPreference.objects.get(user=user)
    except UserPreference.DoesNotExist:
        return {
            "categories": {},
            "brands": {},
            "tags": {},
        }

    return {
        "categories": preference.category_scores,
        "brands": preference.brand_scores,
        "tags": preference.tag_scores,
    }
from recommendations.models import UserInteraction

def get_recent_interactions(user, limit=20):

    interactions = (
        UserInteraction.objects
        .filter(user=user)
        .select_related("product")
        .order_by("-created_at")[:limit]
    )

    return [
        {
            "type": interaction.interaction_type,

            "product_id": (
                str(interaction.product.id)
                if interaction.product
                else None
            ),

            "product_name": (
                interaction.product.name
                if interaction.product
                else None
            ),

            "value": interaction.value,
            "metadata": interaction.metadata,
            "created_at": interaction.created_at.isoformat(),
            "session_id": interaction.session_id,
        }
        for interaction in interactions
    ]

    


