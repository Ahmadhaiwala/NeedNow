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


def _is_authenticated_user(user):
    """
    Check if user is a valid, authenticated user instance.
    """
    return (
        user is not None
        and getattr(user, "is_authenticated", False)
        and getattr(user, "pk", None) is not None
    )


def compare_products(product_ids):
    """
    Retrieve structured details for up to 4 products for side-by-side comparison.

    Reuses `get_product_details` for consistency and safety.
    """
    if not isinstance(product_ids, list) or not product_ids:
        return {"error": "product_ids must be a non-empty list of product UUID strings."}

    # Limit comparison to a maximum of 4 products to keep payload manageable
    target_ids = product_ids[:4]

    valid_products = []
    errors = []

    for pid in target_ids:
        details = get_product_details(pid)
        if "error" in details:
            errors.append(details)
        else:
            valid_products.append(details)

    return {
        "compared_count": len(valid_products),
        "products": valid_products,
        "errors": errors if errors else None,
    }


from recommendations.services.recommendation_service import RecommendationService


def get_recommendations(user=None, limit=5):
    """
    Retrieve personalized product recommendations for the authenticated user.

    Uses the RecommendationService pipeline (embedding retrieval,
    exclusion filtering, multi-factor ranking). RecommendationService handles
    cold-start fallback internally if user has no embedding or is unauthenticated.

    SECURITY: user parameter must be injected by backend server context,
    NEVER supplied by LLM tool arguments.
    """
    try:
        limit = min(max(int(limit), 1), 10)
    except (ValueError, TypeError):
        limit = 5

    auth_user = user if _is_authenticated_user(user) else None
    service = RecommendationService()

    try:
        recommendation_results = service.get_recommendations(
            user=auth_user,
            limit=limit,
        )
    except Exception as exc:
        return {"error": f"Failed to retrieve recommendations: {str(exc)}"}

    results = []
    for item in recommendation_results:
        product = item["product"]
        results.append({
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
            "in_stock": product.in_stock,
            "stock_quantity": product.stock_quantity,
            "recommendation_score": round(float(item.get("score", 0.0)), 4),
            "reason": item.get("reason", {}),
        })

    return {
        "count": len(results),
        "recommendations": results,
    }


from cart.models import Cart, CartItem
from order.models import Order, OrderItem


def get_cart(user=None):
    """
    Retrieve the current active shopping cart for the authenticated user.
    Read-only operation that does not mutate the database if a cart does not exist.
    """
    if not _is_authenticated_user(user):
        return {"error": "Authentication required to access cart."}

    cart = Cart.objects.filter(user=user, is_active=True).first()
    if not cart:
        return {
            "cart_id": None,
            "item_count": 0,
            "total_quantity": 0,
            "subtotal": 0.0,
            "items": [],
        }

    items = cart.items.select_related("product", "product__category").all()

    cart_items = []
    subtotal = 0.0

    for item in items:
        p = item.product
        unit_price = float(p.price) if p.price is not None else 0.0
        line_total = round(unit_price * item.quantity, 2)
        subtotal += line_total

        cart_items.append({
            "cart_item_id": item.id,
            "product_id": str(p.id),
            "name": p.name,
            "brand": p.brand or None,
            "category": p.category.name if p.category else None,
            "unit_price": unit_price,
            "quantity": item.quantity,
            "line_total": line_total,
            "image_url": p.image_url or None,
            "in_stock": p.in_stock,
            "stock_quantity": p.stock_quantity,
        })

    return {
        "cart_id": cart.id,
        "item_count": len(cart_items),
        "total_quantity": sum(i["quantity"] for i in cart_items),
        "subtotal": round(subtotal, 2),
        "items": cart_items,
    }


