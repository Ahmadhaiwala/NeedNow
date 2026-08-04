"""
RecommendationService
=====================
Orchestrates the full recommendation pipeline for a single user:

    1. Fetch user embedding  (from UserEmbedding, built by UserEmbeddingService)
    2. Retrieve candidates   (pgvector ANN cosine query; numpy fallback if no index yet)
    3. Filter exclusions     (products the user has already interacted with)
    4. Rank candidates       (weighted blend of cosine + popularity + in_stock + recency)
    5. Return results        (list of {product, score, reason} dicts)

Cold-start (no embedding): returns the most popular in-stock products.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

import numpy as np
from django.db import OperationalError, ProgrammingError
from django.db.models import QuerySet

from catalog.models import Product
from recommendations.models import ProductEmbedding, UserEmbedding, UserInteraction
from users.models import User

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Ranking weight constants  (must sum to 1.0)
# ---------------------------------------------------------------------------
W_COSINE: float = 0.65      # Semantic similarity to user embedding
W_POPULARITY: float = 0.15   # Product.popularity_score (normalised)
W_IN_STOCK: float = 0.15     # +0.10 if in_stock, else 0.0
W_RECENCY: float = 0.05      # Recency score based on Product.updated_at

# ---------------------------------------------------------------------------
# Pipeline configuration defaults
# ---------------------------------------------------------------------------
DEFAULT_TOP_K: int = 50      # Number of candidates retrieved from the DB
DEFAULT_LIMIT: int = 20      # Number of final recommendations returned to caller

# Recency half-life in days: products updated within this window score close to 1.0
RECENCY_HALF_LIFE_DAYS: float = 30.0


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Return cosine similarity between two 1-D vectors."""
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def _recency_score(updated_at: datetime) -> float:
    """
    Exponential decay score in [0, 1].
    Products updated today => ~1.0; score halves every RECENCY_HALF_LIFE_DAYS days.
    """
    now = datetime.now(tz=timezone.utc)
    if updated_at.tzinfo is None:
        updated_at = updated_at.replace(tzinfo=timezone.utc)
    age_days = max((now - updated_at).total_seconds() / 86400.0, 0.0)
    return float(2 ** (-age_days / RECENCY_HALF_LIFE_DAYS))


def _normalise_popularity(popularity_score: float, max_score: float) -> float:
    """Normalise a raw popularity_score to [0, 1] given the batch maximum."""
    if max_score <= 0:
        return 0.0
    return min(float(popularity_score) / max_score, 1.0)


# ---------------------------------------------------------------------------
# RecommendationService
# ---------------------------------------------------------------------------

