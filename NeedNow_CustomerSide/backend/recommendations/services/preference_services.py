"""
PreferenceService
=================
Converts raw UserInteraction events into an interpretable UserPreference profile.

Architecture role
-----------------
UserInteraction
        |
        +------------------------+
        |                        |
        v                        v
  UserPreference          Behavioral UserEmbedding
  (category/brand/tag     (weighted product embeddings
   preference scores)      -> UserEmbeddingService)
        |                        |
        +-----------+------------+
                    |
                    v
             Recommendation
                Ranking

Storage contract
----------------
- ``UserPreference.category_scores`` / ``brand_scores`` / ``tag_scores`` store **raw**
  (un-normalised) cumulative weighted scores.  Raw scores preserve relative magnitude
  and support the incremental decay formula.
- ``UserPreference.last_calculated_at`` records the wall-clock T0 used when scores
  were last computed, enabling exact incremental exponential decay without rescanning
  history.
- ``normalize_scores()`` converts raw -> [0, 1] for ranking consumption.
- Affinity helper methods (``get_category_affinity`` etc.) return normalised values.

Explicit vs behavioural preferences
------------------------------------
This service writes to ``category_scores``, ``brand_scores``, and ``tag_scores``
exclusively from **behavioural** signals (UserInteraction events).

Explicit user-selected interests are not yet modelled in the current schema.  When
they are added (e.g. ``UserPreference.explicit_category_interests``), this service
must not overwrite those fields -- they should be managed by a separate user-settings
endpoint.

Incremental decay strategy
---------------------------
Exponential decay is applied exactly on incremental updates:

    new_score = old_score * decay(now - last_calculated_at) + new_contribution

This is O(1) -- no history rescan.  ``last_calculated_at`` is advanced to ``now``
after each successful incremental update.

Hybrid correctness approach
----------------------------
- Real-time:  ``update_preferences_from_interaction()`` -- exact incremental update.
- Periodic:   ``rebuild_user_preferences()`` (via management command) -- full
              historical recalculation.  Use this for initial backfill and to correct
              accumulated drift (e.g. after changing INTERACTION_WEIGHTS).
"""

from __future__ import annotations

import logging
import math
from collections import defaultdict
from datetime import datetime, timezone
from typing import Dict, Iterable, List, Optional, Tuple

from django.db import transaction

from catalog.models import Category, Product
from recommendations.models import (
    InteractionType,
    UserInteraction,
    UserPreference,
)
from users.models import User

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Centralized interaction -> preference weight map.
# Positive values increase preference; negative values decrease it.
# ``None`` means the weight is derived dynamically from ``interaction.value``.
INTERACTION_WEIGHTS: Dict[str, Optional[float]] = {
    InteractionType.VIEW:             1.0,
    InteractionType.CLICK:            2.0,
    InteractionType.WISHLIST:         3.0,
    InteractionType.CART:             4.0,
    InteractionType.PURCHASE:         5.0,
    InteractionType.RATING:           None,   # Scaled from interaction.value (1-5 stars)
    InteractionType.UPDATE_CART:      1.0,    # Re-engagement = mild positive
    InteractionType.REMOVE_WISHLIST:  -2.0,   # Negative signal
    InteractionType.REMOVE_CART:      -1.5,   # Negative signal (weaker than remove_wishlist)
    InteractionType.SEARCH:           0.0,    # No product -> no preference signal
}

# Half-life for exponential time decay.
# After DECAY_HALF_LIFE_DAYS days, an interaction's effective weight is halved.
# Configurable: increase for longer memory, decrease for faster forgetting.
DECAY_HALF_LIFE_DAYS: float = 30.0

# Category score propagation: weights applied at [child, parent, grandparent, ...].
# Each level's score contribution is this fraction of the direct interaction weight.
# E.g. [1.0, 0.5, 0.25] -> full weight at direct category, half at parent, quarter at grandparent.
CATEGORY_PROPAGATION_WEIGHTS: List[float] = [1.0, 0.5, 0.25]

# Minimum propagation factor; ancestors beyond this weight are skipped.
CATEGORY_PROPAGATION_MIN: float = 0.05

