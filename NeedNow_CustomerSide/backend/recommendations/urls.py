from django.urls import path
from . import views

app_name = "recommendations"

urlpatterns = [
    # Personalised product recommendations (GET)
    path("", views.get_recommendations, name="get-recommendations"),
    # Bulk-ingest events from the frontend (POST)
    path("interactions/", views.track_interactions, name="track-interactions"),
    # Debug: view your own interactions (GET)
    path("interactions/me/", views.my_interactions, name="my-interactions"),
]
