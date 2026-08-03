from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    # User Profile Management (Neon Auth protected)
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('me/', views.me, name='user-me'),
    path('info/', views.user_info, name='user-info'),
    
    # Neon Auth utilities
    path('sync/', views.sync_neon_user, name='sync-neon-user'),
]