from django.db.models import Q

from catalog.models import Product
from django.db.models import Q
from pgvector.django import CosineDistance

from catalog.models import Product
from recommendations.models import ProductEmbedding
from agent.embeddings import embed_query





def hybrid_search_products(query, limit=10):
    """
    Combine lexical and semantic product retrieval.

    Keyword matches receive a lexical boost while semantic
    similarity provides intent-aware retrieval.
    """

    if not query or not query.strip():
        return []

    # Retrieve a larger candidate pool before ranking.
    candidate_limit = max(limit * 3, 20)

    keyword_results = search_products(
        query,
        limit=candidate_limit,
    )

    query_embedding = embed_query(query)

    semantic_results = semantic_search_products(
        query_embedding,
        limit=candidate_limit,
    )

    products = {}

    # -----------------------
    # Keyword candidates
    # -----------------------

    for product in keyword_results:

        product_id = product["product_id"]

        products[product_id] = {
            **product,
            "keyword_match": True,
            "semantic_similarity": 0.0,
        }

    # -----------------------
    # Semantic candidates
    # -----------------------

    for product in semantic_results:

        product_id = product["product_id"]

        similarity = product.get(
            "semantic_similarity",
            0.0,
        )

        if product_id in products:

            products[product_id][
                "semantic_similarity"
            ] = similarity

        else:

            products[product_id] = {
                **product,
                "keyword_match": False,
            }

    # -----------------------
    # Hybrid scoring
    # -----------------------

    for product in products.values():

        semantic_score = product.get(
            "semantic_similarity",
            0.0,
        )

        keyword_score = (
            1.0
            if product["keyword_match"]
            else 0.0
        )

        product["search_score"] = (
            semantic_score * 0.75
            + keyword_score * 0.25
        )

    ranked = sorted(
        products.values(),
        key=lambda product: product["search_score"],
        reverse=True,
    )

    return ranked[:limit]
import re

from django.db.models import Q
from catalog.models import Product


def search_products(query, limit=10):
    """
    Token-based lexical product search.
    """

    if not query or not query.strip():
        return []

    # Break natural-language query into useful words
    tokens = re.findall(r"\b[a-zA-Z0-9]+\b", query.lower())

    # Remove generic words that aren't useful for product retrieval
    stop_words = {
        "i", "me", "my", "the", "a", "an",
        "to", "for", "of", "and", "or",
        "something", "need", "want", "with",
        "that", "this", "some"
    }

    tokens = [
        token
        for token in tokens
        if token not in stop_words and len(token) >= 2
    ]

    if not tokens:
        return []

    query_filter = Q()

    for token in tokens:
        query_filter |= (
            Q(name__icontains=token)
            | Q(brand__icontains=token)
            | Q(tags__icontains=token)
        )

    products = (
        Product.objects
        .filter(query_filter)
        .filter(in_stock=True)
        .select_related("category")
        .order_by("-popularity_score", "-rating")[:limit]
    )

    return [
        {
            "product_id": str(product.id),
            "name": product.name,
            "brand": product.brand or None,
            "category": (
                product.category.name
                if product.category
                else None
            ),
            "price": (
                float(product.price)
                if product.price is not None
                else None
            ),
            "original_price": (
                float(product.original_price)
                if product.original_price is not None
                else None
            ),
            "rating": float(product.rating),
            "review_count": product.review_count,
            "image_url": product.image_url or None,
            "in_stock": product.in_stock,
            "stock_quantity": product.stock_quantity,
            "tags": product.tags,
        }
        for product in products
    ]

from pgvector.django import CosineDistance

from recommendations.models import ProductEmbedding


def semantic_search_products(query_embedding, limit=10):
    """
    Search products using semantic similarity.

    query_embedding must be a 384-dimensional vector
    generated using the same embedding model used for
    ProductEmbedding.
    """

    if query_embedding is None:
        return []

    results = (
        ProductEmbedding.objects
        .select_related(
            "product",
            "product__category",
        )
        .filter(
            product__in_stock=True,
        )
        .annotate(
            distance=CosineDistance(
                "embedding",
                query_embedding,
            )
        )
        .order_by("distance")[:limit]
    )

    return [
        {
            "product_id": str(item.product.id),
            "name": item.product.name,
            "brand": item.product.brand or None,

            "category": (
                item.product.category.name
                if item.product.category
                else None
            ),

            "price": (
                float(item.product.price)
                if item.product.price is not None
                else None
            ),

            "rating": float(item.product.rating),

            "image_url": item.product.image_url or None,

            # cosine distance:
            # smaller = more semantically similar
            "semantic_similarity": 1.0-float(item.distance),
        }
        for item in results
    ]


def get_product_details(product_id):
    """
    Fetch comprehensive details for a single product by UUID.
    """
    if not product_id:
        return {"error": "Product ID is required."}

    try:
        product = (
            Product.objects
            .select_related("category")
            .get(id=product_id)
        )
    except (Product.DoesNotExist, ValueError, TypeError):
        return {"error": f"Product with ID '{product_id}' not found."}

    return {
        "product_id": str(product.id),
        "name": product.name,
        "brand": product.brand or None,
        "category": (
            product.category.name
            if product.category
            else None
        ),
        "price": (
            float(product.price)
            if product.price is not None
            else None
        ),
        "original_price": (
            float(product.original_price)
            if product.original_price is not None
            else None
        ),
        "rating": float(product.rating) if product.rating is not None else 0.0,
        "review_count": product.review_count,
        "image_url": product.image_url or None,
        "features": product.features or [],
        "description": product.description or [],
        "specifications": product.specifications or {},
        "tags": product.tags or [],
        "bought_together": product.bought_together or [],
        "in_stock": product.in_stock,
        "stock_quantity": product.stock_quantity,
    }