# Top-N limits -- prevents unbounded growth in active users.
TOP_N_TAGS: int = 50
TOP_N_BRANDS: int = 100
TOP_N_CATEGORIES: int = 100


# ---------------------------------------------------------------------------
# Pure utility: time decay
# ---------------------------------------------------------------------------

def compute_time_decay(
    timestamp: datetime,
    now: Optional[datetime] = None,
    half_life_days: float = DECAY_HALF_LIFE_DAYS,
) -> float:
    """
    Return an exponential decay factor in (0.0, 1.0] for an event at ``timestamp``.

    Formula:  decay = 2^( -age_days / half_life_days )

    - A fresh event (age_days=0) returns 1.0.
    - An event ``half_life_days`` old returns 0.5.

    Reusable: ``embedding_service.py`` can import this function directly.

    Args:
        timestamp:      UTC-aware (or naive UTC) datetime of the event.
        now:            Reference datetime (defaults to ``datetime.now(UTC)``).
        half_life_days: Number of days after which weight halves (default 30).

    Returns:
        float in (0.0, 1.0].
    """
    if now is None:
        now = datetime.now(tz=timezone.utc)

    # Ensure both datetimes are UTC-aware for safe subtraction.
    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)

    age_days = max((now - timestamp).total_seconds() / 86400.0, 0.0)
    return math.pow(2.0, -age_days / half_life_days)


# ---------------------------------------------------------------------------
# PreferenceService
# ---------------------------------------------------------------------------

