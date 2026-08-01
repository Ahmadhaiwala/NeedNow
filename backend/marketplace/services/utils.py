import math
from typing import Any, Dict, List, Optional
from django.db import models
from django.db.models import F, ExpressionWrapper, FloatField, Q
from django.db.models.functions import ACos, Cos, Radians, Sin, Cast
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.contrib.auth import get_user_model

User = get_user_model()


def get_instance(
    model_cls: Any,
    instance_or_id: Any,
    select_related: Optional[List[str]] = None,
    prefetch_related: Optional[List[str]] = None
) -> Any:
    """
    Helper function to resolve either a model instance or an ID into a model instance.
    """
    if isinstance(instance_or_id, model_cls):
        return instance_or_id

    qs = model_cls.objects.all()
    if select_related:
        qs = qs.select_related(*select_related)
    if prefetch_related:
        qs = qs.prefetch_related(*prefetch_related)

    try:
        return qs.get(id=instance_or_id)
    except model_cls.DoesNotExist:
        raise ValidationError(f"{model_cls.__name__} with ID {instance_or_id} does not exist.")


def get_user(user_or_id: Any) -> Any:
    """
    Helper function to resolve either a User instance or user ID into a User instance.
    """
    if isinstance(user_or_id, User):
        return user_or_id

    try:
        return User.objects.get(id=user_or_id)
    except User.DoesNotExist:
        raise ValidationError(f"User with ID {user_or_id} does not exist.")


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates Haversine distance in kilometers between two lat/lon pairs in Python.
    """
    R = 6371.0  # Earth radius in kilometers

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def filter_by_distance(
    queryset: models.QuerySet,
    latitude: float,
    longitude: float,
    radius_km: Optional[float] = None
) -> models.QuerySet:
    """
    Annotates Haversine distance and pre-filters using a bounding box and distance condition.
    """
    user_lat = float(latitude)
    user_lng = float(longitude)

    query_radius = float(radius_km) if radius_km else 50.0
    lat_delta = query_radius / 111.0
    cos_rad = math.cos(math.radians(user_lat))
    lng_delta = query_radius / (111.0 * abs(cos_rad)) if abs(cos_rad) > 0.01 else query_radius / 111.0

    queryset = queryset.filter(
        latitude__gte=user_lat - lat_delta,
        latitude__lte=user_lat + lat_delta,
        longitude__gte=user_lng - lng_delta,
        longitude__lte=user_lng + lng_delta
    )

    rad_lat_user = Radians(user_lat)
    rad_lng_user = Radians(user_lng)
    rad_lat_post = Radians(Cast(F('latitude'), FloatField()))
    rad_lng_post = Radians(Cast(F('longitude'), FloatField()))

    cos_diff_lng = Cos(rad_lng_post - rad_lng_user)
    sin_lat_mul = Sin(rad_lat_user) * Sin(rad_lat_post)
    cos_lat_mul = Cos(rad_lat_user) * Cos(rad_lat_post) * cos_diff_lng

    distance_expr = ExpressionWrapper(
        6371.0 * ACos(sin_lat_mul + cos_lat_mul),
        output_field=FloatField()
    )

    queryset = queryset.annotate(distance=distance_expr)

    if radius_km is not None:
        queryset = queryset.filter(distance__lte=float(radius_km))
    else:
        queryset = queryset.filter(distance__lte=F('visibility_radius'))

    return queryset.order_by('distance')


def apply_search(queryset: models.QuerySet, query: str) -> models.QuerySet:
    """
    Helper function to apply search query across post fields.
    """
    if not query or not query.strip():
        return queryset
    query = query.strip()
    return queryset.filter(
        Q(title__icontains=query) | Q(description__icontains=query) | Q(category__icontains=query)
    )


def filter_queryset(queryset: models.QuerySet, **filters) -> models.QuerySet:
    """
    Dynamically applies dictionary of lookup filters to a queryset.
    """
    cleaned_filters = {k: v for k, v in filters.items() if v is not None}
    return queryset.filter(**cleaned_filters)


def paginate_queryset(queryset: models.QuerySet, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
    """
    Paginates a Django queryset using Paginator and returns structured page dictionary.
    """
    paginator = Paginator(queryset, page_size)
    try:
        page_obj = paginator.page(page)
    except PageNotAnInteger:
        page_obj = paginator.page(1)
    except EmptyPage:
        page_obj = paginator.page(paginator.num_pages)

    return {
        'results': list(page_obj.object_list),
        'count': paginator.count,
        'total_pages': paginator.num_pages,
        'current_page': page_obj.number,
        'has_next': page_obj.has_next(),
        'has_previous': page_obj.has_previous(),
    }