def add_to_cart(user=None, product_id=None, quantity=1):
    """
    Add a product to the authenticated user's cart or increase quantity.
    Validates stock availability against existing cart items.
    """
    if not _is_authenticated_user(user):
        return {"error": "Authentication required to modify cart."}

    if not product_id:
        return {"error": "product_id is required."}

    try:
        quantity = int(quantity)
        if quantity < 1:
            return {"error": "Quantity must be at least 1."}
    except (ValueError, TypeError):
        return {"error": "Invalid quantity specified."}

    try:
        product = Product.objects.select_related("category").get(id=product_id)
    except (Product.DoesNotExist, ValueError, TypeError):
        return {"error": f"Product with ID '{product_id}' not found."}

    if not product.in_stock or product.stock_quantity <= 0:
        return {"error": f"Product '{product.name}' is currently out of stock."}

    cart = Cart.objects.filter(user=user, is_active=True).first()
    if not cart:
        cart = Cart.objects.create(user=user, is_active=True)

    item, created = CartItem.objects.get_or_create(
        cart=cart,
        product=product,
        defaults={"quantity": quantity}
    )

    if not created:
        new_quantity = item.quantity + quantity
        if product.stock_quantity > 0 and new_quantity > product.stock_quantity:
            return {
                "error": (
                    f"Cannot add {quantity} more. "
                    f"Cart already contains {item.quantity} and "
                    f"only {product.stock_quantity} are available in stock."
                )
            }
        item.quantity = new_quantity
        item.save(update_fields=["quantity"])
    else:
        if product.stock_quantity > 0 and quantity > product.stock_quantity:
            item.delete()
            return {
                "error": (
                    f"Requested quantity ({quantity}) exceeds available stock ({product.stock_quantity})."
                )
            }

    cart_summary = get_cart(user=user)

    return {
        "message": f"Successfully added {quantity} x '{product.name}' to cart.",
        "added_item": {
            "product_id": str(product.id),
            "name": product.name,
            "quantity_added": quantity,
            "new_total_quantity": item.quantity,
        },
        "cart": cart_summary,
    }


def get_recent_orders(user=None, limit=5):
    """
    Retrieve recent orders for the authenticated user.
    """
    if not _is_authenticated_user(user):
        return {"error": "Authentication required to access orders."}

    try:
        limit = min(max(int(limit), 1), 20)
    except (ValueError, TypeError):
        limit = 5

    orders = (
        Order.objects
        .filter(user=user)
        .prefetch_related("items__product")
        .order_by("-created_at")[:limit]
    )

    results = []
    for order in orders:
        order_items = []
        for item in order.items.all():
            p = item.product
            order_items.append({
                "item_id": item.id,
                "product_id": str(p.id) if p else None,
                "name": p.name if p else "Deleted Product",
                "quantity": item.quantity,
                "unit_price": float(item.unit_price) if item.unit_price is not None else 0.0,
                "total_price": float(item.total_price) if item.total_price is not None else 0.0,
            })

        results.append({
            "order_id": order.id,
            "status": order.status,
            "payment_status": order.payment_status,
            "platform": order.platform,
            "total_amount": float(order.total_amount) if order.total_amount is not None else 0.0,
            "currency": order.currency,
            "created_at": order.created_at.isoformat() if order.created_at else None,
            "item_count": len(order_items),
            "items": order_items,
        })

    return {
        "count": len(results),
        "orders": results,
    }


def get_order_status(user=None, order_id=None):
    """
    Retrieve status details for a specific order belonging to the authenticated user.
    """
    if not _is_authenticated_user(user):
        return {"error": "Authentication required to check order status."}

    if not order_id:
        return {"error": "order_id is required."}

    try:
        order = (
            Order.objects
            .prefetch_related("items__product")
            .get(id=order_id, user=user)
        )
    except (Order.DoesNotExist, ValueError, TypeError):
        return {"error": f"Order with ID '{order_id}' not found or access denied."}

    order_items = []
    for item in order.items.all():
        p = item.product
        order_items.append({
            "item_id": item.id,
            "product_id": str(p.id) if p else None,
            "name": p.name if p else "Deleted Product",
            "quantity": item.quantity,
            "unit_price": float(item.unit_price) if item.unit_price is not None else 0.0,
            "total_price": float(item.total_price) if item.total_price is not None else 0.0,
        })

    return {
        "order_id": order.id,
        "status": order.status,
        "payment_status": order.payment_status,
        "platform": order.platform,
        "total_amount": float(order.total_amount) if order.total_amount is not None else 0.0,
        "currency": order.currency,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "updated_at": order.updated_at.isoformat() if order.updated_at else None,
        "items": order_items,
    }