class PreferenceService:
    """
    Converts UserInteraction events into UserPreference profiles.

    Usage - Incremental (real-time, called from views/signals)::

        svc = PreferenceService()
        svc.update_preferences_from_interaction(interaction)

    Usage - Bulk incremental (after bulk_create)::

        svc.update_preferences_from_interactions(interactions)

    Usage - Full rebuild (management command / backfill)::

        svc.rebuild_user_preferences(user)
        svc.rebuild_all_user_preferences(batch_size=200)

    Usage - Affinity queries (from ranking service)::

        svc.get_category_affinity(user, category)
        svc.get_brand_affinity(user, "ASUS")
        svc.get_tag_affinity(user, "gaming")
    """

    # ------------------------------------------------------------------ #
    # Internal: weight helpers                                             #
    # ------------------------------------------------------------------ #

    def _get_effective_weight(self, interaction: UserInteraction) -> float:
        """
        Return the base preference contribution weight for a single interaction.

        - For most types, returns the configured ``INTERACTION_WEIGHTS`` value.
        - For ``rating``, scales linearly from the 1-5 star value stored in
          ``interaction.value``: a 5-star rating = weight 5.0.
        - For unknown types, returns 0.0 (safe no-op).
        """
        itype = interaction.interaction_type
        configured = INTERACTION_WEIGHTS.get(itype, 0.0)

        if configured is None:
            # Dynamic weight: rating uses the stored star value directly.
            return float(interaction.value)

        return float(configured)

    def _score_for_interaction(
        self,
        interaction: UserInteraction,
        now: datetime,
    ) -> float:
        """
        Return the decay-adjusted score contribution for one interaction.

        effective_score = interaction_weight * time_decay(created_at)
        """
        weight = self._get_effective_weight(interaction)
        if weight == 0.0:
            return 0.0
        decay = compute_time_decay(interaction.created_at, now=now)
        return weight * decay

    # ------------------------------------------------------------------ #
    # Internal: category hierarchy                                         #
    # ------------------------------------------------------------------ #

    def _get_category_ancestors(
        self,
        category: Category,
    ) -> List[Tuple[Category, float]]:
        """
        Walk the category parent chain and return [(category, propagation_weight), ...].

        The direct category has propagation weight ``CATEGORY_PROPAGATION_WEIGHTS[0]`` (1.0).
        Each parent level is multiplied by the next weight in the list.
        Walking stops when the list is exhausted or the weight drops below
        ``CATEGORY_PROPAGATION_MIN``.

        Example with CATEGORY_PROPAGATION_WEIGHTS = [1.0, 0.5, 0.25]:
            Gaming Laptop   -> 1.0
            Laptops         -> 0.5
            Electronics     -> 0.25
        """
        result: List[Tuple[Category, float]] = []
        current = category
        level = 0

        while current is not None:
            if level >= len(CATEGORY_PROPAGATION_WEIGHTS):
                break
            prop_weight = CATEGORY_PROPAGATION_WEIGHTS[level]
            if prop_weight < CATEGORY_PROPAGATION_MIN:
                break
            result.append((current, prop_weight))
            current = current.parent  # May be None (root category)
            level += 1

        return result

    # ------------------------------------------------------------------ #
    # Internal: applying one interaction to score dicts                    #
    # ------------------------------------------------------------------ #

    def _apply_interaction_to_scores(
        self,
        interaction: UserInteraction,
        cat_scores: Dict[str, float],
        brand_scores: Dict[str, float],
        tag_scores: Dict[str, float],
        now: datetime,
    ) -> None:
        """
        Compute score contribution from one interaction and accumulate into the
        three score dicts in-place.  Handles missing product, brand, and tags safely.

        Category and brand keys use the **slug** (stable) for categories, and the
        **raw brand string** lowercased for brands (stable across renames).

        Args:
            interaction:  A UserInteraction (must have product pre-fetched).
            cat_scores:   Mutable dict keyed by category slug.
            brand_scores: Mutable dict keyed by brand name (lowercase).
            tag_scores:   Mutable dict keyed by tag string (lowercase).
            now:          Reference datetime for decay calculation.
        """
        product: Optional[Product] = interaction.product
        if product is None:
            # search or other product-less events -> no preference signal
            return

        base_score = self._score_for_interaction(interaction, now)
        if base_score == 0.0:
            return

        # --- Category scores (with parent propagation) ---
        if product.category_id is not None:
            # Assumes category (and its parent chain) is pre-fetched by caller.
            category = product.category
            for cat, prop_weight in self._get_category_ancestors(category):
                key = cat.slug
                cat_scores[key] = cat_scores.get(key, 0.0) + base_score * prop_weight

        # --- Brand scores ---
        brand = (product.brand or "").strip()
        if brand:
            brand_key = brand.lower()
            brand_scores[brand_key] = brand_scores.get(brand_key, 0.0) + base_score

        # --- Tag scores ---
        if product.tags:
            for tag in product.tags:
                tag_str = str(tag).strip().lower()
                if tag_str:
                    tag_scores[tag_str] = tag_scores.get(tag_str, 0.0) + base_score

    # ------------------------------------------------------------------ #
    # Internal: trimming and normalisation                                  #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _trim_scores(scores: Dict[str, float], top_n: int) -> Dict[str, float]:
        """
        Keep only the ``top_n`` highest-scoring keys.

        Prevents unbounded growth for active users with diverse interactions.
        Returns a new dict (does not mutate the input).
        """
        if len(scores) <= top_n:
            return scores
        sorted_items = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)
        return dict(sorted_items[:top_n])

    @staticmethod
    def normalize_scores(scores: Dict[str, float]) -> Dict[str, float]:
        """
        Normalise raw scores to [0, 1] by dividing by the maximum value.

        The top-scored key becomes 1.0; all others are proportional.
        An empty dict or all-zero dict returns an empty dict.

        This is called by the ranking layer -- not stored in the database.
        """
        if not scores:
            return {}
        max_score = max(scores.values())
        if max_score <= 0.0:
            return {}
        return {k: v / max_score for k, v in scores.items()}

    # ------------------------------------------------------------------ #
    # Internal: preference load / save helpers                             #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _load_or_create_preference(
        user: User,
        lock: bool = False,
    ) -> UserPreference:
        """
        Return (possibly creating) the UserPreference row for ``user``.

        Args:
            lock: If True, acquires a ``SELECT FOR UPDATE`` row-lock (use inside
                  ``transaction.atomic()`` only) to prevent concurrent lost updates.
        """
        if lock:
            pref, _ = UserPreference.objects.select_for_update().get_or_create(
                user=user,
                defaults={
                    "category_scores": {},
                    "brand_scores": {},
                    "tag_scores": {},
                },
            )
        else:
            pref, _ = UserPreference.objects.get_or_create(
                user=user,
                defaults={
                    "category_scores": {},
                    "brand_scores": {},
                    "tag_scores": {},
                },
            )
        return pref

    def _save_preference(
        self,
        pref: UserPreference,
        cat_scores: Dict[str, float],
        brand_scores: Dict[str, float],
        tag_scores: Dict[str, float],
        now: datetime,
    ) -> UserPreference:
        """
        Trim scores to top-N, persist, and advance ``last_calculated_at`` to ``now``.
        """
        pref.category_scores = self._trim_scores(cat_scores, TOP_N_CATEGORIES)
        pref.brand_scores = self._trim_scores(brand_scores, TOP_N_BRANDS)
        pref.tag_scores = self._trim_scores(tag_scores, TOP_N_TAGS)
        pref.last_calculated_at = now
        pref.save(
            update_fields=[
                "category_scores",
                "brand_scores",
                "tag_scores",
                "last_calculated_at",
            ]
        )
        return pref

    # ------------------------------------------------------------------ #
    # Public API: full historical rebuild                                   #
    # ------------------------------------------------------------------ #

    def rebuild_user_preferences(self, user: User) -> UserPreference:
        """
        Full historical rebuild of preference scores for a single user.

        Reads every UserInteraction for ``user``, computes weighted + decayed
        scores for categories, brands, and tags, then persists to UserPreference.

        Use this for:
        - Initial migration / backfill
        - Recovering inconsistent data
        - Debugging
        - Correcting drift after config changes

        Do NOT call on every normal interaction -- use
        ``update_preferences_from_interaction()`` for that.

        Returns:
            The saved ``UserPreference`` instance.
        """
        now = datetime.now(tz=timezone.utc)

        # Fetch all interactions with product data pre-loaded.
        # We load product + category + parent chain.
        # IMPORTANT: do NOT use .only() here -- it conflicts with select_related
        # traversal and causes the "deferred field + select_related" Django error.
        interactions = (
            UserInteraction.objects
            .filter(user=user, product__isnull=False)
            .select_related(
                "product",
                "product__category",
                "product__category__parent",
                "product__category__parent__parent",  # Up to 3 levels deep
            )
            .order_by("created_at")
        )

        cat_scores: Dict[str, float] = defaultdict(float)
        brand_scores: Dict[str, float] = defaultdict(float)
        tag_scores: Dict[str, float] = defaultdict(float)

        for interaction in interactions.iterator(chunk_size=500):
            self._apply_interaction_to_scores(
                interaction, cat_scores, brand_scores, tag_scores, now
            )

        with transaction.atomic():
            pref = self._load_or_create_preference(user, lock=True)
            return self._save_preference(
                pref,
                dict(cat_scores),
                dict(brand_scores),
                dict(tag_scores),
                now,
            )

    def rebuild_all_user_preferences(self, batch_size: int = 200) -> int:
        """
        Rebuild preferences for every user that has at least one interaction.

        Processes users in batches to avoid loading the entire table.
        Each user's full history is read with ``iterator()`` to avoid OOM.

        Args:
            batch_size: Number of users per batch (default 200).

        Returns:
            Total number of users processed.
        """
        logger.info(
            "rebuild_all_user_preferences: starting (batch_size=%d)", batch_size
        )
        # Only process users who actually have interactions.
        user_ids = (
            UserInteraction.objects
            .values_list("user_id", flat=True)
            .distinct()
        )

        total = 0
        offset = 0

        while True:
            batch_ids = list(user_ids[offset: offset + batch_size])
            if not batch_ids:
                break

            users = User.objects.filter(pk__in=batch_ids)
            for user in users:
                try:
                    self.rebuild_user_preferences(user)
                    total += 1
                except Exception:
                    logger.exception(
                        "rebuild_all_user_preferences: failed for user_id=%s", user.pk
                    )

            offset += batch_size
            logger.info("  processed %d users so far...", total)

        logger.info("rebuild_all_user_preferences: done. Total: %d", total)
        return total

    # ------------------------------------------------------------------ #
    # Public API: incremental update (real-time, single interaction)       #
    # ------------------------------------------------------------------ #

    def update_preferences_from_interaction(
        self,
        interaction: UserInteraction,
    ) -> UserPreference:
        """
        Incrementally update a user's preferences from a **single new** interaction.

        Algorithm (O(1) -- no history rescan):
        1. Load the current UserPreference (row-locked for concurrency safety).
        2. Decay existing scores from ``last_calculated_at`` -> ``now``.
        3. Add the new interaction's contribution.
        4. Trim to top-N and save.

        This gives exact exponential decay results:
            new_score = old_score x decay(now - last_calculated_at) + new_contribution

        If ``last_calculated_at`` is None (first ever update), skip decaying step 2
        (existing scores are assumed to be at time 0 = empty).

        Args:
            interaction: A saved UserInteraction instance.  The product, category,
                         and parent chain do NOT need to be pre-fetched -- this method
                         re-fetches what it needs.

        Returns:
            The updated ``UserPreference`` instance.
        """
        # Skip product-less interactions (search etc.)
        if interaction.product_id is None:
            # Safe no-op: return existing (or empty) preference
            pref, _ = UserPreference.objects.get_or_create(
                user_id=interaction.user_id,
                defaults={
                    "category_scores": {},
                    "brand_scores": {},
                    "tag_scores": {},
                },
            )
            return pref

        # Re-fetch the interaction with full product + category chain.
        # We avoid .only() to prevent deferred-field conflict with select_related.
        try:
            full_interaction = (
                UserInteraction.objects
                .select_related(
                    "product",
                    "product__category",
                    "product__category__parent",
                    "product__category__parent__parent",
                )
                .get(pk=interaction.pk)
            )
        except UserInteraction.DoesNotExist:
            logger.warning(
                "update_preferences_from_interaction: interaction pk=%s not found.",
                interaction.pk,
            )
            return self._load_or_create_preference(interaction.user)

        now = datetime.now(tz=timezone.utc)

        with transaction.atomic():
            pref = self._load_or_create_preference(full_interaction.user, lock=True)

            # Step 2: Decay existing scores if we have a reference time.
            cat_scores = dict(pref.category_scores or {})
            brand_scores = dict(pref.brand_scores or {})
            tag_scores = dict(pref.tag_scores or {})

            if pref.last_calculated_at is not None:
                decay_factor = compute_time_decay(pref.last_calculated_at, now=now)
                cat_scores = {k: v * decay_factor for k, v in cat_scores.items()}
                brand_scores = {k: v * decay_factor for k, v in brand_scores.items()}
                tag_scores = {k: v * decay_factor for k, v in tag_scores.items()}

            # Step 3: Add new contribution (score calculated relative to now, so decay=1.0).
            self._apply_interaction_to_scores(
                full_interaction, cat_scores, brand_scores, tag_scores, now
            )

            return self._save_preference(pref, cat_scores, brand_scores, tag_scores, now)

    # ------------------------------------------------------------------ #
    # Public API: bulk incremental update                                   #
    # ------------------------------------------------------------------ #

    def update_preferences_from_interactions(
        self,
        interactions: Iterable[UserInteraction],
    ) -> Dict[str, UserPreference]:
        """
        Efficiently process a batch of interactions, potentially from multiple users.

        Groups interactions by user and processes each user's batch in a single
        read-modify-write cycle, avoiding repeated DB round-trips for the same user.

        Algorithm per user:
        1. Decay existing scores from ``last_calculated_at`` -> ``now`` (once).
        2. Apply all interactions for this user on top.
        3. Save once.

        Args:
            interactions: Iterable of UserInteraction instances (may span multiple users).

        Returns:
            Dict mapping str(user_id) -> updated UserPreference.
        """
        # Collect interaction PKs grouped by user_id.
        user_pks: Dict[str, List[int]] = defaultdict(list)
        for interaction in interactions:
            if interaction.pk is not None:
                user_pks[str(interaction.user_id)].append(interaction.pk)

        results: Dict[str, UserPreference] = {}

        for user_id_str, pks in user_pks.items():
            # Fetch all interactions for this user with full product data.
            batch = (
                UserInteraction.objects
                .filter(pk__in=pks, product__isnull=False)
                .select_related(
                    "product",
                    "product__category",
                    "product__category__parent",
                    "product__category__parent__parent",
                )
            )

            now = datetime.now(tz=timezone.utc)

            try:
                with transaction.atomic():
                    # We need the User object for get_or_create.
                    first = batch.select_related("user").first()
                    if first is None:
                        # All interactions in this batch had no product -- skip.
                        continue
                    user = first.user

                    pref = self._load_or_create_preference(user, lock=True)

                    # Decay existing scores once for the whole batch.
                    cat_scores = dict(pref.category_scores or {})
                    brand_scores = dict(pref.brand_scores or {})
                    tag_scores = dict(pref.tag_scores or {})

                    if pref.last_calculated_at is not None:
                        decay_factor = compute_time_decay(pref.last_calculated_at, now=now)
                        cat_scores = {k: v * decay_factor for k, v in cat_scores.items()}
                        brand_scores = {k: v * decay_factor for k, v in brand_scores.items()}
                        tag_scores = {k: v * decay_factor for k, v in tag_scores.items()}

                    # Apply all interactions in this batch.
                    for interaction in batch:
                        self._apply_interaction_to_scores(
                            interaction, cat_scores, brand_scores, tag_scores, now
                        )

                    pref = self._save_preference(
                        pref, cat_scores, brand_scores, tag_scores, now
                    )
                    results[user_id_str] = pref

            except Exception:
                logger.exception(
                    "update_preferences_from_interactions: failed for user_id=%s",
                    user_id_str,
                )

        return results

    # ------------------------------------------------------------------ #
    # Public API: affinity helpers for ranking service                      #
    # ------------------------------------------------------------------ #

    def get_category_affinity(
        self,
        user: User,
        category: Category,
    ) -> float:
        """
        Return the normalised [0, 1] affinity score for ``user`` x ``category``.

        Returns 0.0 if the user has no preference record, the category is not
        present in their scores, or all scores are zero.

        Keyed by category slug (stable identifier).
        """
        try:
            pref = user.preference  # OneToOne reverse accessor
        except UserPreference.DoesNotExist:
            return 0.0

        raw = pref.category_scores or {}
        if not raw:
            return 0.0

        normalised = self.normalize_scores(raw)
        return float(normalised.get(category.slug, 0.0))

    def get_brand_affinity(
        self,
        user: User,
        brand: str,
    ) -> float:
        """
        Return the normalised [0, 1] affinity score for ``user`` x ``brand``.

        Brand key is lowercased for stable lookup.
        Returns 0.0 on any missing data.
        """
        try:
            pref = user.preference
        except UserPreference.DoesNotExist:
            return 0.0

        raw = pref.brand_scores or {}
        if not raw:
            return 0.0

        normalised = self.normalize_scores(raw)
        return float(normalised.get(brand.strip().lower(), 0.0))

    def get_tag_affinity(
        self,
        user: User,
        tag: str,
    ) -> float:
        """
        Return the normalised [0, 1] affinity score for ``user`` x ``tag``.

        Tag key is lowercased for stable lookup.
        Returns 0.0 on any missing data.
        """
        try:
            pref = user.preference
        except UserPreference.DoesNotExist:
            return 0.0

        raw = pref.tag_scores or {}
        if not raw:
            return 0.0

        normalised = self.normalize_scores(raw)
        return float(normalised.get(tag.strip().lower(), 0.0))

    def get_top_preferences(
        self,
        user: User,
        top_n: int = 5,
    ) -> Dict[str, Dict[str, float]]:
        """
        Convenience method: return the top-N normalised preferences for all three
        dimensions.

        Useful for logging, debugging, and the ranking service.

        Returns:
            {
                "categories": {"electronics": 1.0, "laptops": 0.8, ...},
                "brands":     {"asus": 1.0, "hp": 0.6, ...},
                "tags":       {"gaming": 1.0, "laptop": 0.9, ...},
            }
        """
        try:
            pref = user.preference
        except UserPreference.DoesNotExist:
            return {"categories": {}, "brands": {}, "tags": {}}

        def _top(raw: dict) -> dict:
            norm = self.normalize_scores(raw or {})
            return dict(sorted(norm.items(), key=lambda kv: kv[1], reverse=True)[:top_n])

        return {
            "categories": _top(pref.category_scores),
            "brands": _top(pref.brand_scores),
            "tags": _top(pref.tag_scores),
        }