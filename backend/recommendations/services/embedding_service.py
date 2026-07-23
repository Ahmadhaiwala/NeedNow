"""
Embedding services for the NeedNow recommendation engine.

Two service classes are provided:
  - ProductEmbeddingService  -- builds and stores 384-dim embeddings for Product objects.
  - UserEmbeddingService     -- builds and stores 384-dim embeddings for User objects using a
                               hybrid strategy: weighted average of interacted product embeddings
                               plus a preference-profile text embedding.

Both services use the `all-MiniLM-L6-v2` SentenceTransformer loaded once at module level
(singleton) for performance.
"""

from __future__ import annotations

import logging
from typing import Optional

import numpy as np
from sentence_transformers import SentenceTransformer

from catalog.models import Product
from recommendations.models import (
    ProductEmbedding,
    UserEmbedding,
    UserInteraction,
    UserPreference,
)
from users.models import User

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Module-level singleton -- loaded once on first import, reused across calls.
# ---------------------------------------------------------------------------
MODEL_NAME = "all-MiniLM-L6-v2"
_model: Optional[SentenceTransformer] = None


def _get_model() -> SentenceTransformer:
    """Return the shared SentenceTransformer instance, initialising it on first call."""
    global _model
    if _model is None:
        logger.info("Loading SentenceTransformer model: %s", MODEL_NAME)
        _model = SentenceTransformer(MODEL_NAME)
    return _model


# ---------------------------------------------------------------------------
# ProductEmbeddingService
# ---------------------------------------------------------------------------

class ProductEmbeddingService:
    """
    Generates and persists 384-dim sentence embeddings for Product objects.

    Text used for embedding:
        "{name}. Category: {category}. Brand: {brand}. Tags: {tags}. Features: {features}"

    - tags and features are joined lists; features are capped at 10 items to avoid
      exceeding the model token limit.
    - Missing / blank fields are omitted gracefully.
    """

    # Maximum number of feature bullet-points to include in the text.
    MAX_FEATURES = 10

    # ------------------------------------------------------------------ #
    # Internal helpers                                                     #
    # ------------------------------------------------------------------ #

    def _build_product_text(self, product: Product) -> str:
        """Construct the text representation of a product for embedding."""
        parts: list[str] = []

        # Product name (always present)
        if product.name:
            parts.append(product.name.strip())

        # Category
        if product.category:
            parts.append(f"Category: {product.category.name}")

        # Brand
        if product.brand:
            parts.append(f"Brand: {product.brand.strip()}")

        # Tags -- stored as JSON list of strings
        if product.tags:
            tags_str = ", ".join(str(t) for t in product.tags if t)
            if tags_str:
                parts.append(f"Tags: {tags_str}")

        # Features -- stored as JSON list; cap at MAX_FEATURES
        if product.features:
            features = product.features[: self.MAX_FEATURES]
            features_str = ". ".join(str(f) for f in features if f)
            if features_str:
                parts.append(f"Features: {features_str}")

        return ". ".join(parts)

    # ------------------------------------------------------------------ #
    # Public API                                                           #
    # ------------------------------------------------------------------ #

    def embed_product(self, product: Product) -> ProductEmbedding:
        """
        Generate and persist an embedding for a single Product.

        If an embedding already exists for this product it is silently overwritten
        (update_or_create).

        Args:
            product: A ``catalog.models.Product`` instance.

        Returns:
            The saved ``ProductEmbedding`` instance.
        """
        model = _get_model()
        text = self._build_product_text(product)
        embedding: np.ndarray = model.encode(text, convert_to_numpy=True)

        product_embedding, _ = ProductEmbedding.objects.update_or_create(
            product=product,
            defaults={
                "embedding": embedding,
                "model_name": MODEL_NAME,
            },
        )

        logger.debug(
            "Saved ProductEmbedding for product_id=%s (shape=%s)",
            product.pk,
            embedding.shape,
        )
        return product_embedding

    def embed_all_products(self, batch_size: int = 256) -> int:
        """
        Generate and persist embeddings for **all** products in the database.

        Products are processed in batches to avoid loading the entire catalogue into
        memory at once. Uses ``select_related("category")`` to prevent N+1 queries.

        Args:
            batch_size: Number of products to encode per batch (default 256).

        Returns:
            Total number of products processed.
        """
        model = _get_model()
        total = 0
        offset = 0

        logger.info("Starting bulk product embedding (batch_size=%d)...", batch_size)

        while True:
            products = list(
                Product.objects.select_related("category").order_by("pk")[
                    offset : offset + batch_size
                ]
            )
            if not products:
                break

            # Build texts for the whole batch, then encode in one model call.
            texts = [self._build_product_text(p) for p in products]
            embeddings: np.ndarray = model.encode(
                texts,
                batch_size=batch_size,
                convert_to_numpy=True,
                show_progress_bar=False,
            )

            # Persist each embedding via update_or_create.
            for product, embedding in zip(products, embeddings):
                ProductEmbedding.objects.update_or_create(
                    product=product,
                    defaults={
                        "embedding": embedding,
                        "model_name": MODEL_NAME,
                    },
                )

            total += len(products)
            offset += batch_size
            logger.info("  Processed %d products so far...", total)

        logger.info("Bulk product embedding complete. Total: %d", total)
        return total


