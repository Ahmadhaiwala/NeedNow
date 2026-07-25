from collections import defaultdict


INTERACTION_WEIGHTS = {
    "view": 1.0,
    "click": 2.0,
    "wishlist": 3.0,
    "cart": 4.0,
    "purchase": 5.0,
    "search": 1.5,

    "remove_cart": -2.0,
    "remove_wishlist": -2.0,
}


import numpy as np

from recommendations.models import ProductEmbedding


def cosine_similarity(vector_a, vector_b):
    """
    Calculate cosine similarity between two vectors.
    """

    a = np.array(vector_a, dtype=np.float32)
    b = np.array(vector_b, dtype=np.float32)

    denominator = np.linalg.norm(a) * np.linalg.norm(b)

    if denominator == 0:
        return 0.0

    return float(np.dot(a, b) / denominator)


def group_related_interests(signals, similarity_threshold=0.55):
    """
    Groups product interest signals using semantic similarity
    between their ProductEmbedding vectors.

    This is a simple V1 clustering approach.
    """

    if not signals:
        return []

    product_ids = [
        signal["product_id"]
        for signal in signals
    ]

    embeddings = ProductEmbedding.objects.filter(
        product_id__in=product_ids
    )

    embedding_map = {
        str(item.product_id): list(item.embedding)
        for item in embeddings
    }

    clusters = []

    for signal in signals:

        product_id = signal["product_id"]

        embedding = embedding_map.get(product_id)

        if embedding is None:
            continue

        added_to_cluster = False

        for cluster in clusters:

            similarities = [
                cosine_similarity(
                    embedding,
                    member["embedding"]
                )
                for member in cluster["members"]
            ]

            average_similarity = (
                sum(similarities) / len(similarities)
            )

            if average_similarity >= similarity_threshold:

                cluster["members"].append({
                    **signal,
                    "embedding": embedding,
                })

                added_to_cluster = True
                break

        if not added_to_cluster:

            clusters.append({
                "members": [
                    {
                        **signal,
                        "embedding": embedding,
                    }
                ]
            })

    # Calculate total evidence score for each cluster
    for cluster in clusters:

        cluster["score"] = sum(
            member["score"]
            for member in cluster["members"]
        )

    # Strongest clusters first
    clusters.sort(
        key=lambda cluster: cluster["score"],
        reverse=True
    )

    # Remove embeddings before returning.
    # We don't want to send 384 floats/product to the LLM.
    cleaned_clusters = []

    for cluster in clusters:

        cleaned_clusters.append({
            "score": cluster["score"],

            "products": [
                {
                    "product_id": member["product_id"],
                    "product_name": member["product_name"],
                    "score": member["score"],
                }
                for member in cluster["members"]
            ]
        })

    return cleaned_clusters

def build_interest_signals(context):
    """
    Converts raw user context into weighted product-level interest signals.

    This does NOT infer projects yet.
    It only determines which products currently provide the
    strongest evidence about the user's interests.
    """

    signals = defaultdict(lambda: {
        "product_name": None,
        "score": 0.0,
        "sources": [],
    })

    # ----------------------------------
    # Recent interactions
    # ----------------------------------

    for interaction in context.get("recent_interactions", []):

        product_id = interaction.get("product_id")

        if not product_id:
            continue

        interaction_type = interaction.get("type")

        weight = INTERACTION_WEIGHTS.get(
            interaction_type,
            0.0
        )

        # Some of your events already contain negative values
        # for removals, so respect that as well.
        event_value = interaction.get("value", 1.0)

        if event_value < 0:
            weight = -abs(weight)

        signal = signals[product_id]

        signal["product_name"] = interaction.get(
            "product_name"
        )

        signal["score"] += weight

        signal["sources"].append({
            "type": interaction_type,
            "weight": weight,
            "created_at": interaction.get("created_at"),
        })

    # ----------------------------------
    # Actual purchases
    # ----------------------------------

    for purchase in context.get("recent_purchases", []):

        product_id = purchase.get("product_id")

        if not product_id:
            continue

        quantity = purchase.get("quantity", 1)

        # Purchases are much stronger evidence
        # than views/clicks.
        weight = 6.0 * min(quantity, 3)

        signal = signals[product_id]

        signal["product_name"] = purchase.get(
            "product_name"
        )

        signal["score"] += weight

        signal["sources"].append({
            "type": "purchase",
            "weight": weight,
            "created_at": purchase.get("purchased_at"),
        })

    # ----------------------------------
    # Sort strongest → weakest
    # ----------------------------------

    result = [
        {
            "product_id": product_id,
            **data,
        }
        for product_id, data in signals.items()
    ]

    result.sort(
        key=lambda item: item["score"],
        reverse=True
    )

    return result