class RecommendationService:
    """
    Recommendation pipeline service.

    Usage::

        service = RecommendationService()
        results = service.get_recommendations(user, top_k=50, limit=20)

        # Each result is a dict:
        # {
        #     "product": <Product instance>,
        #     "score":   <float>,
        #     "reason":  {"strategy": "embedding", "score": 0.843}
        #                 or {"strategy": "cold_start"}
        # }
    """

    # ------------------------------------------------------------------ #
    # Step 1 -- Fetch user embedding                                       #
    # ------------------------------------------------------------------ #

    def _get_user_embedding(self, user: User) -> Optional[np.ndarray]:
        """
        Return the user's 384-dim embedding as a numpy array.
        If no UserEmbedding record exists in DB, attempts on-the-fly generation
        via UserEmbeddingService. Returns None if there is insufficient interaction/preference data.
        """
        if not user or not getattr(user, "pk", None):
            return None

        try:
            ue = UserEmbedding.objects.get(user=user)
            return np.array(ue.embedding, dtype=np.float32)
        except UserEmbedding.DoesNotExist:
            try:
                from recommendations.services.embedding_service import UserEmbeddingService
                ue = UserEmbeddingService().embed_user(user)
                if ue is not None and ue.embedding is not None:
                    return np.array(ue.embedding, dtype=np.float32)
            except Exception as exc:
                logger.warning(
                    "On-the-fly UserEmbedding generation failed for user_id=%s: %s",
                    getattr(user, "pk", None),
                    exc,
                )
            return None

    # ------------------------------------------------------------------ #
    # Step 2 -- Retrieve candidates                                        #
    # ------------------------------------------------------------------ #

    def _retrieve_candidates_pgvector(
        self,
        user_vec: np.ndarray,
        top_k: int,
        exclude_product_ids: set,
    ) -> list[tuple[Product, float]]:
        """
        Use pgvector's cosine distance operator (<=>)  to retrieve the nearest
        ``top_k`` ProductEmbeddings, then join with the Product table.

        Returns a list of (Product, cosine_similarity) tuples.
        Raises OperationalError / ProgrammingError if the index does not exist yet
        (caller should fall back to numpy path).
        """
        from pgvector.django import CosineDistance

        # Convert to list for pgvector compatibility
        vec_list = user_vec.tolist()

        qs = (
            ProductEmbedding.objects
            .annotate(distance=CosineDistance("embedding", vec_list))
            .select_related("product__category")
            .order_by("distance")          # ascending: smaller distance = more similar
        )

        if exclude_product_ids:
            qs = qs.exclude(product_id__in=exclude_product_ids)

        results = []
        for pe in qs[:top_k]:
            cosine_sim = 1.0 - float(pe.distance)  # distance -> similarity
            results.append((pe.product, cosine_sim))

        return results

    def _retrieve_candidates_numpy(
        self,
        user_vec: np.ndarray,
        top_k: int,
        exclude_product_ids: set,
    ) -> list[tuple[Product, float]]:
        """
        Fallback: load all ProductEmbeddings into memory and compute cosine
        similarity in numpy.  Only used when the pgvector index is not yet
        available.
        """
        logger.warning(
            "pgvector retrieval unavailable -- falling back to numpy similarity. "
            "This is slower; run migrations and build the ANN index when ready."
        )
        qs = (
            ProductEmbedding.objects
            .select_related("product__category")
        )
        if exclude_product_ids:
            qs = qs.exclude(product_id__in=exclude_product_ids)

        scored = []
        for pe in qs:
            product_vec = np.array(pe.embedding, dtype=np.float32)
            sim = _cosine_similarity(user_vec, product_vec)
            scored.append((pe.product, sim))

        # Sort descending by similarity, take top_k
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:top_k]

    def _retrieve_candidates(
        self,
        user_vec: np.ndarray,
        top_k: int,
        exclude_product_ids: set,
    ) -> list[tuple[Product, float]]:
        """
        Try pgvector retrieval first; fall back to numpy on failure.
        Returns a list of (Product, cosine_similarity) tuples.
        """
        try:
            return self._retrieve_candidates_pgvector(
                user_vec, top_k, exclude_product_ids
            )
        except (OperationalError, ProgrammingError, ImportError, Exception) as exc:
            logger.debug("pgvector retrieval failed (%s), using numpy fallback.", exc)
            return self._retrieve_candidates_numpy(
                user_vec, top_k, exclude_product_ids
            )

    # ------------------------------------------------------------------ #
    # Step 3 -- Build exclusion set                                        #
    # ------------------------------------------------------------------ #

    def _get_excluded_product_ids(self, user: User) -> set:
        """
        Return the set of product IDs to exclude from recommendations.

        Only products the user has **purchased** or **added to cart** are excluded.
        Views, clicks, wishlists, ratings etc. remain eligible so the user can still
        be recommended products they have browsed but not bought.
        """
        if not user or not getattr(user, "pk", None):
            return set()

        ids = (
            UserInteraction.objects
            .filter(
                user=user,
                product__isnull=False,
                interaction_type__in=["purchase", "cart"],
            )
            .values_list("product_id", flat=True)
            .distinct()
        )
        return set(ids)

    # ------------------------------------------------------------------ #
    # Step 4 -- Rank candidates                                            #
    # ------------------------------------------------------------------ #

    def _rank_candidates(
        self,
        candidates: list[tuple[Product, float]],
    ) -> list[dict]:
        """
        Score each candidate using a weighted blend:

            score = W_COSINE    * cosine_sim
                  + W_POPULARITY * normalised_popularity
                  + W_IN_STOCK   * (1.0 if in_stock else 0.0)
                  + W_RECENCY    * recency_score

        Returns a list of result dicts sorted by descending score.
        """
        if not candidates:
            return []

        # Normalise popularity scores relative to this candidate batch
        max_popularity = max(
            (float(p.popularity_score) for p, _ in candidates),
            default=1.0
        ) or 1.0

        ranked = []
        for product, cosine_sim in candidates:
            norm_pop = _normalise_popularity(float(product.popularity_score), max_popularity)
            stock_score = 1.0 if product.in_stock else 0.0
            rec_score = _recency_score(product.updated_at)

            final_score = (
                W_COSINE     * cosine_sim
                + W_POPULARITY * norm_pop
                + W_IN_STOCK   * stock_score
                + W_RECENCY    * rec_score
            )

            ranked.append({
                "product": product,
                "score": round(final_score, 6),
                "reason": {
                    "strategy": "embedding",
                    "score": round(final_score, 6),
                },
            })

        ranked.sort(key=lambda x: x["score"], reverse=True)
        return ranked

    # ------------------------------------------------------------------ #
    # Cold-start fallback                                                  #
    # ------------------------------------------------------------------ #

    def _cold_start(self, limit: int) -> list[dict]:
        """
        Return the best in-stock products for users with no embedding.

        Ranking uses a blended score:
            score = 0.70 * norm_popularity + 0.30 * norm_rating

        where norm_popularity is normalised within the candidate batch and
        norm_rating is normalised against a max of 5.0.

        Falls back gracefully to all products if none are in stock.
        """
        logger.info("Cold-start: no user embedding found, returning popular products.")

        # Over-fetch so re-ranking by the blended score has enough candidates.
        qs = (
            Product.objects
            .filter(in_stock=True)
            .select_related("category")
            .order_by("-popularity_score", "-rating")[: limit * 3]
        )
        candidates = list(qs)

        if not candidates:
            # Absolute fallback: any product, no in_stock filter
            candidates = list(
                Product.objects
                .select_related("category")
                .order_by("-popularity_score", "-rating")[: limit * 3]
            )

        # Normalise popularity within this batch
        max_pop = max((float(p.popularity_score) for p in candidates), default=1.0) or 1.0

        def _blend(product: Product) -> float:
            norm_pop = min(float(product.popularity_score) / max_pop, 1.0)
            norm_rating = min(float(product.rating) / 5.0, 1.0)
            return 0.70 * norm_pop + 0.30 * norm_rating

        candidates.sort(key=_blend, reverse=True)

        return [
            {
                "product": product,
                "score": round(_blend(product), 6),
                "reason": {"strategy": "cold_start"},
            }
            for product in candidates[:limit]
        ]

    # ------------------------------------------------------------------ #
    # Public API                                                           #
    # ------------------------------------------------------------------ #

    def get_recommendations(
        self,
        user: User,
        top_k: int = DEFAULT_TOP_K,
        limit: int = DEFAULT_LIMIT,
    ) -> list[dict]:
        """
        Run the full recommendation pipeline for ``user``.

        Args:
            user:   Authenticated ``users.models.User`` instance.
            top_k:  Number of candidate products retrieved from the vector store
                    before re-ranking (default: ``DEFAULT_TOP_K`` = 50).
            limit:  Maximum number of final recommendations returned
                    (default: ``DEFAULT_LIMIT`` = 20).

        Returns:
            A list of up to ``limit`` dicts, each containing::

                {
                    "product": <Product>,          # full ORM instance
                    "score":   <float>,            # final blended ranking score
                    "reason": {
        "strategy": "embedding",
        "cosine": round(cosine_sim, 4),
        "popularity": round(norm_pop, 4),
        "in_stock": product.in_stock,
        "final_score": round(final_score, 4)
    }
                }

            Results are sorted by ``score`` in descending order.
        """
        # -- Step 1: Fetch user embedding --------------------------------
        user_vec = self._get_user_embedding(user)

        if user_vec is None:
            # Cold-start path
            return self._cold_start(limit)

        # -- Step 2 & 3: Exclude interacted products, retrieve candidates -
        exclude_ids = self._get_excluded_product_ids(user)
        candidates = self._retrieve_candidates(user_vec, top_k, exclude_ids)

        if not candidates:
            # No candidate products found at all -- fall back to cold-start
            logger.info(
                "No embedding candidates for user_id=%s (exclusions may have emptied the pool). "
                "Falling back to cold-start.",
                user.pk,
            )
            return self._cold_start(limit)

        # -- Step 4: Rank ------------------------------------------------
        ranked = self._rank_candidates(candidates)

        # -- Step 5: Trim to limit ---------------------------------------
        return ranked[:limit]
