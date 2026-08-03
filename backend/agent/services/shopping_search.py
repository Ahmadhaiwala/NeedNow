"""
SerpApi Google Shopping integration for external product search.

Provides real-world marketplace product search and price comparison
as an agent tool alongside the internal NeedNow catalog.
"""
import os
import logging
import requests
import re
from django.core.cache import cache

logger = logging.getLogger(__name__)


def search_external_products(query, min_price=None, max_price=None, limit=10):
    """
    Search real external shopping listings using SerpApi Google Shopping.
    
    Args:
        query: Product search query (e.g., "RTX 4060 gaming laptop")
        min_price: Minimum price filter (optional)
        max_price: Maximum price filter (optional)
        limit: Maximum results to return (default 8, max 15)
    
    Returns:
        dict with:
            - success: bool
            - results: list of normalized products
            - count: int
            - error: str (if success=False)
    """
    # Validate and normalize parameters
    if not query or not isinstance(query, str) or not query.strip():
        return {
            "success": False,
            "error": "Search query is required.",
        }
    
    query = query.strip()
    
    # Enforce result limits for API quota management
    try:
        limit = min(max(int(limit), 1), 15)
    except (ValueError, TypeError):
        limit = 8
    
    # Check cache first (15 min cache)
    # Use hash for cache key to avoid special character warnings
    import hashlib
    cache_key = f"serp_shopping_{hashlib.md5(f'{query}:{min_price}:{max_price}:{limit}'.encode()).hexdigest()}"
    cached_result = cache.get(cache_key)
    if cached_result:
        logger.debug(f"External shopping cache HIT: {query[:50]}")
        return cached_result
    
    # Load API key from environment
    api_key = os.getenv("SERP_API")
    if not api_key:
        logger.error("SERP_API environment variable not set")
        return {
            "success": False,
            "error": "External shopping search is temporarily unavailable.",
        }
    
    # Build SerpApi request
    logger.info(f"External shopping query: {query}")
    
    url = "https://serpapi.com/search"
    params = {
        "engine": "google_shopping",
        "q": query,
        "api_key": api_key,
    }
    
    try:
        logger.debug("SerpApi request started")
        response = requests.get(url, params=params, timeout=10)
        
        if not response.ok:
            logger.error(f"SerpApi HTTP error: {response.status_code}")
            return {
                "success": False,
                "error": "External shopping search is temporarily unavailable.",
            }
        
        data = response.json()
        
        # Check for SerpApi errors
        if "error" in data:
            logger.error(f"SerpApi error: {data['error']}")
            return {
                "success": False,
                "error": "External shopping search encountered an error.",
            }
        
        # Extract shopping results
        shopping_results = data.get("shopping_results", [])
        
        if not shopping_results:
            logger.info("SerpApi returned 0 shopping results")
            return {
                "success": True,
                "results": [],
                "count": 0,
            }
        
        logger.info(f"SerpApi returned {len(shopping_results)} shopping results")
        
        # Normalize products
        normalized = []
        for result in shopping_results:
            product = _normalize_shopping_result(result)
            if product:
                # Apply price filters
                if min_price is not None and product.get("price"):
                    if product["price"] < min_price:
                        continue
                if max_price is not None and product.get("price"):
                    if product["price"] > max_price:
                        continue
                
                normalized.append(product)
        
        # Apply diversity: try to get variety of merchants
        diverse_results = _apply_merchant_diversity(normalized, limit)
        
        logger.info(f"Normalized {len(diverse_results)} products")
        
        result = {
            "success": True,
            "results": diverse_results,
            "count": len(diverse_results),
        }
        
        # Cache for 15 minutes
        cache.set(cache_key, result, timeout=900)
        logger.debug("External search completed")
        
        return result
    
    except requests.Timeout:
        logger.error("SerpApi request timeout")
        return {
            "success": False,
            "error": "External shopping search timed out.",
        }
    except requests.RequestException as exc:
        logger.error(f"SerpApi request failed: {exc}")
        return {
            "success": False,
            "error": "External shopping search is temporarily unavailable.",
        }
    except Exception as exc:
        logger.exception(f"Unexpected error in external shopping search: {exc}")
        return {
            "success": False,
            "error": "External shopping search encountered an unexpected error.",
        }


def _parse_price(price_str):
    """
    Safely extract numeric price from string like "$1,299.99" or "₹899".
    Returns None if parsing fails.
    """
    if not price_str:
        return None
    
    # Remove currency symbols and commas
    clean = re.sub(r'[^\d.]', '', str(price_str))
    
    try:
        return float(clean)
    except (ValueError, TypeError):
        return None


def _normalize_shopping_result(result):
    """
    Normalize a single SerpApi shopping result into consistent format.
    
    Returns dict with normalized fields or None if critical data missing.
    """
    # Require title at minimum
    title = result.get("title")
    if not title:
        return None
    
    # Parse price (prefer extracted_price if available)
    price_str = result.get("extracted_price") or result.get("price")
    price = _parse_price(price_str)
    
    # Get display price (formatted string)
    display_price = result.get("price") or (f"${price:.2f}" if price else None)
    
    # Extract merchant/source
    source = result.get("source") or result.get("seller") or "Online Store"
    
    # Build normalized product
    normalized = {
        "source": "google_shopping",
        "marketplace": source,
        "title": title,
        "price": price,
        "display_price": display_price,
        "currency": "USD",  # SerpApi typically returns USD, adjust if needed
        "rating": result.get("rating"),
        "reviews": result.get("reviews") or result.get("reviews_count"),
        "thumbnail": result.get("thumbnail"),
        "product_link": result.get("link") or result.get("product_link"),
        "delivery": result.get("delivery") or result.get("shipping"),
        "position": result.get("position"),
    }
    
    return normalized


def _apply_merchant_diversity(products, limit):
    """
    Select diverse results across different merchants when possible.
    
    Prioritizes showing products from different stores rather than
    many results from the same merchant.
    """
    if not products or len(products) <= limit:
        return products[:limit]
    
    seen_merchants = set()
    diverse = []
    remaining = []
    
    # First pass: take one from each unique merchant
    for product in products:
        merchant = product.get("marketplace", "Unknown")
        if merchant not in seen_merchants:
            diverse.append(product)
            seen_merchants.add(merchant)
            if len(diverse) >= limit:
                return diverse
        else:
            remaining.append(product)
    
    # Second pass: fill remaining slots
    diverse.extend(remaining[:limit - len(diverse)])
    
    return diverse[:limit]