# ---------------------------------------------------------------------------
# UserEmbeddingService
# ---------------------------------------------------------------------------

class UserEmbeddingService:
    """
    Generates and persists 384-dim sentence embeddings for User objects.

    Strategy -- Hybrid (two components, equal weight):

    1. **Interaction component**
       Fetches all UserInteraction rows for the user across all interaction types.
       For each interaction whose product already has a ProductEmbedding, weights
       the embedding by ``UserInteraction.value``.  The weighted mean of those vectors
       becomes the interaction component.

    2. **Preference-profile component**
       Reads the user's UserPreference (category_scores, brand_scores, tag_scores)
       and constructs a short text from the top-5 keys of each score dict, which is
       then encoded into a 384-dim vector.

    The two components are averaged and L2-normalised before saving.

    Fallback:
       If the user has no interactions AND no preference record, the method returns
       None and nothing is written to the database (no-op; handling is deferred).
    """

    # Number of top-scored preference items to include in the profile text.
    TOP_N_PREFERENCES = 5

    # ------------------------------------------------------------------ #
    # Internal helpers                                                     #
    # ------------------------------------------------------------------ #

    def _top_keys(self, score_dict: dict, n: int) -> list[str]:
        """Return up to *n* keys sorted by descending score value."""
        if not score_dict:
            return []
        sorted_keys = sorted(score_dict.items(), key=lambda kv: kv[1], reverse=True)
        return [k for k, _ in sorted_keys[:n]]

    def _build_preference_text(self, preference: UserPreference) -> str:
        """Build a short text profile from a UserPreference object."""
        parts: list[str] = []

        categories = self._top_keys(preference.category_scores, self.TOP_N_PREFERENCES)
        if categories:
            parts.append(f"Categories: {', '.join(categories)}")

        brands = self._top_keys(preference.brand_scores, self.TOP_N_PREFERENCES)
        if brands:
            parts.append(f"Brands: {', '.join(brands)}")

        tags = self._top_keys(preference.tag_scores, self.TOP_N_PREFERENCES)
        if tags:
            parts.append(f"Tags: {', '.join(tags)}")

        return ". ".join(parts)

    def _compute_interaction_embedding(self, user: User) -> Optional[np.ndarray]:
        """
        Compute the weighted mean of product embeddings from user interactions.

        Returns a (384,) numpy array, or None if no valid interactions exist.
        """
        interactions = (
            UserInteraction.objects.filter(user=user, product__isnull=False)
            .select_related("product__embedding")
        )

        weighted_sum = np.zeros(384, dtype=np.float64)
        total_weight = 0.0

        for interaction in interactions:
            try:
                product_embedding: np.ndarray = np.array(
                    interaction.product.embedding.embedding, dtype=np.float64
                )
            except (ProductEmbedding.DoesNotExist, AttributeError):
                # This product has no embedding yet -- skip it.
                continue

            weight = float(interaction.value)
            weighted_sum += product_embedding * weight
            total_weight += weight

        if total_weight == 0.0:
            return None

        return (weighted_sum / total_weight).astype(np.float32)

    def _compute_preference_embedding(self, user: User) -> Optional[np.ndarray]:
        """
        Encode the user preference profile text into a 384-dim vector.

        Returns a (384,) numpy array, or None if the user has no preference record
        or the preference record is entirely empty.
        """
        try:
            preference = user.preference  # OneToOne reverse accessor
        except UserPreference.DoesNotExist:
            return None

        text = self._build_preference_text(preference)
        if not text:
            return None

        model = _get_model()
        return model.encode(text, convert_to_numpy=True).astype(np.float32)

    @staticmethod
    def _l2_normalise(vector: np.ndarray) -> np.ndarray:
        """Return an L2-normalised copy of *vector* (unit length, for cosine similarity)."""
        norm = np.linalg.norm(vector)
        if norm == 0.0:
            return vector
        return vector / norm

    # ------------------------------------------------------------------ #
    # Public API                                                           #
    # ------------------------------------------------------------------ #

    def embed_user(self, user: User) -> Optional[UserEmbedding]:
        """
        Generate and persist a hybrid embedding for a single User.

        If an embedding already exists for this user it is silently overwritten.
        Returns None (no-op) if there is insufficient data to build any embedding.

        Args:
            user: A ``users.models.User`` instance.

        Returns:
            The saved ``UserEmbedding`` instance, or None.
        """
        interaction_vec = self._compute_interaction_embedding(user)
        preference_vec = self._compute_preference_embedding(user)

        # Determine the final embedding from available components.
        if interaction_vec is not None and preference_vec is not None:
            # Hybrid: equal-weight average of both components.
            combined = (interaction_vec + preference_vec) / 2.0
        elif interaction_vec is not None:
            combined = interaction_vec
        elif preference_vec is not None:
            combined = preference_vec
        else:
            # No data available -- skip this user.
            logger.debug(
                "Skipping UserEmbedding for user_id=%s: no interactions or preferences.",
                user.pk,
            )
            return None

        final_embedding = self._l2_normalise(combined)

        user_embedding, _ = UserEmbedding.objects.update_or_create(
            user=user,
            defaults={
                "embedding": final_embedding,
                "model_name": MODEL_NAME,
            },
        )

        logger.debug(
            "Saved UserEmbedding for user_id=%s (shape=%s)",
            user.pk,
            final_embedding.shape,
        )
        return user_embedding

    def embed_all_users(self, batch_size: int = 128) -> int:
        """
        Generate and persist embeddings for **all** active users in the database.

        Processes users in batches. Users without sufficient data are silently skipped.

        Args:
            batch_size: Number of users per batch (default 128).

        Returns:
            Total number of users for whom an embedding was successfully saved.
        """
        total_saved = 0
        total_skipped = 0
        offset = 0

        logger.info("Starting bulk user embedding (batch_size=%d)...", batch_size)

        while True:
            users = list(
                User.objects.filter(is_active=True).order_by("pk")[
                    offset : offset + batch_size
                ]
            )
            if not users:
                break

            for user in users:
                result = self.embed_user(user)
                if result is not None:
                    total_saved += 1
                else:
                    total_skipped += 1

            offset += batch_size
            logger.info(
                "  Processed %d users so far (saved=%d, skipped=%d)...",
                offset,
                total_saved,
                total_skipped,
            )

        logger.info(
            "Bulk user embedding complete. Saved: %d | Skipped (no data): %d",
            total_saved,
            total_skipped,
        )
        return total_saved
