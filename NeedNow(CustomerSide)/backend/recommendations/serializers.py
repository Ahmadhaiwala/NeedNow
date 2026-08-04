from rest_framework import serializers
from .models import UserInteraction, InteractionType
from catalog.catalogSerializer import ProductSerializer


class UserInteractionSerializer(serializers.ModelSerializer):
    """
    Serializer for reading a single UserInteraction record.
    """
    interaction_type_display = serializers.CharField(
        source="get_interaction_type_display",
        read_only=True
    )
    product_name = serializers.CharField(
        source="product.name",
        read_only=True,
        default=None
    )

    class Meta:
        model = UserInteraction
        fields = [
            "id",
            "user",
            "product",
            "product_name",
            "interaction_type",
            "interaction_type_display",
            "value",
            "metadata",
            "created_at",
        ]
        read_only_fields = ["id", "user", "created_at"]


class BulkInteractionItemSerializer(serializers.Serializer):
    """
    Shape of a single event inside the bulk payload sent by the frontend.
    """
    product_id = serializers.UUIDField(required=False, allow_null=True)
    interaction_type = serializers.ChoiceField(choices=InteractionType.choices)
    value = serializers.FloatField(default=1.0)
    metadata = serializers.DictField(default=dict, required=False)


class BulkInteractionSerializer(serializers.Serializer):
    """
    Accepts a list of interaction events in one request.
    The frontend batches 30-second intervals and POSTs them here.
    """
    events = BulkInteractionItemSerializer(many=True)


class RecommendedProductSerializer(serializers.Serializer):
    """
    Serializes a single recommendation result dict produced by RecommendationService.

    Input shape (from RecommendationService.get_recommendations)::

        {
            "product": <Product instance>,
            "score":   <float>,
            "reason":  {
                "strategy":    "embedding" | "cold_start",
                # embedding-only fields:
                "cosine":      <float>,
                "popularity":  <float>,
                "in_stock":    <bool>,
                "final_score": <float>,
            }
        }
    """
    product = ProductSerializer(read_only=True)
    score = serializers.FloatField(read_only=True)
    reason = serializers.DictField(read_only=True)

